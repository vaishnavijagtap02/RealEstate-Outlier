import { useState, useEffect } from 'react';
import api from '../api/client';
import { Search } from 'lucide-react';

export default function Dataset() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/data/sample?n=50');
        setColumns(res.data.columns);
        setData(res.data.data);
      } catch (error) {
        console.error("Error fetching dataset sample", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Ames Housing Dataset</h2>
          <p className="text-light-muted dark:text-dark-muted">Showing a sample of 50 records from the curated 12-feature subset.</p>
        </div>
        
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-light-muted dark:text-dark-muted" />
          </div>
          <input 
            type="text" 
            placeholder="Search records..." 
            className="w-full sm:w-64 pl-10 pr-4 py-2 min-h-[44px] bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark transition-shadow placeholder-light-muted dark:placeholder-dark-muted"
          />
        </div>
      </div>

      <div className="card flex-1 overflow-hidden flex flex-col p-0 md:p-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-light dark:border-primary-dark"></div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full h-full max-h-[70vh]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0 z-10">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-6 py-4 font-semibold tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-light-border/10 dark:hover:bg-dark-border/10 transition-colors">
                    {columns.map((col) => (
                      <td key={`${idx}-${col}`} className={`px-6 py-4 ${col === 'SalePrice' ? 'font-bold text-success-light dark:text-success-dark' : ''}`}>
                        {col === 'SalePrice' 
                          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(row[col]) 
                          : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
