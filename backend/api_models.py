from pydantic import BaseModel
from typing import Optional

class PropertyFeatures(BaseModel):
    GrLivArea: float
    TotalBsmtSF: float
    OverallQual: float
    OverallCond: float
    YearBuilt: float
    GarageCars: float
    FullBath: float
    BedroomAbvGr: float
    TotRmsAbvGrd: float
    LotArea: float
    CentralAir: int
    KitchenQual: int

class WhatIfRequest(BaseModel):
    features: PropertyFeatures
    target_price: float
    model_name: str = "Least Squares (OLS)"
    feature_name: str = "GrLivArea"
