# RealEstate-Outlier 🏠🚨

**RealEstate-Outlier** is a full-stack Machine Learning application built to predict house prices while demonstrating the impact of outlier handling. It allows users to compare ML model performance on an original dataset versus an outlier-cleaned dataset. 

---

## 📖 Project Description
The project uses the Ames Housing dataset to predict property prices. Its core focus is on **Outlier Analysis**, showing how models behave differently when extreme values (outliers) are retained versus when they are systematically handled (using IQR and Z-score methods).

## ✨ Main Features
- **Data Explorer:** Browse and visualize the Ames dataset with highlighted outliers.
- **Outlier Impact Dashboard:** Side-by-side metric comparison (Original vs. Cleaned Data).
- **"What-if" Experimentation:** Inject extreme custom properties to observe shifts in model predictions.
- **Model Comparison Arena:** Compare various models based on metrics like MSE, R², Accuracy, and F1-score.
- **Price Predictor:** Input property details and get real-time price predictions.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, TailwindCSS (or Vanilla CSS)
- **Backend:** FastAPI (Python)
- **Machine Learning:** scikit-learn, pandas, numpy

## 🧠 ML Component
The ML engine trains multiple models to handle both regression and classification tasks:
- **Regression (Target: `SalePrice`):** OLS, Ridge, Huber, Bayesian Regression, SVR.
- **Classification (Target: `Premium`):** Logistic Regression, LDA, Bayesian Classification, SVC.
Every model is trained twice: once on the raw data and once on the outlier-handled dataset, providing a robust comparison of performance.

---

## 🚀 Setup & Run Instructions

### Prerequisites
- Node.js 18+
- Python 3.9+

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
The backend API will be available at `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be available at `http://localhost:5173`.