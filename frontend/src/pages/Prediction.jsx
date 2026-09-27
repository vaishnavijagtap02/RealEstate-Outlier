import { useState } from 'react';
import { Home, Calculator, AlertCircle } from 'lucide-react';
import api from '../api/client';

export default function Prediction() {
  const [formData, setFormData] = useState({
    GrLivArea: 1500,
    TotalBsmtSF: 1000,
    OverallQual: 6,
    OverallCond: 5,
    YearBuilt: 1990,
    GarageCars: 2,
    FullBath: 2,
    BedroomAbvGr: 3,
    TotRmsAbvGrd: 6,
    LotArea: 8000,
    CentralAir: 1,
    KitchenQual: 2
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post('/predict', formData);
      setResult(res.data.predictions);
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed. Ensure models are trained.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex flex-col items-center justify-center text-center p-4">
        <div className="bg-secondary-light/10 dark:bg-secondary-dark/10 p-4 rounded-full mb-4">
          <Home size={48} className="text-secondary-light dark:text-secondary-dark" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Real Estate Predictor</h2>
        <p className="text-light-muted dark:text-dark-muted max-w-xl text-md">
          Input property features to get real-time price predictions and confidence intervals using our trained models.
        </p>
      </div>

      {error && (
        <div className="bg-danger-light/10 text-danger-light dark:text-danger-dark p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
            <Calculator className="text-primary-light dark:text-primary-dark" />
            Property Features
          </h3>
          <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Numeric Inputs */}
            <div>
              <label className="block text-sm font-medium mb-1">Above Grade Living Area (sqft)</label>
              <input type="number" name="GrLivArea" value={formData.GrLivArea} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Basement Area (sqft)</label>
              <input type="number" name="TotalBsmtSF" value={formData.TotalBsmtSF} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lot Area (sqft)</label>
              <input type="number" name="LotArea" value={formData.LotArea} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year Built</label>
              <input type="number" name="YearBuilt" value={formData.YearBuilt} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required min="1800" max={new Date().getFullYear()} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Overall Quality (1-10)</label>
              <input type="number" name="OverallQual" value={formData.OverallQual} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required min="1" max="10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Overall Condition (1-10)</label>
              <input type="number" name="OverallCond" value={formData.OverallCond} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required min="1" max="10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Garage Cars</label>
              <input type="number" name="GarageCars" value={formData.GarageCars} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required min="0" max="5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Full Bathrooms</label>
              <input type="number" name="FullBath" value={formData.FullBath} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required min="0" max="5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bedrooms Above Grade</label>
              <input type="number" name="BedroomAbvGr" value={formData.BedroomAbvGr} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required min="0" max="10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Rooms Above Grade</label>
              <input type="number" name="TotRmsAbvGrd" value={formData.TotRmsAbvGrd} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required min="1" max="15" />
            </div>

            {/* Categorical Inputs */}
            <div>
              <label className="block text-sm font-medium mb-1">Central Air</label>
              <select name="CentralAir" value={formData.CentralAir} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border">
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kitchen Quality</label>
              <select name="KitchenQual" value={formData.KitchenQual} onChange={handleChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border">
                <option value={4}>Excellent</option>
                <option value={3}>Good</option>
                <option value={2}>Typical/Average</option>
                <option value={1}>Fair</option>
                <option value={0}>Poor</option>
              </select>
            </div>

            <div className="sm:col-span-2 mt-4">
              <button type="submit" disabled={loading} className="w-full min-h-[48px] bg-primary-light dark:bg-primary-dark text-white rounded-md font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? 'Predicting...' : 'Predict Sale Price'}
              </button>
            </div>
          </form>
        </div>

        {/* Results Panel */}
        <div className="card">
          <h3 className="text-xl font-semibold mb-6 border-b border-light-border dark:border-dark-border pb-3">Prediction Results</h3>
          
          {result ? (
            <div className="flex flex-col gap-6">
              {Object.entries(result.regression).map(([model, data]) => {
                if(model === "Bayesian Ridge" && data.std) {
                   return (
                     <div key={model} className="bg-success-light/10 dark:bg-success-dark/10 p-5 rounded-lg border border-success-light/20">
                       <h4 className="text-sm text-success-light dark:text-success-dark font-medium mb-1">{model} Prediction</h4>
                       <p className="text-3xl font-bold text-success-light dark:text-success-dark">
                         ${data.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </p>
                       <p className="text-xs mt-2 text-light-muted dark:text-dark-muted">
                         95% Confidence Interval:<br/>
                         ${data.lower_bound.toLocaleString(undefined, { maximumFractionDigits: 0 })} - ${data.upper_bound.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </p>
                     </div>
                   );
                } else if(model === "Least Squares (OLS)") {
                  return (
                     <div key={model} className="bg-primary-light/10 dark:bg-primary-dark/10 p-5 rounded-lg border border-primary-light/20">
                       <h4 className="text-sm text-primary-light dark:text-primary-dark font-medium mb-1">OLS Prediction</h4>
                       <p className="text-2xl font-bold text-primary-light dark:text-primary-dark">
                         ${data.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                       </p>
                     </div>
                   );
                }
                return null;
              })}

              {result.classification && result.classification["Logistic Regression"] && (
                <div className="bg-secondary-light/10 dark:bg-secondary-dark/10 p-5 rounded-lg border border-secondary-light/20">
                  <h4 className="text-sm text-secondary-light dark:text-secondary-dark font-medium mb-1">Premium Status</h4>
                  <p className="text-xl font-bold text-secondary-light dark:text-secondary-dark">
                    {result.classification["Logistic Regression"].is_premium ? 'Premium Property' : 'Standard Property'}
                  </p>
                  {result.classification["Logistic Regression"].probability !== null && (
                    <p className="text-xs mt-1 text-light-muted dark:text-dark-muted">
                      Probability: {(result.classification["Logistic Regression"].probability * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-light-muted dark:text-dark-muted text-center border-2 border-dashed border-light-border dark:border-dark-border rounded-lg p-6">
              Fill out the features and click Predict to see the estimated value.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
