import { useState, useEffect } from 'react';
import api from '../api/client';
import { Settings2, AlertTriangle, Info, Play, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';

export default function OutlierLab() {
  const [summary, setSummary] = useState(null);
  const [method, setMethod] = useState('iqr');
  const [loading, setLoading] = useState(true);

  // What-If State
  const [experimentData, setExperimentData] = useState({
    features: {
      GrLivArea: 6000,
      TotalBsmtSF: 3000,
      OverallQual: 10,
      OverallCond: 5,
      YearBuilt: 2020,
      GarageCars: 4,
      FullBath: 4,
      BedroomAbvGr: 6,
      TotRmsAbvGrd: 15,
      LotArea: 50000,
      CentralAir: 1,
      KitchenQual: 4
    },
    target_price: 2500000,
    model_name: "Least Squares (OLS)",
    feature_name: "GrLivArea"
  });
  
  const [expLoading, setExpLoading] = useState(false);
  const [expResult, setExpResult] = useState(null);
  const [expError, setExpError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/outliers/summary?method=${method}`);
        setSummary(res.data);
      } catch (error) {
        console.error("Error fetching outlier summary", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [method]);

  const handleExpChange = (e) => {
    const { name, value } = e.target;
    if (name === "target_price" || name === "model_name" || name === "feature_name") {
      setExperimentData(prev => ({
        ...prev,
        [name]: name === "target_price" ? Number(value) : value
      }));
    } else {
      setExperimentData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [name]: Number(value)
        }
      }));
    }
  };

  const runExperiment = async (e) => {
    e.preventDefault();
    setExpLoading(true);
    setExpError(null);
    try {
      const res = await api.post('/outliers/what-if', experimentData);
      setExpResult(res.data);
    } catch (err) {
      setExpError(err.response?.data?.detail || "Experiment failed.");
    } finally {
      setExpLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Existing Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            Outlier Lab <AlertTriangle className="text-danger-light dark:text-danger-dark" />
          </h2>
          <p className="text-light-muted dark:text-dark-muted">Experiment with different outlier detection thresholds and observe the impact.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="card flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-4">
            <Settings2 className="text-primary-light dark:text-primary-dark" />
            <h3 className="text-lg font-semibold">Detection Settings</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Detection Method</label>
              <div className="flex p-1 bg-light-border/20 dark:bg-dark-border/20 rounded-lg">
                <button 
                  onClick={() => setMethod('iqr')}
                  className={`flex-1 min-h-[44px] rounded-md text-sm font-medium transition-colors ${method === 'iqr' ? 'bg-primary-light dark:bg-primary-dark text-white shadow-sm' : 'hover:bg-light-border/30 dark:hover:bg-dark-border/50 text-light-muted dark:text-dark-muted'}`}
                >
                  IQR Method (1.5x)
                </button>
                <button 
                  onClick={() => setMethod('zscore')}
                  className={`flex-1 min-h-[44px] rounded-md text-sm font-medium transition-colors ${method === 'zscore' ? 'bg-primary-light dark:bg-primary-dark text-white shadow-sm' : 'hover:bg-light-border/30 dark:hover:bg-dark-border/50 text-light-muted dark:text-dark-muted'}`}
                >
                  Z-Score (3.0)
                </button>
              </div>
            </div>

            <div className="bg-primary-light/5 dark:bg-primary-dark/10 p-4 rounded-lg border border-primary-light/20 dark:border-primary-dark/30 mt-4">
              <div className="flex gap-2 items-start text-sm">
                <Info size={16} className="text-primary-light dark:text-primary-dark mt-0.5 shrink-0" />
                <p className="text-light-muted dark:text-dark-muted leading-relaxed">
                  {method === 'iqr' 
                    ? "The Interquartile Range (IQR) method is robust to extreme outliers. It flags points outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]." 
                    : "The Z-Score method assumes a normal distribution. It flags points that are more than 3 standard deviations from the mean."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="card lg:col-span-2 flex flex-col min-h-[250px]">
          <h3 className="text-lg font-semibold mb-4">Detection Results</h3>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-light dark:border-primary-dark"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-light-border/10 dark:bg-dark-border/10 rounded-lg p-4 border border-light-border/50 dark:border-dark-border/50 text-center">
                  <div className="text-sm text-light-muted dark:text-dark-muted mb-1">Total Dataset</div>
                  <div className="text-2xl font-bold">{summary?.total_rows}</div>
                </div>
                <div className="bg-success-light/10 dark:bg-success-dark/10 rounded-lg p-4 border border-success-light/20 dark:border-success-dark/20 text-center">
                  <div className="text-sm text-success-light dark:text-success-dark mb-1">Clean Data</div>
                  <div className="text-2xl font-bold text-success-light dark:text-success-dark">{summary?.clean_count}</div>
                </div>
                <div className="bg-danger-light/10 dark:bg-danger-dark/10 rounded-lg p-4 border border-danger-light/20 dark:border-danger-dark/20 text-center">
                  <div className="text-sm text-danger-light dark:text-danger-dark mb-1">Outliers</div>
                  <div className="text-2xl font-bold text-danger-light dark:text-danger-dark">{summary?.outlier_count}</div>
                </div>
                <div className="bg-light-border/10 dark:bg-dark-border/10 rounded-lg p-4 border border-light-border/50 dark:border-dark-border/50 text-center">
                  <div className="text-sm text-light-muted dark:text-dark-muted mb-1">Impact %</div>
                  <div className="text-2xl font-bold">{summary?.outlier_percentage}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What-If Experiment Section */}
      <div className="card mt-4 border-l-4 border-l-danger-light dark:border-l-danger-dark">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <BarChart2 className="text-danger-light dark:text-danger-dark" /> What-if Outlier Experiment
        </h3>
        <p className="text-light-muted dark:text-dark-muted mb-6">
          Inject an extreme property into the dataset and see how it pulls the regression line (leverage & influence).
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <form onSubmit={runExperiment} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Model Name</label>
                <select name="model_name" value={experimentData.model_name} onChange={handleExpChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border">
                  <option value="Least Squares (OLS)">Least Squares (OLS)</option>
                  <option value="Ridge Regression">Ridge Regression</option>
                  <option value="Huber (Robust)">Huber (Robust)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Target Price (Inject)</label>
                <input type="number" name="target_price" value={experimentData.target_price} onChange={handleExpChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-danger-light/50 dark:border-danger-dark/50" required min="10000" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-danger-light dark:text-danger-dark">X-Axis Feature (GrLivArea)</label>
                <input type="number" name="GrLivArea" value={experimentData.features.GrLivArea} onChange={handleExpChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-danger-light/50 dark:border-danger-dark/50" required min="1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium mb-1">Lot Area</label>
                  <input type="number" name="LotArea" value={experimentData.features.LotArea} onChange={handleExpChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TotalBsmtSF</label>
                  <input type="number" name="TotalBsmtSF" value={experimentData.features.TotalBsmtSF} onChange={handleExpChange} className="w-full p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border" required />
                </div>
              </div>

              <button type="submit" disabled={expLoading} className="mt-4 flex items-center justify-center gap-2 w-full min-h-[48px] bg-danger-light dark:bg-danger-dark text-white rounded-md font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                <Play size={20} />
                {expLoading ? 'Running...' : 'Inject Outlier'}
              </button>

              {expError && (
                <div className="text-sm text-danger-light dark:text-danger-dark mt-2">
                  {expError}
                </div>
              )}
            </form>
          </div>

          <div className="lg:col-span-2">
            {expResult ? (
              <div className="flex flex-col gap-4 h-full">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg border border-light-border dark:border-dark-border text-center">
                    <h4 className="text-sm text-light-muted dark:text-dark-muted font-semibold mb-1">R² (Before)</h4>
                    <p className="text-2xl font-bold">{expResult.metrics_before.r2.toFixed(3)}</p>
                  </div>
                  <div className="bg-danger-light/10 dark:bg-danger-dark/10 p-4 rounded-lg border border-danger-light/20 text-center">
                    <h4 className="text-sm text-danger-light dark:text-danger-dark font-semibold mb-1">R² (After)</h4>
                    <p className="text-2xl font-bold text-danger-light dark:text-danger-dark">{expResult.metrics_after.r2.toFixed(3)}</p>
                  </div>
                </div>

                <div className="flex-1 min-h-[300px] w-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg p-4 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={expResult.line_data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey={expResult.feature_name} type="number" domain={['dataMin', 'dataMax']} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                      <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                      <RechartsTooltip formatter={(value) => `$${value.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--tw-prose-body)', borderColor: 'var(--tw-prose-invert-borders)', borderRadius: '8px' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" dataKey="pred_before" name="Before Outlier" stroke="#3b82f6" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="pred_after" name="After Outlier" stroke="#ef4444" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                      <ReferenceDot x={experimentData.features[expResult.feature_name]} y={expResult.target_price} r={6} fill="#ef4444" stroke="white" strokeWidth={2} isFront={true} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-light-muted dark:text-dark-muted text-center border-2 border-dashed border-light-border dark:border-dark-border rounded-lg p-6">
                 <AlertTriangle size={48} className="text-danger-light/50 dark:text-danger-dark/50 mb-4" />
                 <h4 className="text-lg font-medium mb-2">Ready for Injection</h4>
                 <p className="max-w-md">
                   Tweak the features on the left and click "Inject Outlier" to see how a single extreme property shifts the model's regression line.
                 </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
