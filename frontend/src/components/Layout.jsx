import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Moon, Sun, Menu, X, Home, AlertTriangle, Layers, BarChart2, Database } from 'lucide-react';

const tabs = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Outlier Lab', path: '/outliers', icon: AlertTriangle },
  { name: 'Model Comparison', path: '/models', icon: Layers },
  { name: 'Prediction', path: '/predict', icon: BarChart2 },
  { name: 'Dataset', path: '/dataset', icon: Database },
];

export default function Layout() {
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check local storage or default to dark
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-light-card dark:bg-dark-card border-b border-light-border dark:border-dark-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary-light dark:bg-primary-dark p-2 rounded-lg text-white">
            <Home size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block text-gray-900 dark:text-white">
            RealEstate<span className="text-primary-light dark:text-primary-dark">-Outlier</span>
          </h1>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
              }
            >
              <tab.icon size={18} className="mr-2" />
              {tab.name}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-light-border/30 dark:bg-dark-border/50 hover:bg-light-border/50 dark:hover:bg-dark-border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-full hover:bg-light-border/30 dark:hover:bg-dark-border/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-light-card dark:bg-dark-card border-b border-light-border dark:border-dark-border p-4 flex flex-col gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `nav-link min-h-[44px] ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
              }
            >
              <tab.icon size={20} className="mr-3" />
              <span className="text-lg">{tab.name}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
