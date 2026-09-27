import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OutlierLab from './pages/OutlierLab';
import ModelComparison from './pages/ModelComparison';
import Prediction from './pages/Prediction';
import Dataset from './pages/Dataset';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="outliers" element={<OutlierLab />} />
          <Route path="models" element={<ModelComparison />} />
          <Route path="predict" element={<Prediction />} />
          <Route path="dataset" element={<Dataset />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
