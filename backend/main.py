"""
main.py — FastAPI Backend for RealEstate-Outlier

REST API serving the ML Engine. Endpoints for:
- Dataset summary & exploration
- Outlier detection & analysis
- Model training (original vs. outlier-handled)
- Price prediction for new properties
- "What-if Outlier" experiment
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ml_engine.data_loader import get_dataset, get_dataset_summary, get_feature_names, REGRESSION_TARGET, NUMERIC_FEATURES, CATEGORICAL_FEATURES
from ml_engine.outlier_detector import get_outlier_summary, remove_outliers, detect_outliers_iqr, detect_outliers_zscore
from ml_engine.regression import run_regression_experiment, train_and_evaluate
from ml_engine.classification import run_classification_experiment
from api_models import PropertyFeatures, WhatIfRequest
import pandas as pd
import numpy as np
from fastapi import HTTPException

app = FastAPI(title="RealEstate-Outlier ML API")

# Global variables to hold trained models in memory
trained_pipelines = {
    "regression": None,
    "classification": None
}

# Add cache for results to prevent redundant training
cached_results = {
    "regression": None,
    "classification": None
}
cached_methods = {
    "regression": None,
    "classification": None
}

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to the RealEstate-Outlier API"}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ML Engine"}


@app.get("/api/data/summary")
def data_summary():
    """Return dataset overview: shape, features, price stats, missing values."""
    df = get_dataset()
    return get_dataset_summary(df)


@app.get("/api/data/sample")
def data_sample(n: int = 10):
    """Return a sample of n rows from the dataset."""
    df = get_dataset()
    sample = df.head(n)
    return {
        "columns": list(sample.columns),
        "data": sample.to_dict(orient="records"),
    }


@app.get("/api/outliers/summary")
def outlier_summary(method: str = "iqr"):
    """Return outlier detection summary (IQR or Z-score)."""
    df = get_dataset()
    return get_outlier_summary(df, method=method)


@app.get("/api/outliers/scatter")
def outlier_scatter(feature: str = "GrLivArea", method: str = "iqr"):
    """Return scatter plot data for a specific feature vs SalePrice with outlier flags."""
    df = get_dataset()
    if feature not in df.columns:
        raise HTTPException(status_code=400, detail=f"Feature {feature} not found.")
        
    if method == "iqr":
        mask = detect_outliers_iqr(df)
    elif method == "zscore":
        mask = detect_outliers_zscore(df)
    else:
        raise HTTPException(status_code=400, detail="Method must be 'iqr' or 'zscore'.")
        
    subset = df[[feature, REGRESSION_TARGET]].copy()
    subset['is_outlier'] = mask
    
    return {
        "status": "success",
        "feature": feature,
        "target": REGRESSION_TARGET,
        "data": subset.to_dict(orient="records")
    }



@app.get("/api/features")
def features():
    """Return the list of feature names used by the models."""
    return {"features": get_feature_names()}


@app.post("/api/models/train/regression")
def train_regression(method: str = "iqr"):
    """Run the central experiment for regression models."""
    global trained_pipelines, cached_results, cached_methods
    if cached_methods["regression"] == method and cached_results["regression"] is not None:
        return {"status": "success", "results": cached_results["regression"]}

    df = get_dataset()
    results, pipelines = run_regression_experiment(df, outlier_method=method)
    
    # Store in memory
    trained_pipelines["regression"] = pipelines
    cached_results["regression"] = results
    cached_methods["regression"] = method
    
    return {"status": "success", "results": results}


@app.post("/api/models/train/classification")
def train_classification(method: str = "iqr"):
    """Run the central experiment for classification models."""
    global trained_pipelines, cached_results, cached_methods
    if cached_methods["classification"] == method and cached_results["classification"] is not None:
        return {"status": "success", "results": cached_results["classification"]}

    df = get_dataset()
    results, pipelines = run_classification_experiment(df, outlier_method=method)
    
    # Store in memory
    trained_pipelines["classification"] = pipelines
    cached_results["classification"] = results
    cached_methods["classification"] = method
    
    return {"status": "success", "results": results}

@app.post("/api/predict")
def predict(req: PropertyFeatures):
    """Predict house price and premium classification using the trained models."""
    if not trained_pipelines["regression"]:
        raise HTTPException(status_code=400, detail="Regression models not trained yet. Call /api/models/train/regression first.")
        
    # Convert request to DataFrame
    input_data = pd.DataFrame([req.model_dump()])
    
    predictions = {"regression": {}, "classification": {}}
    
    # --- Regression Predictions ---
    reg_pipelines = trained_pipelines["regression"]
    for model_name, pipes in reg_pipelines.items():
        # Get the cleaned pipeline
        pipe = pipes.get("cleaned")
        if not pipe:
            continue
            
        if model_name == "Bayesian Ridge":
            # For Bayesian Ridge, we can get standard deviation
            try:
                # pipeline steps: scaler -> model
                X_scaled = pipe[:-1].transform(input_data)
                pred, std = pipe[-1].predict(X_scaled, return_std=True)
                predictions["regression"][model_name] = {
                    "price": float(pred[0]),
                    "std": float(std[0]),
                    "lower_bound": float(pred[0] - 1.96 * std[0]),
                    "upper_bound": float(pred[0] + 1.96 * std[0])
                }
            except Exception as e:
                # Fallback if pipeline structure differs
                pred = pipe.predict(input_data)
                predictions["regression"][model_name] = {"price": float(pred[0])}
        else:
            pred = pipe.predict(input_data)
            predictions["regression"][model_name] = {"price": float(pred[0])}
            
    # --- Classification Predictions ---
    cls_pipelines = trained_pipelines["classification"]
    if cls_pipelines:
        for model_name, pipes in cls_pipelines.items():
            pipe = pipes.get("cleaned")
            if not pipe:
                continue
            
            try:
                # Get probabilities if supported
                prob = pipe.predict_proba(input_data)[0]
                pred_class = pipe.predict(input_data)[0]
                predictions["classification"][model_name] = {
                    "is_premium": int(pred_class),
                    "probability": float(prob[1]) if len(prob) > 1 else None
                }
            except Exception:
                pred_class = pipe.predict(input_data)[0]
                predictions["classification"][model_name] = {
                    "is_premium": int(pred_class),
                    "probability": None
                }
            
    return {"status": "success", "predictions": predictions}


@app.post("/api/outliers/what-if")
def what_if_experiment(req: WhatIfRequest):
    """Inject a custom property into the dataset and see how it affects the model."""
    df = get_dataset()
    
    # Run original model (before injection)
    # To save time, we just train a single model on the clean dataset
    clean_df, _ = remove_outliers(df, method="iqr")
    
    # Train before
    pipe_before, metrics_before = train_and_evaluate(clean_df, req.model_name)
    
    # Inject outlier
    new_row = req.features.model_dump()
    new_row[REGRESSION_TARGET] = req.target_price
    
    # Create new DataFrame with the injected row
    injected_df = pd.concat([clean_df, pd.DataFrame([new_row])], ignore_index=True)
    
    # Train after
    pipe_after, metrics_after = train_and_evaluate(injected_df, req.model_name)
    
    # Get predictions for the injected point from both models to see how the model shifted towards it
    input_features = pd.DataFrame([req.features.model_dump()])
    pred_before = pipe_before.predict(input_features)[0]
    pred_after = pipe_after.predict(input_features)[0]
    
    # Get a sample of points for visualizing the regression change
    # We will pick a few points across the range of the requested feature, keeping other features at median
    medians = clean_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES].median().to_dict()
    
    feature = req.feature_name
    if feature not in df.columns:
        feature = "GrLivArea"  # Fallback
        
    injected_val = getattr(req.features, feature, df[feature].median())
        
    # Create line data
    line_data = []
    min_val = df[feature].min()
    max_val = max(df[feature].max(), injected_val * 1.1)
    
    for val in np.linspace(min_val, max_val, 20):
        pt = medians.copy()
        pt[feature] = val
        pt_df = pd.DataFrame([pt])
        line_data.append({
            feature: float(val),
            "pred_before": float(pipe_before.predict(pt_df)[0]),
            "pred_after": float(pipe_after.predict(pt_df)[0])
        })
    
    return {
        "status": "success",
        "metrics_before": metrics_before,
        "metrics_after": metrics_after,
        "prediction_before": float(pred_before),
        "prediction_after": float(pred_after),
        "target_price": req.target_price,
        "feature_name": feature,
        "line_data": line_data
    }
