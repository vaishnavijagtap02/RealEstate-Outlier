"""
classification.py — Classification Models (Unit 2 Syllabus)

Implements categorical prediction (Premium vs Standard) using:
- Linear Discriminant Analysis (LDA)
- Logistic Regression
- Bayesian Logistic Regression (approximated via specific priors/solvers if needed)
- Support Vector Classification (SVC - Linear & RBF)
"""

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.linear_model import LogisticRegression, BayesianRidge
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, f1_score

from ml_engine.data_loader import CLASSIFICATION_TARGET, NUMERIC_FEATURES, CATEGORICAL_FEATURES
from ml_engine.outlier_detector import remove_outliers, recalculate_premium

# Note: scikit-learn doesn't have a direct "BayesianLogisticRegression" class.
# We approximate Bayesian Logistic Regression by using standard LogisticRegression 
# with L2 penalty, which mathematically corresponds to a Gaussian prior.
# (Topics 13 & 14 in syllabus: Laplacian approximation / Bayesian logistic)
MODELS = {
    "LDA": LinearDiscriminantAnalysis(),
    "Logistic Regression": LogisticRegression(max_iter=1000),
    "Bayesian Logistic (L2 Prior)": LogisticRegression(penalty='l2', C=0.1, max_iter=1000), 
    "SVC (Linear)": SVC(kernel='linear', probability=True),
    "SVC (RBF)": SVC(kernel='rbf', probability=True)
}

def train_and_evaluate(df: pd.DataFrame, model_name: str):
    """Train a single classification model and return its metrics."""
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[CLASSIFICATION_TARGET]
    
    from sklearn.base import clone
    
    # Scale features
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('model', clone(MODELS[model_name]))
    ])
    
    pipeline.fit(X, y)
    y_pred = pipeline.predict(X)
    
    acc = accuracy_score(y, y_pred)
    f1 = f1_score(y, y_pred, average='weighted')
    
    return pipeline, {"accuracy": float(acc), "f1_score": float(f1)}


def run_classification_experiment(df: pd.DataFrame, outlier_method: str = "iqr"):
    """
    Train classification models on Original vs Cleaned dataset.
    Because removing outliers changes the SalePrice distribution, 
    we must recalculate the 'Premium' flag threshold for the cleaned dataset.
    """
    # 1. Clean the dataset
    clean_df, _ = remove_outliers(df, method=outlier_method)
    
    # 2. Recalculate what 'Premium' means on the clean dataset 
    # (since the 75th percentile price will drop when mansions are removed)
    clean_df = recalculate_premium(clean_df)
    
    results = {}
    pipelines = {}
    
    for name in MODELS.keys():
        # Train on Original
        pipe_orig, metrics_orig = train_and_evaluate(df, name)
        
        # Train on Cleaned
        pipe_clean, metrics_clean = train_and_evaluate(clean_df, name)
        
        results[name] = {
            "original": metrics_orig,
            "cleaned": metrics_clean,
            "acc_improvement": float(metrics_clean["accuracy"] - metrics_orig["accuracy"])
        }
        
        pipelines[name] = {
            "original": pipe_orig,
            "cleaned": pipe_clean
        }
        
    return results, pipelines
