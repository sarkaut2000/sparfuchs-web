import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Verlauf from './pages/Verlauf';
import Fixkosten from './pages/Fixkosten';
import Statistiken from './pages/Statistiken';
import Einstellungen from './pages/Einstellungen';
import './index.css';

function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = [
    { path: '/',            emoji: '🏠', label: 'Übersicht' },
    { path: '/verlauf',     emoji: '📋', label: 'Verlauf'   },
    { path: '/fixkosten',   emoji: '🔄', label: 'Fixkosten' },
    { path: '/statistiken', emoji: '📊', label: 'Statistiken' },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <button
          key={t.path}
          className={`nav-btn ${location.pathname === t.path ? 'aktiv' : ''}`}
          onClick={() => navigate(t.path)}
          title={t.label}
        >
          <div className="nav-icon-wrap">{t.emoji}</div>
        </button>
      ))}
    </nav>
  );
}

function Layout() {
  const location = useLocation();
  const showNav = location.pathname !== '/einstellungen';
  return (
    <div className="app">
      <Routes>
        <Route path="/"               element={<Dashboard />} />
        <Route path="/verlauf"        element={<Verlauf />} />
        <Route path="/fixkosten"      element={<Fixkosten />} />
        <Route path="/statistiken"    element={<Statistiken />} />
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
