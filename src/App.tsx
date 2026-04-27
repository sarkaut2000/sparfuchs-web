import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Verlauf from './pages/Verlauf';
import Fixkosten from './pages/Fixkosten';
import Statistiken from './pages/Statistiken';
import Analyse from './pages/Analyse';
import Einstellungen from './pages/Einstellungen';
import { getAlleDesigns, NAV_KEYS } from './lib/icons';
import './index.css';

const DEFAULT_NAV = [
  { path: '/',            key: NAV_KEYS.home,        icon: 'grid_view',    label: 'Dashboard'  },
  { path: '/verlauf',     key: NAV_KEYS.verlauf,      icon: 'receipt_long', label: 'Activity'   },
  { path: '/fixkosten',   key: NAV_KEYS.fixkosten,    icon: 'repeat',       label: 'Budgets'    },
  { path: '/statistiken', key: NAV_KEYS.statistiken,  icon: 'monitoring',   label: 'Stats'      },
  { path: '/analyse',     key: 'nav_analyse',          icon: 'auto_awesome', label: 'Insights'   },
];

function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [designs, setDesigns] = useState(getAlleDesigns());

  useEffect(() => {
    const handler = () => setDesigns(getAlleDesigns());
    window.addEventListener('sparfuchs_icons_update', handler);
    return () => window.removeEventListener('sparfuchs_icons_update', handler);
  }, []);

  return (
    <nav className="bottom-nav">
      {DEFAULT_NAV.map(t => {
        const design = designs[t.key];
        const istAktiv = location.pathname === t.path;
        return (
          <button
            key={t.path}
            className={`nav-btn ${istAktiv ? 'aktiv' : ''}`}
            onClick={() => navigate(t.path)}
            title={t.label}
          >
            <div className="nav-icon-wrap">
              {design?.customIcon
                ? <img src={design.customIcon} alt={t.label} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                : <span className={`material-symbols-outlined ${istAktiv ? 'filled' : ''}`}>{t.icon}</span>
              }
            </div>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

function Layout() {
  const location = useLocation();
  const showNav = !['/einstellungen'].includes(location.pathname);
  return (
    <div className="app">
      <Routes>
        <Route path="/"               element={<Dashboard />} />
        <Route path="/verlauf"        element={<Verlauf />} />
        <Route path="/fixkosten"      element={<Fixkosten />} />
        <Route path="/statistiken"    element={<Statistiken />} />
        <Route path="/analyse"        element={<Analyse />} />
        <Route path="/einstellungen"  element={<Einstellungen />} />
      </Routes>
      {showNav && <Nav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
