from datetime import datetime, timedelta, timezone
import base64
import hashlib
import hmac
import os
from pathlib import Path
import secrets
import sqlite3
from typing import Any

import joblib
import numpy as np
from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Battery ML + Hardware Integration API", version="1.0.0")

# Enable CORS for frontend and hardware gateways.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = Path(__file__).resolve().parent / "models"
health_model = joblib.load(MODELS_DIR / "health_model.pkl")
days_model = joblib.load(MODELS_DIR / "days_model.pkl")
# Temporary fix: disable battery model loading until model file/path is confirmed.
# battery_model = joblib.load(Path(__file__).resolve().parent / "battery_model.pkl")

# In-memory telemetry storage. Replace with Redis/DB for production.
telemetry_store: dict[str, list[dict[str, Any]]] = {}
SESSION_TTL_HOURS = 24
DATABASE_PATH = Path(__file__).resolve().parent / "dms_auth.db"
active_sessions: dict[str, dict[str, Any]] = {}
latest_data: dict[str, float] = {}


def _get_db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def _initialize_auth_db() -> None:
    with _get_db_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_salt TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def _hash_password(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120000)


def _build_password_pair(password: str) -> tuple[str, str]:
    salt = secrets.token_bytes(16)
    hashed = _hash_password(password, salt)
    return base64.b64encode(salt).decode("utf-8"), base64.b64encode(hashed).decode("utf-8")


def _verify_password(password: str, encoded_salt: str, encoded_hash: str) -> bool:
    salt = base64.b64decode(encoded_salt.encode("utf-8"))
    stored_hash = base64.b64decode(encoded_hash.encode("utf-8"))
    provided_hash = _hash_password(password, salt)
    return hmac.compare_digest(provided_hash, stored_hash)


def _create_session(user: dict[str, Any]) -> dict[str, Any]:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS)
    active_sessions[token] = {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "expires_at": expires_at,
    }
    return {
        "token": token,
        "token_type": "bearer",
        "expires_at": expires_at,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
        },
    }


def _get_configured_api_keys() -> list[str]:
    raw = os.getenv("DMS_API_KEYS", "")
    env_keys = [key.strip() for key in raw.split(",") if key.strip()]
    return env_keys


def require_api_key(x_api_key: str | None = Header(default=None, alias="X-API-Key")) -> str:
    configured_keys = _get_configured_api_keys()
    if not configured_keys:
        raise HTTPException(
            status_code=503,
            detail="API keys are not configured on server",
        )

    if x_api_key is None:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    if not any(secrets.compare_digest(x_api_key, key) for key in configured_keys):
        raise HTTPException(status_code=401, detail="Invalid API key")

    return x_api_key


def require_auth_user(authorization: str | None = Header(default=None, alias="Authorization")) -> dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    session = active_sessions.get(token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session token")

    if session["expires_at"] < datetime.now(timezone.utc):
        active_sessions.pop(token, None)
        raise HTTPException(status_code=401, detail="Session expired")

    return session


class BatteryInput(BaseModel):
    voltage: float
    current: float
    temperature: float
    efficiency: float
    soc: float
    soh: float


class SensorData(BaseModel):
    voltage: float
    current: float
    temperature: float


class HardwareTelemetryInput(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=64)
    voltage: float
    current: float
    temperature: float
    soc: float
    efficiency: float | None = None
    soh: float | None = None
    timestamp: datetime | None = None
    metadata: dict[str, Any] | None = None


class SignupInput(BaseModel):
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field("user")


class LoginInput(BaseModel):
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)


def _predict_from_battery_input(data: BatteryInput) -> dict[str, float]:
    features = np.array(
        [[data.voltage, data.current, data.temperature, data.efficiency, data.soc, data.soh]]
    )

    health_score = health_model.predict(features)[0]
    remaining_days = days_model.predict(features)[0]

    return {
        "health_score": round(float(health_score), 2),
        "remaining_days": round(float(remaining_days), 1),
    }


def _normalize_email(email: str) -> str:
    return email.strip().lower()


_initialize_auth_db()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/signup")
def signup(data: SignupInput) -> dict[str, Any]:
    email = _normalize_email(data.email)
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")

    role = data.role.strip().lower()
    if role not in {"user", "admin"}:
        raise HTTPException(status_code=400, detail="Role must be either 'user' or 'admin'")

    encoded_salt, encoded_hash = _build_password_pair(data.password)
    created_at = datetime.now(timezone.utc).isoformat()

    try:
        with _get_db_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO users (email, password_salt, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (email, encoded_salt, encoded_hash, role, created_at),
            )
            conn.commit()
            user_id = int(cursor.lastrowid)
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Email is already registered") from exc

    user = {"id": user_id, "email": email, "role": role}
    return _create_session(user)


