import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Verlauf from './pages/Verlauf';
import NeueAusgabe from './pages/NeueAusgabe';
import Fixkosten from './pages/Fixkosten';
import Statistiken from './pages/Statistiken';
import './index.css';

function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = [
    { path: '/',            label: 'Übersicht', emoji: '🏠' },
    { path: '/verlauf',     label: 'Verlauf',   emoji: '📋' },
    { path: '/fixkosten',   label: 'Fixkosten', emoji: '🔄' },
    { path: '/statistiken', label: 'Stats',     emoji: '📊' },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <button
          key={t.path}
          className={`nav-btn ${location.pathname === t.path ? 'aktiv' : ''}`}
          onClick={() => navigate(t.path)}
        >
          <span className="nav-icon">{t.emoji}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}

function Layout() {
  const location = useLocation();
  const showNav = location.pathname !== '/neu';
  return (
    <div className="app">
      <Routes>
        <Route path="/"            element={<Dashboard />} />
        <Route path="/verlauf"     element={<Verlauf />} />
        <Route path="/neu"         element={<NeueAusgabe />} />
        <Route path="/fixkosten"   element={<Fixkosten />} />
        <Route path="/statistiken" element={<Statistiken />} />
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
