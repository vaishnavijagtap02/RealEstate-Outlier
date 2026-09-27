"""
data_loader.py — Ames Housing Dataset Loader & Preprocessor

Loads the Ames Housing dataset from OpenML, selects a curated subset
of features relevant to the Unit-2 Linear Models syllabus, handles
missing values and categorical encoding, and provides both regression
and classification targets.

Dataset: Ames Housing (OpenML "house_prices", 1460 rows, 81 columns)
Target (Regression): SalePrice
Target (Classification): Premium (1 if SalePrice >= 75th percentile, else 0)

Selected Features (12):
  Numeric (10):
    - GrLivArea      : Above grade living area in sq ft (key outlier source)
    - TotalBsmtSF    : Total basement area in sq ft
    - OverallQual    : Overall material and finish quality (1-10)
    - OverallCond    : Overall condition rating (1-10)
    - YearBuilt      : Original construction year
    - GarageCars     : Size of garage in car capacity
    - FullBath       : Full bathrooms above grade
    - BedroomAbvGr   : Bedrooms above grade
    - TotRmsAbvGrd   : Total rooms above grade (excl. bathrooms)
    - LotArea        : Lot size in sq ft

  Categorical (2, encoded):
    - CentralAir     : Central air conditioning (Y=1, N=0)
    - KitchenQual    : Kitchen quality (ordinal: Ex=4, Gd=3, TA=2, Fa=1, Po=0)
"""

import pandas as pd
import numpy as np
from sklearn.datasets import fetch_openml


# ---------------------------------------------------------------------------
# Feature configuration
# ---------------------------------------------------------------------------
NUMERIC_FEATURES = [
    "GrLivArea",
    "TotalBsmtSF",
    "OverallQual",
    "OverallCond",
    "YearBuilt",
    "GarageCars",
    "FullBath",
    "BedroomAbvGr",
    "TotRmsAbvGrd",
    "LotArea",
]

CATEGORICAL_FEATURES = [
    "CentralAir",
    "KitchenQual",
]

ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

KITCHEN_QUAL_MAP = {"Po": 0, "Fa": 1, "TA": 2, "Gd": 3, "Ex": 4}
CENTRAL_AIR_MAP = {"N": 0, "Y": 1}

REGRESSION_TARGET = "SalePrice"
CLASSIFICATION_TARGET = "Premium"

# Threshold for the derived classification target (75th percentile)
PREMIUM_QUANTILE = 0.75


# ---------------------------------------------------------------------------
# Core loader
# ---------------------------------------------------------------------------
def load_ames_raw() -> pd.DataFrame:
    """Fetch Ames Housing from OpenML and return the raw DataFrame."""
    ames = fetch_openml(name="house_prices", as_frame=True, parser="auto")
    return ames.frame


def preprocess(df: pd.DataFrame) -> pd.DataFrame:
    """
    Select features, encode categoricals, impute missing values, and
    add the derived classification target.

    Parameters
    ----------
    df : pd.DataFrame
        Raw Ames Housing DataFrame (81 columns).

    Returns
    -------
    pd.DataFrame
        Cleaned DataFrame with selected features + SalePrice + Premium.
    """
    # Select only the columns we need
    cols = ALL_FEATURES + [REGRESSION_TARGET]
    out = df[cols].copy()

    # --- Encode categoricals ---
    out["CentralAir"] = out["CentralAir"].map(CENTRAL_AIR_MAP)
    out["KitchenQual"] = out["KitchenQual"].map(KITCHEN_QUAL_MAP)

    # --- Impute missing values (median for numeric, mode for categorical) ---
    for col in out.columns:
        if out[col].isna().any():
            if out[col].dtype in ("float64", "int64"):
                out[col] = out[col].fillna(out[col].median())
            else:
                out[col] = out[col].fillna(out[col].mode()[0])

    # Ensure all columns are numeric after encoding
    out = out.astype(float)

    # --- Derived classification target ---
    threshold = out[REGRESSION_TARGET].quantile(PREMIUM_QUANTILE)
    out[CLASSIFICATION_TARGET] = (out[REGRESSION_TARGET] >= threshold).astype(int)

    return out


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def get_dataset() -> pd.DataFrame:
    """Load, preprocess, and return the Ames Housing dataset."""
    raw = load_ames_raw()
    return preprocess(raw)


def get_feature_names() -> list[str]:
    """Return the list of feature column names (after encoding)."""
    return NUMERIC_FEATURES + CATEGORICAL_FEATURES


def get_dataset_summary(df: pd.DataFrame) -> dict:
    """Return a JSON-serializable summary of the dataset."""
    return {
        "num_rows": len(df),
        "num_features": len(ALL_FEATURES),
        "features": ALL_FEATURES,
        "regression_target": REGRESSION_TARGET,
        "classification_target": CLASSIFICATION_TARGET,
        "premium_threshold": float(df[REGRESSION_TARGET].quantile(PREMIUM_QUANTILE)),
        "price_stats": {
            "mean": float(df[REGRESSION_TARGET].mean()),
            "median": float(df[REGRESSION_TARGET].median()),
            "std": float(df[REGRESSION_TARGET].std()),
            "min": float(df[REGRESSION_TARGET].min()),
            "max": float(df[REGRESSION_TARGET].max()),
        },
        "missing_values": {
            col: int(df[col].isna().sum()) for col in df.columns
        },
    }


# ---------------------------------------------------------------------------
# Quick smoke test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("Loading Ames Housing dataset...")
    dataset = get_dataset()
    print(f"Shape: {dataset.shape}")
    print(f"\nColumns: {list(dataset.columns)}")
    print(f"\nFirst 5 rows:\n{dataset.head()}")
    print(f"\nPremium class distribution:\n{dataset['Premium'].value_counts()}")
    print(f"\nDataset summary:")
    summary = get_dataset_summary(dataset)
    for k, v in summary.items():
        print(f"  {k}: {v}")
