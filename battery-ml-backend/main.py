from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models
health_model = joblib.load("models/health_model.pkl")
days_model = joblib.load("models/days_model.pkl")

# Input schema
class BatteryInput(BaseModel):
    voltage: float
    current: float
    temperature: float
    efficiency: float
    soc: float
    soh: float

@app.post("/predict")
def predict(data: BatteryInput):

    features = np.array([[
        data.voltage,
        data.current,
        data.temperature,
        data.efficiency,
        data.soc,
        data.soh
    ]])

    health_score = health_model.predict(features)[0]
    remaining_days = days_model.predict(features)[0]

    return {
        "health_score": round(float(health_score), 2),
        "remaining_days": round(float(remaining_days), 1)
    }