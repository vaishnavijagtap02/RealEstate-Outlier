import { useState, useEffect } from 'react';
import { Layers, Play, AlertCircle, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/client';

export default function ModelComparison() {
  const [method, setMethod] = useState('iqr');
  const [loading, setLoading] = useState(false);
  const [regResults, setRegResults] = useState(null);
  const [clsResults, setClsResults] = useState(null);
  const [error, setError] = useState(null);

  const runTraining = async () => {
    setLoading(true);
    setError(null);
    try {
      const [regRes, clsRes] = await Promise.all([
        api.post(`/models/train/regression?method=${method}`),
        api.post(`/models/train/classification?method=${method}`)
      ]);
      setRegResults(regRes.data.results);
      setClsResults(clsRes.data.results);
    } catch (err) {
      setError("Failed to train models. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTraining();
  }, [method]);

  // Format data for Recharts
  const formatRegData = () => {
    if (!regResults) return [];
    return Object.entries(regResults).map(([model, metrics]) => ({
      name: model,
      'Original R²': metrics.original.r2,
      'Cleaned R²': metrics.cleaned.r2,
      improvement: metrics.r2_improvement
    }));
  };

  const formatClsData = () => {
    if (!clsResults) return [];
    return Object.entries(clsResults).map(([model, metrics]) => ({
      name: model,
      'Original Acc': metrics.original.accuracy,
      'Cleaned Acc': metrics.cleaned.accuracy,
      improvement: metrics.acc_improvement
    }));
  };

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <Layers className="text-primary-light dark:text-primary-dark" />
            Model Comparison Arena
          </h2>
          <p className="text-light-muted dark:text-dark-muted">
            Compare model performance on the Original vs. Outlier-Cleaned dataset.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={method} 
            onChange={(e) => setMethod(e.target.value)}
            className="p-2 rounded-md bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border dark:border-dark-border"
          >
            <option value="iqr">IQR Method</option>
            <option value="zscore">Z-Score Method</option>
          </select>
          <button 
            onClick={runTraining} 
            disabled={loading}
            className="flex items-center gap-2 bg-primary-light dark:bg-primary-dark text-white px-4 py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Play size={18} />
            {loading ? 'Training...' : 'Retrain Models'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger-light/10 text-danger-light dark:text-danger-dark p-4 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {loading && !regResults ? (
        <div className="flex-1 min-h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-light dark:border-primary-dark"></div>
        </div>
      ) : (
        <>
          {/* Regression Section */}
          {regResults && (
            <div className="card">
              <h3 className="text-xl font-bold mb-6 border-b border-light-border dark:border-dark-border pb-3 flex items-center gap-2">
                <BarChart2 className="text-secondary-light dark:text-secondary-dark" />
                Regression Models (Continuous Price Prediction)
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatRegData()} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fill: 'currentColor', opacity: 0.7 }} />
                      <YAxis domain={[0, 1]} tick={{ fill: 'currentColor', opacity: 0.7 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--tw-prose-body)', borderColor: 'var(--tw-prose-invert-borders)', borderRadius: '8px' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="Original R²" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Cleaned R²" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="px-4 py-3">Model</th>
                        <th className="px-4 py-3">Orig R²</th>
                        <th className="px-4 py-3">Clean R²</th>
                        <th className="px-4 py-3">Improvement</th>
                        <th className="px-4 py-3">Clean RMSE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(regResults).map(([model, metrics]) => (
                        <tr key={model} className="border-b border-light-border/50 dark:border-dark-border/50">
                          <td className="px-4 py-3 font-medium">{model}</td>
                          <td className="px-4 py-3">{metrics.original.r2.toFixed(3)}</td>
                          <td className="px-4 py-3 text-secondary-light dark:text-secondary-dark font-medium">{metrics.cleaned.r2.toFixed(3)}</td>
                          <td className={`px-4 py-3 font-bold ${metrics.r2_improvement > 0 ? 'text-success-light dark:text-success-dark' : 'text-danger-light dark:text-danger-dark'}`}>
                            {metrics.r2_improvement > 0 ? '+' : ''}{metrics.r2_improvement.toFixed(3)}
                          </td>
                          <td className="px-4 py-3">${metrics.cleaned.rmse.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Classification Section */}
          {clsResults && (
            <div className="card">
              <h3 className="text-xl font-bold mb-6 border-b border-light-border dark:border-dark-border pb-3 flex items-center gap-2">
                <BarChart2 className="text-success-light dark:text-success-dark" />
                Classification Models (Premium Prediction)
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatClsData()} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fill: 'currentColor', opacity: 0.7 }} />
                      <YAxis domain={[0, 1]} tick={{ fill: 'currentColor', opacity: 0.7 }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--tw-prose-body)', borderColor: 'var(--tw-prose-invert-borders)', borderRadius: '8px' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="Original Acc" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Cleaned Acc" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="px-4 py-3">Model</th>
                        <th className="px-4 py-3">Orig Acc</th>
                        <th className="px-4 py-3">Clean Acc</th>
                        <th className="px-4 py-3">Improvement</th>
                        <th className="px-4 py-3">Clean F1</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(clsResults).map(([model, metrics]) => (
                        <tr key={model} className="border-b border-light-border/50 dark:border-dark-border/50">
                          <td className="px-4 py-3 font-medium">{model}</td>
                          <td className="px-4 py-3">{(metrics.original.accuracy * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3 text-success-light dark:text-success-dark font-medium">{(metrics.cleaned.accuracy * 100).toFixed(1)}%</td>
                          <td className={`px-4 py-3 font-bold ${metrics.acc_improvement > 0 ? 'text-success-light dark:text-success-dark' : (metrics.acc_improvement < 0 ? 'text-danger-light dark:text-danger-dark' : '')}`}>
                            {metrics.acc_improvement > 0 ? '+' : ''}{(metrics.acc_improvement * 100).toFixed(1)}%
                          </td>
                          <td className="px-4 py-3">{metrics.cleaned.f1_score.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
