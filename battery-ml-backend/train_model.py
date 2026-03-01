import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib
import os

# Generate synthetic dataset (you can replace with real CSV)
np.random.seed(42)

rows = 1000

data = pd.DataFrame({
    "voltage": np.random.uniform(3.5, 4.2, rows),
    "current": np.random.uniform(10, 100, rows),
    "temperature": np.random.uniform(25, 70, rows),
    "efficiency": np.random.uniform(70, 100, rows),
    "soc": np.random.uniform(20, 100, rows),
    "soh": np.random.uniform(50, 100, rows),
})

# Create health score formula
data["health_score"] = (
    (data["voltage"] / 4.2) * 30 +
    (1 - data["temperature"]/100) * 20 +
    (data["efficiency"]/100) * 25 +
    (data["soh"]/100) * 25
)

# Remaining days estimation
data["remaining_days"] = data["soh"] * 5 - data["temperature"] * 0.5

X = data[["voltage", "current", "temperature", "efficiency", "soc", "soh"]]
y_health = data["health_score"]
y_days = data["remaining_days"]

# Train health model
model_health = RandomForestRegressor(n_estimators=100)
model_health.fit(X, y_health)

# Train days model
model_days = RandomForestRegressor(n_estimators=100)
model_days.fit(X, y_days)

# Save models
os.makedirs("models", exist_ok=True)

joblib.dump(model_health, "models/health_model.pkl")
joblib.dump(model_days, "models/days_model.pkl")

print("Models trained and saved successfully.")