import os
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import pandas as pd
import numpy as np
import joblib
from datetime import datetime

try:
    from train import train_model
except ImportError:
    from backend.train import train_model

app = FastAPI(title="Life Quality Predictor ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "livability_model.pkl")
model_bundle = None
backend_logs: List[str] = []

def log_event(message: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {message}"
    backend_logs.append(formatted)
    if len(backend_logs) > 50:
        backend_logs.pop(0)
    print(formatted)

def load_model_bundle():
    global model_bundle
    if os.path.exists(MODEL_PATH):
        try:
            model_bundle = joblib.load(MODEL_PATH)
            log_event("Successfully loaded model bundle.")
            return True
        except Exception as e:
            log_event(f"Error loading model bundle: {str(e)}")
            model_bundle = None
    else:
        log_event("No model found. Call POST /train to initialize.")
        model_bundle = None
    return False

load_model_bundle()

class CityFeatures(BaseModel):
    name: Optional[str] = "Custom City"
    aqi: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    green_cover: Optional[float] = None
    hospital_density: Optional[float] = None
    school_density: Optional[float] = None
    internet_score: Optional[float] = None
    population_density: Optional[float] = None
    crime_rate: Optional[float] = None
    employment_rate: Optional[float] = None
    cost_of_living: Optional[float] = None
    climate_zone: Optional[str] = None
    development_tier: Optional[str] = None

@app.get("/")
def read_root():
    return {"status": "online", "service": "Life Quality Predictor ML Service"}

@app.get("/status")
def get_status():
    global model_bundle
    if model_bundle is None:
        load_model_bundle()
    if model_bundle is not None:
        return {
            "status": "ready",
            "metrics": model_bundle.get("metrics"),
            "feature_importances": model_bundle.get("feature_importances")
        }
    return {"status": "not_trained"}

@app.get("/logs")
def get_logs():
    return {"logs": backend_logs}

@app.post("/train")
def run_training():
    global model_bundle
    try:
        log_event("Triggering model training pipeline...")
        csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dataset.csv")
        bundle = train_model(csv_path=csv_path, model_output_path=MODEL_PATH)
        model_bundle = bundle
        log_event(f"Model trained successfully. Samples: {bundle['metrics']['samples_count']}, R2: {bundle['metrics']['r2']:.4f}")
        return {"success": True, "metrics": bundle["metrics"]}
    except Exception as e:
        log_event(f"Training failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
def predict_livability(features: CityFeatures):
    global model_bundle
    if model_bundle is None:
        if not load_model_bundle():
            raise HTTPException(status_code=400, detail="Model not trained.")
    try:
        input_dict = features.model_dump()
        city_name = input_dict.pop('name', 'Custom City')
        

        feature_names = model_bundle["feature_names"]
        df_input = pd.DataFrame([input_dict])[feature_names]
        

        pred = model_bundle["pipeline"].predict(df_input)[0]
        predicted_score = max(0.0, min(100.0, float(pred)))
        
        log_event(f"Prediction for '{city_name}': {predicted_score:.2f}")
        return {"success": True, "predicted_score": round(predicted_score, 2)}
    except Exception as e:
        log_event(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
