import { useState, useEffect } from 'react';
import api from '../api/client';
import { Database, AlertTriangle, CheckCircle, Target, ArrowRight, BarChart2, TrendingUp, Layers, Activity } from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ScatterChart, Scatter
} from 'recharts';

export default function Dashboard() {
  const [dataSummary, setDataSummary] = useState(null);
  const [outlierSummary, setOutlierSummary] = useState(null);
  const [regResults, setRegResults] = useState(null);
  const [clsResults, setClsResults] = useState(null);
  const [scatterData, setScatterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashData = async () => {
      try {
        const [dataRes, outlierRes, regRes, clsRes, scatterRes] = await Promise.all([
          api.get('/data/summary'),
          api.get('/outliers/summary?method=iqr'),
          api.post('/models/train/regression?method=iqr'),
          api.post('/models/train/classification?method=iqr'),
          api.get('/outliers/scatter?feature=GrLivArea&method=iqr')
        ]);
        setDataSummary(dataRes.data);
        setOutlierSummary(outlierRes.data);
        setRegResults(regRes.data.results);
        setClsResults(clsRes.data.results);
        setScatterData(scatterRes.data.data);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
        setError("Failed to load ML experiment data. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };
    fetchDashData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-light dark:border-primary-dark"></div>
        <p className="text-light-muted dark:text-dark-muted font-medium">Running ML Experiment Pipeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-danger-light dark:text-danger-dark gap-2">
        <AlertTriangle size={48} />
        <p className="font-medium text-lg">{error}</p>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Prepare chart data
  const regChartData = Object.entries(regResults).map(([model, metrics]) => ({
    name: model,
    'Original R²': metrics.original.r2,
    'Cleaned R²': metrics.cleaned.r2
  }));

  const cleanScatter = scatterData.filter(d => !d.is_outlier);
  const outlierScatter = scatterData.filter(d => d.is_outlier);
  
  const olsMetrics = regResults['Least Squares (OLS)'];

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto">
      
      {/* 1. Experiment Summary Header */}
      <div className="card bg-gradient-to-r from-primary-light/5 to-transparent dark:from-primary-dark/10 border-l-4 border-l-primary-light dark:border-l-primary-dark">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">ML Experiment Overview</h2>
            <p className="text-light-muted dark:text-dark-muted mb-4 max-w-2xl">
              This dashboard immediately answers: <strong>"What happens to house-price prediction when we detect and handle outliers?"</strong>
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5"><Database size={16} className="text-primary-light dark:text-primary-dark"/> <span className="font-medium">Dataset:</span> Ames Housing</div>
              <div className="flex items-center gap-1.5"><Activity size={16} className="text-primary-light dark:text-primary-dark"/> <span className="font-medium">Records:</span> {dataSummary.num_rows}</div>
              <div className="flex items-center gap-1.5"><Layers size={16} className="text-primary-light dark:text-primary-dark"/> <span className="font-medium">Features:</span> {dataSummary.num_features} Selected</div>
              <div className="flex items-center gap-1.5"><Target size={16} className="text-primary-light dark:text-primary-dark"/> <span className="font-medium">Target:</span> {dataSummary.regression_target}</div>
            </div>
          </div>
          <div className="flex flex-col justify-center bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm border border-light-border dark:border-dark-border min-w-[200px]">
             <div className="text-sm text-light-muted dark:text-dark-muted mb-1 font-medium flex items-center gap-1.5"><AlertTriangle size={14}/> Detected Outliers (IQR)</div>
             <div className="text-3xl font-bold text-danger-light dark:text-danger-dark">{outlierSummary.outlier_count}</div>
             <div className="text-xs text-danger-light/80 dark:text-danger-dark/80 font-medium">({outlierSummary.outlier_percentage}% of dataset)</div>
          </div>
        </div>
      </div>

      {/* 2. Outlier Impact (The Key Focus) */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-2">
           <TrendingUp className="text-danger-light dark:text-danger-dark" />
           The Outlier Impact (Before vs After)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
           <div className="card flex flex-col justify-center text-center">
             <div className="text-sm font-semibold text-light-muted dark:text-dark-muted mb-2">OLS RMSE Change</div>
             <div className="flex items-center justify-center gap-3">
               <span className="text-lg font-medium text-light-muted dark:text-dark-muted">${olsMetrics.original.rmse.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
               <ArrowRight size={18} className="text-success-light dark:text-success-dark shrink-0" />
               <span className="text-xl font-bold text-success-light dark:text-success-dark">${olsMetrics.cleaned.rmse.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
             </div>
           </div>

           <div className="card flex flex-col justify-center text-center">
             <div className="text-sm font-semibold text-light-muted dark:text-dark-muted mb-2">OLS R² Change</div>
             <div className="flex items-center justify-center gap-3">
               <span className="text-lg font-medium text-light-muted dark:text-dark-muted">{olsMetrics.original.r2.toFixed(3)}</span>
               <ArrowRight size={18} className="text-success-light dark:text-success-dark shrink-0" />
               <span className="text-xl font-bold text-success-light dark:text-success-dark">{olsMetrics.cleaned.r2.toFixed(3)}</span>
             </div>
           </div>

           <div className="card flex flex-col justify-center text-center">
             <div className="text-sm font-semibold text-light-muted dark:text-dark-muted mb-2">Price Mean Shift</div>
             <div className="flex items-center justify-center gap-3">
               <span className="text-lg font-medium text-light-muted dark:text-dark-muted">${outlierSummary.outlier_price_stats?.mean ? (outlierSummary.outlier_price_stats.mean).toLocaleString(undefined, {maximumFractionDigits:0}) : dataSummary.price_stats.mean.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
               <ArrowRight size={18} className="text-primary-light dark:text-primary-dark shrink-0" />
               <span className="text-xl font-bold text-primary-light dark:text-primary-dark">${outlierSummary.clean_price_stats.mean.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
             </div>
           </div>
           
           <div className="card flex flex-col justify-center bg-success-light/10 dark:bg-success-dark/10 border-success-light/20">
             <div className="flex items-center gap-2 font-bold text-success-light dark:text-success-dark mb-2"><CheckCircle size={18}/> Evaluation Complete</div>
             <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{Object.keys(regResults).length} Regression Models Trained</div>
             <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{Object.keys(clsResults).length} Classification Models Trained</div>
           </div>
        </div>
      </div>

      {/* 3. Model Performance Comparison */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-2">
           <BarChart2 className="text-primary-light dark:text-primary-dark" />
           Model Performance Comparison
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h4 className="text-md font-semibold mb-4 text-center">R² Performance (Original vs Cleaned)</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.7 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.7 }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--chart-tooltip-border)', borderRadius: '8px', color: 'var(--chart-tooltip-text)' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Original R²" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cleaned R²" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <h4 className="text-md font-semibold mb-4">Regression Metrics Overview</h4>
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-3 py-3">Model</th>
                  <th className="px-3 py-3 text-right">Original (RMSE / R²)</th>
                  <th className="px-3 py-3 text-right">Cleaned (RMSE / R²)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(regResults).map(([model, metrics]) => (
                  <tr key={model} className="border-b border-light-border/50 dark:border-dark-border/50">
                    <td className="px-3 py-3 font-medium whitespace-nowrap">{model}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap text-light-muted dark:text-dark-muted">
                      ${metrics.original.rmse.toLocaleString(undefined, {maximumFractionDigits: 0})} / {metrics.original.r2.toFixed(3)}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap font-semibold text-primary-light dark:text-primary-dark">
                      ${metrics.cleaned.rmse.toLocaleString(undefined, {maximumFractionDigits: 0})} / {metrics.cleaned.r2.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Dataset / Target Overview */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-2">
           <Database className="text-secondary-light dark:text-secondary-dark" />
           Dataset Data Distribution
        </h3>
        
        <div className="card">
          <h4 className="text-md font-semibold mb-2">GrLivArea vs SalePrice (Outliers Highlighted)</h4>
          <p className="text-sm text-light-muted dark:text-dark-muted mb-6">Visualizing the spatial distribution of standard vs. outlier properties in the primary feature dimension.</p>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid opacity={0.2} />
                <XAxis type="number" dataKey="GrLivArea" name="Living Area" unit=" sqft" tick={{fill: 'currentColor', opacity: 0.7}} />
                <YAxis type="number" dataKey="SalePrice" name="Sale Price" unit="$" tickFormatter={v => `${v/1000}k`} tick={{fill: 'currentColor', opacity: 0.7}} />
                <RechartsTooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', borderColor: 'var(--chart-tooltip-border)', borderRadius: '8px', color: 'var(--chart-tooltip-text)' }} formatter={(value, name) => name === 'Sale Price' ? formatCurrency(value) : value} />
                <Legend verticalAlign="top" height={36}/>
                <Scatter name="Clean Data" data={cleanScatter} fill="#3b82f6" opacity={0.6} />
                <Scatter name="Detected Outliers" data={outlierScatter} fill="#ef4444" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
