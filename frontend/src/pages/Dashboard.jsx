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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent)]"></div>
        <p className="text-[var(--color-text-muted)] font-medium">Running ML Experiment Pipeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-[var(--color-danger)] gap-2">
        <AlertTriangle size={48} />
        <p className="font-medium text-lg text-glow">{error}</p>
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
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto animation-fade-in">
      
      {/* 1. Experiment Summary Header */}
      <div className="card border-l-4 border-l-[var(--color-accent)] bg-[var(--color-accent-glow)]">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-glow">ML Experiment Overview</h2>
            <p className="text-[var(--color-text-muted)] mb-4 max-w-2xl">
              This dashboard immediately answers: <strong className="text-[var(--color-text-main)]">"What happens to house-price prediction when we detect and handle outliers?"</strong>
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <div className="flex items-center gap-2 bg-[var(--color-surface-2)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]"><Database size={16} className="text-[var(--color-accent)]"/> <span className="font-medium text-[var(--color-text-muted)]">Dataset:</span> Ames Housing</div>
              <div className="flex items-center gap-2 bg-[var(--color-surface-2)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]"><Activity size={16} className="text-[var(--color-accent)]"/> <span className="font-medium text-[var(--color-text-muted)]">Records:</span> {dataSummary.num_rows}</div>
              <div className="flex items-center gap-2 bg-[var(--color-surface-2)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]"><Layers size={16} className="text-[var(--color-accent)]"/> <span className="font-medium text-[var(--color-text-muted)]">Features:</span> {dataSummary.num_features} Selected</div>
              <div className="flex items-center gap-2 bg-[var(--color-surface-2)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]"><Target size={16} className="text-[var(--color-accent)]"/> <span className="font-medium text-[var(--color-text-muted)]">Target:</span> {dataSummary.regression_target}</div>
            </div>
          </div>
          <div className="flex flex-col justify-center bg-[var(--color-surface-2)] backdrop-blur-sm p-6 rounded-xl border border-[var(--color-danger)] shadow-[0_0_20px_var(--color-danger-glow)] min-w-[220px]">
             <div className="text-sm text-[var(--color-text-muted)] mb-2 font-medium flex items-center gap-1.5"><AlertTriangle size={16} className="text-[var(--color-danger)]"/> Detected Outliers (IQR)</div>
             <div className="text-4xl font-bold text-[var(--color-danger)] text-glow">{outlierSummary.outlier_count}</div>
             <div className="text-xs text-[var(--color-text-muted)] font-medium mt-1">({outlierSummary.outlier_percentage}% of dataset)</div>
          </div>
        </div>
      </div>

      {/* 2. Outlier Impact (The Key Focus) */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
             <TrendingUp className="text-[var(--color-danger)]" size={20} />
           </div>
           <h3 className="text-xl font-bold text-[var(--color-text-main)]">The Outlier Impact (Before vs After)</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
           <div className="card flex flex-col justify-center text-center">
             <div className="text-sm font-medium text-[var(--color-text-muted)] mb-3">OLS RMSE Change</div>
             <div className="flex items-center justify-center gap-3">
               <span className="text-lg font-mono text-[var(--color-text-muted)]">${olsMetrics.original.rmse.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
               <ArrowRight size={18} className="text-[var(--color-success)] shrink-0" />
               <span className="text-xl font-mono font-bold text-[var(--color-success)] text-glow">${olsMetrics.cleaned.rmse.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
             </div>
           </div>

           <div className="card flex flex-col justify-center text-center">
             <div className="text-sm font-medium text-[var(--color-text-muted)] mb-3">OLS R² Change</div>
             <div className="flex items-center justify-center gap-3">
               <span className="text-lg font-mono text-[var(--color-text-muted)]">{olsMetrics.original.r2.toFixed(3)}</span>
               <ArrowRight size={18} className="text-[var(--color-success)] shrink-0" />
               <span className="text-xl font-mono font-bold text-[var(--color-success)] text-glow">{olsMetrics.cleaned.r2.toFixed(3)}</span>
             </div>
           </div>

           <div className="card flex flex-col justify-center text-center">
             <div className="text-sm font-medium text-[var(--color-text-muted)] mb-3">Price Mean Shift</div>
             <div className="flex items-center justify-center gap-3">
               <span className="text-lg font-mono text-[var(--color-text-muted)]">${outlierSummary.outlier_price_stats?.mean ? (outlierSummary.outlier_price_stats.mean).toLocaleString(undefined, {maximumFractionDigits:0}) : dataSummary.price_stats.mean.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
               <ArrowRight size={18} className="text-[var(--color-accent)] shrink-0" />
               <span className="text-xl font-mono font-bold text-[var(--color-accent)] text-glow">${outlierSummary.clean_price_stats.mean.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
             </div>
           </div>
           
           <div className="card flex flex-col justify-center border-[var(--color-success)] bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
             <div className="flex items-center gap-2 font-bold text-[var(--color-success)] mb-3"><CheckCircle size={18}/> Evaluation Complete</div>
             <div className="text-sm font-medium text-[var(--color-text-main)] mb-1">{Object.keys(regResults).length} Regression Models Trained</div>
             <div className="text-sm font-medium text-[var(--color-text-main)]">{Object.keys(clsResults).length} Classification Models Trained</div>
           </div>
        </div>
      </div>

      {/* 3. Model Performance Comparison */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
             <BarChart2 className="text-[var(--color-accent)]" size={20} />
           </div>
           <h3 className="text-xl font-bold text-[var(--color-text-main)]">Model Performance Comparison</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h4 className="text-md font-semibold mb-4 text-center">R² Performance (Original vs Cleaned)</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regChartData} margin={{ top: 10, right: 10, left: -20, bottom: 90 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-text-main)' }} cursor={{fill: 'var(--color-surface-2)', opacity: 0.5}} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Original R²" fill="var(--color-border-hover)" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Cleaned R²" fill="var(--color-accent)" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <h4 className="text-md font-semibold mb-4">Regression Metrics Overview</h4>
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-[var(--color-surface-2)] text-[var(--color-text-muted)] font-bold rounded-t-lg">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Model</th>
                  <th className="px-4 py-3 text-right">Original (RMSE / R²)</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Cleaned (RMSE / R²)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(regResults).map(([model, metrics], idx) => (
                  <tr key={model} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-4 py-4 font-medium whitespace-nowrap">{model}</td>
                    <td className="px-4 py-4 text-right whitespace-nowrap text-[var(--color-text-muted)] font-mono text-xs">
                      ${metrics.original.rmse.toLocaleString(undefined, {maximumFractionDigits: 0})} / {metrics.original.r2.toFixed(3)}
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap font-semibold text-[var(--color-accent)] font-mono text-xs text-glow">
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
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
             <Database className="text-[var(--color-success)]" size={20} />
           </div>
           <h3 className="text-xl font-bold text-[var(--color-text-main)]">Dataset Data Distribution</h3>
        </div>
        
        <div className="card">
          <h4 className="text-md font-semibold mb-2">GrLivArea vs SalePrice (Outliers Highlighted)</h4>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Visualizing the spatial distribution of standard vs. outlier properties in the primary feature dimension.</p>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid opacity={0.1} strokeDasharray="3 3" />
                <XAxis type="number" dataKey="GrLivArea" name="Living Area" unit=" sqft" tick={{fill: 'var(--color-text-muted)', fontSize: 12}} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} />
                <YAxis type="number" dataKey="SalePrice" name="Sale Price" unit="$" tickFormatter={v => `${v/1000}k`} tick={{fill: 'var(--color-text-muted)', fontSize: 12}} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{strokeDasharray: '3 3', stroke: 'var(--color-border-hover)'}} contentStyle={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-text-main)' }} formatter={(value, name) => name === 'Sale Price' ? formatCurrency(value) : value} />
                <Legend verticalAlign="top" height={36} iconType="circle"/>
                <Scatter name="Clean Data" data={cleanScatter} fill="var(--color-accent)" opacity={0.6} />
                <Scatter name="Detected Outliers" data={outlierScatter} fill="var(--color-danger)" opacity={0.9} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