@app.post("/auth/login")
def login(data: LoginInput) -> dict[str, Any]:
    email = _normalize_email(data.email)

    with _get_db_connection() as conn:
        row = conn.execute(
            "SELECT id, email, role, password_salt, password_hash FROM users WHERE email = ?",
            (email,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not _verify_password(data.password, row["password_salt"], row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = {"id": int(row["id"]), "email": row["email"], "role": row["role"]}
    return _create_session(user)


@app.get("/auth/me")
def me(user: dict[str, Any] = Depends(require_auth_user)) -> dict[str, Any]:
    return {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "expires_at": user["expires_at"],
    }


@app.post("/auth/logout")
def logout(authorization: str | None = Header(default=None, alias="Authorization")) -> dict[str, str]:
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        active_sessions.pop(token, None)
    return {"message": "Logged out"}


@app.post("/predict")
def predict(data: BatteryInput) -> dict[str, float]:
    return _predict_from_battery_input(data)


@app.post("/sensor")
def receive_sensor(data: SensorData) -> dict[str, float | str]:
    global latest_data

    input_data = [[data.voltage, data.current, data.temperature]]
    # Temporary fix: disable prediction while battery_model is not loaded.
    # prediction = battery_model.predict(input_data)[0]
    # health_score = max(0, min(100, 100 - float(prediction)))
    health_score = 0.0

    latest_data = {
        "voltage": data.voltage,
        "current": data.current,
        "temperature": data.temperature,
        "health_score": health_score,
    }

    return {"message": "data received", "health_score": health_score}


@app.get("/sensor")
def get_data() -> dict[str, float]:
    return latest_data


@app.post("/hardware/telemetry")
def receive_telemetry(data: HardwareTelemetryInput) -> dict[str, Any]:
    print("Received Data:", data)

    degradation = 100 - data.soc
    risk = "High" if degradation > 30 else "Low"

    payload = data.model_dump()
    payload["timestamp"] = payload["timestamp"] or datetime.now(timezone.utc)

    device_points = telemetry_store.setdefault(data.device_id, [])
    device_points.append(payload)

    # Keep only latest 1000 records per device to avoid unbounded memory growth.
    if len(device_points) > 1000:
        telemetry_store[data.device_id] = device_points[-1000:]

    return {
        "status": "received",
        "predicted_degradation": degradation,
        "warranty_risk": risk,
    }


@app.get("/hardware/devices")
def list_devices() -> dict[str, Any]:
    devices: list[dict[str, Any]] = []

    for device_id, points in telemetry_store.items():
        last_seen = points[-1]["timestamp"] if points else None
        devices.append(
            {
                "device_id": device_id,
                "total_points": len(points),
                "last_seen": last_seen,
            }
        )

    return {"devices": devices, "count": len(devices)}


@app.get("/hardware/telemetry/latest")
def get_latest_telemetry(
    device_id: str = Query(..., min_length=1),
) -> dict[str, Any]:
    points = telemetry_store.get(device_id)
    if not points:
        raise HTTPException(status_code=404, detail=f"No telemetry found for device_id '{device_id}'")

    return points[-1]


@app.get("/hardware/telemetry/history")
def get_telemetry_history(
    device_id: str = Query(..., min_length=1),
    limit: int = Query(100, ge=1, le=1000),
) -> dict[str, Any]:
    points = telemetry_store.get(device_id)
    if not points:
        raise HTTPException(status_code=404, detail=f"No telemetry found for device_id '{device_id}'")

    return {
        "device_id": device_id,
        "count": min(limit, len(points)),
        "points": points[-limit:],
    }


@app.post("/hardware/predict/latest")
def predict_from_latest_telemetry(
    device_id: str = Query(..., min_length=1),
) -> dict[str, Any]:
    points = telemetry_store.get(device_id)
    if not points:
        raise HTTPException(status_code=404, detail=f"No telemetry found for device_id '{device_id}'")

    latest = points[-1]
    required_fields = ["efficiency", "soc", "soh"]
    missing_fields = [field for field in required_fields if latest.get(field) is None]
    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Latest telemetry is missing fields required for ML prediction",
                "missing_fields": missing_fields,
            },
        )

    prediction_input = BatteryInput(
        voltage=float(latest["voltage"]),
        current=float(latest["current"]),
        temperature=float(latest["temperature"]),
        efficiency=float(latest["efficiency"]),
        soc=float(latest["soc"]),
        soh=float(latest["soh"]),
    )

    prediction = _predict_from_battery_input(prediction_input)

    return {
        "device_id": device_id,
        "timestamp": latest["timestamp"],
        "input": prediction_input.model_dump(),
        "prediction": prediction,
    }
