"""
outlier_detector.py — Outlier Detection & Handling

Provides methods to detect outliers in the Ames Housing dataset
and return both the original and outlier-handled versions for
the central comparison experiment.
"""

import pandas as pd
import numpy as np
from ml_engine.data_loader import REGRESSION_TARGET, NUMERIC_FEATURES, CLASSIFICATION_TARGET, PREMIUM_QUANTILE


def detect_outliers_iqr(df: pd.DataFrame, columns: list[str] = None, factor: float = 1.5) -> pd.Series:
    """
    Detect outliers using the IQR method across specified numeric columns.

    A row is flagged as an outlier if ANY of the specified columns
    has a value outside [Q1 - factor*IQR, Q3 + factor*IQR].

    Returns a boolean Series where True = outlier.
    """
    if columns is None:
        columns = NUMERIC_FEATURES + [REGRESSION_TARGET]

    is_outlier = pd.Series(False, index=df.index)

    for col in columns:
        if col not in df.columns:
            continue
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - factor * IQR
        upper = Q3 + factor * IQR
        is_outlier = is_outlier | (df[col] < lower) | (df[col] > upper)

    return is_outlier


def detect_outliers_zscore(df: pd.DataFrame, columns: list[str] = None, threshold: float = 3.0) -> pd.Series:
    """
    Detect outliers using the Z-score method.

    A row is flagged as an outlier if ANY of the specified columns
    has an absolute Z-score greater than the threshold.

    Returns a boolean Series where True = outlier.
    """
    if columns is None:
        columns = NUMERIC_FEATURES + [REGRESSION_TARGET]

    is_outlier = pd.Series(False, index=df.index)

    for col in columns:
        if col not in df.columns:
            continue
        z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
        is_outlier = is_outlier | (z_scores > threshold)

    return is_outlier


def remove_outliers(df: pd.DataFrame, method: str = "iqr", **kwargs) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split the dataset into clean and outlier subsets.

    Parameters
    ----------
    df : pd.DataFrame
        The preprocessed dataset.
    method : str
        "iqr" or "zscore".
    **kwargs
        Passed to the detection function (e.g., factor, threshold).

    Returns
    -------
    (clean_df, outlier_df) : tuple of DataFrames
    """
    if method == "iqr":
        mask = detect_outliers_iqr(df, **kwargs)
    elif method == "zscore":
        mask = detect_outliers_zscore(df, **kwargs)
    else:
        raise ValueError(f"Unknown method: {method}. Use 'iqr' or 'zscore'.")

    clean_df = df[~mask].reset_index(drop=True)
    outlier_df = df[mask].reset_index(drop=True)
    return clean_df, outlier_df


def recalculate_premium(df: pd.DataFrame) -> pd.DataFrame:
    """
    Recalculate the Premium classification target on a (potentially cleaned)
    dataset using the same quantile threshold approach.
    """
    threshold = df[REGRESSION_TARGET].quantile(PREMIUM_QUANTILE)
    df = df.copy()
    df[CLASSIFICATION_TARGET] = (df[REGRESSION_TARGET] >= threshold).astype(int)
    return df


def get_outlier_summary(df: pd.DataFrame, method: str = "iqr", **kwargs) -> dict:
    """
    Return a JSON-serializable summary of outlier detection results.
    """
    if method == "iqr":
        mask = detect_outliers_iqr(df, **kwargs)
    else:
        mask = detect_outliers_zscore(df, **kwargs)

    outlier_df = df[mask]
    clean_df = df[~mask]

    # Per-feature outlier counts
    per_feature = {}
    columns = kwargs.get("columns", NUMERIC_FEATURES + [REGRESSION_TARGET])
    for col in columns:
        if col not in df.columns:
            continue
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        count = int(((df[col] < lower) | (df[col] > upper)).sum())
        per_feature[col] = {
            "outlier_count": count,
            "lower_bound": float(lower),
            "upper_bound": float(upper),
            "min": float(df[col].min()),
            "max": float(df[col].max()),
        }

    return {
        "method": method,
        "total_rows": len(df),
        "outlier_count": int(mask.sum()),
        "clean_count": int((~mask).sum()),
        "outlier_percentage": round(float(mask.sum()) / len(df) * 100, 2),
        "per_feature": per_feature,
        "outlier_price_stats": {
            "mean": float(outlier_df[REGRESSION_TARGET].mean()) if len(outlier_df) > 0 else 0,
            "median": float(outlier_df[REGRESSION_TARGET].median()) if len(outlier_df) > 0 else 0,
        },
        "clean_price_stats": {
            "mean": float(clean_df[REGRESSION_TARGET].mean()),
            "median": float(clean_df[REGRESSION_TARGET].median()),
        },
    }


# ---------------------------------------------------------------------------
# Smoke test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from ml_engine.data_loader import get_dataset

    df = get_dataset()
    print(f"Dataset: {df.shape}")

    # IQR method
    clean, outliers = remove_outliers(df, method="iqr")
    print(f"\nIQR Method:")
    print(f"  Clean: {len(clean)}, Outliers: {len(outliers)}")

    summary = get_outlier_summary(df, method="iqr")
    print(f"  Outlier %: {summary['outlier_percentage']}%")

    # Z-score method
    clean_z, outliers_z = remove_outliers(df, method="zscore")
    print(f"\nZ-Score Method:")
    print(f"  Clean: {len(clean_z)}, Outliers: {len(outliers_z)}")
