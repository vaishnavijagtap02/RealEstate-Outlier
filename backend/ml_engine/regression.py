"""
regression.py — Regression Models (Unit 2 Syllabus)

Implements continuous price prediction using:
- Ordinary Least Squares (OLS)
- Ridge Regression
- Huber Regression (Robust)
- Support Vector Regression (SVR - Linear & RBF)
- Bayesian Ridge Regression
"""

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression, Ridge, HuberRegressor, BayesianRidge
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, r2_score

from ml_engine.data_loader import REGRESSION_TARGET, NUMERIC_FEATURES, CATEGORICAL_FEATURES
from ml_engine.outlier_detector import remove_outliers


# Instantiate models according to syllabus
MODELS = {
    "Least Squares (OLS)": LinearRegression(),
    "Ridge Regression": Ridge(alpha=1.0),
    "Huber (Robust)": HuberRegressor(epsilon=1.35, max_iter=1000),
    "Bayesian Ridge": BayesianRidge(),
    "SVR (Linear)": SVR(kernel='linear', C=1.0),
    "SVR (RBF)": SVR(kernel='rbf', C=1.0)
}

def train_and_evaluate(df: pd.DataFrame, model_name: str):
    """Train a single model and return its metrics."""
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[REGRESSION_TARGET]
    
    from sklearn.base import clone
    
    # Always scale features for models like SVR, Ridge, and Huber to work correctly
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('model', clone(MODELS[model_name]))
    ])
    
    pipeline.fit(X, y)
    y_pred = pipeline.predict(X)
    
    mse = mean_squared_error(y, y_pred)
    r2 = r2_score(y, y_pred)
    
    return pipeline, {"mse": float(mse), "rmse": float(np.sqrt(mse)), "r2": float(r2)}


def run_regression_experiment(df: pd.DataFrame, outlier_method: str = "iqr"):
    """
    The Central Experiment: Train all models on both the Original dataset
    and the Outlier-Handled dataset. Compare performance.
    """
    clean_df, outlier_df = remove_outliers(df, method=outlier_method)
    
    results = {}
    pipelines = {}
    
    for name in MODELS.keys():
        # Train on Original (contains outliers)
        pipe_orig, metrics_orig = train_and_evaluate(df, name)
        
        # Train on Cleaned (outliers removed)
        pipe_clean, metrics_clean = train_and_evaluate(clean_df, name)
        
        results[name] = {
            "original": metrics_orig,
            "cleaned": metrics_clean,
            # How much did R2 improve after removing outliers?
            "r2_improvement": float(metrics_clean["r2"] - metrics_orig["r2"])
        }
        
        # Store pipelines in memory for future predictions
        pipelines[name] = {
            "original": pipe_orig,
            "cleaned": pipe_clean
        }
        
    return results, pipelines
