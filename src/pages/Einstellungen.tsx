import { KATEGORIEN } from '../lib/kategorien';
import { useNavigate } from 'react-router-dom';

export default function Einstellungen() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="page-header">
        <button className="header-btn" onClick={() => navigate(-1)}>←</button>
        <h1 className="page-title">Einstellungen</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Navigation Erklärung */}
      <div className="settings-section">
        <div className="settings-section-title">Navigation (unten)</div>
        {[
          { emoji: '🏠', label: 'Übersicht', desc: 'Dashboard mit Monatsausgaben und Schnell-Erfassung' },
          { emoji: '📋', label: 'Verlauf', desc: 'Alle deine Buchungen — löschbar und filterbar' },
          { emoji: '🔄', label: 'Fixkosten', desc: 'Monatlich wiederkehrende Ausgaben verwalten' },
          { emoji: '📊', label: 'Statistiken', desc: 'Charts und Vergleiche über mehrere Monate' },
        ].map(item => (
          <div className="settings-row" key={item.label}>
            <div className="settings-icon" style={{ background: 'rgba(0,122,255,0.12)' }}>{item.emoji}</div>
            <div className="settings-info">
              <div className="settings-label">{item.label}</div>
              <div className="settings-desc">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Kategorie Icons Erklärung */}
      <div className="settings-section">
        <div className="settings-section-title">Kategorie Icons (Schnell-Erfassung)</div>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 10, paddingLeft: 4 }}>
          Tippe auf ein Icon im Dashboard um sofort eine Ausgabe zu erfassen.
        </p>
        {KATEGORIEN.map((k, i) => (
          <div
            className="settings-row"
            key={k.name}
            style={{
              borderRadius: i === 0 ? '14px 14px 0 0' : i === KATEGORIEN.length - 1 ? '0 0 14px 14px' : '0',
            }}
          >
            <div className="settings-icon" style={{ background: k.farbe + '25' }}>{k.emoji}</div>
            <div className="settings-info">
              <div className="settings-label">{k.name}</div>
            </div>
          </div>
        ))}
      </div>

      {/* App Info */}
      <div className="settings-section">
        <div className="settings-section-title">App Info</div>
        <div className="settings-row" style={{ borderRadius: '14px 14px 0 0' }}>
          <div className="settings-icon" style={{ background: 'rgba(52,199,89,0.15)' }}>🐷</div>
          <div className="settings-info">
            <div className="settings-label">Sparfuchs</div>
            <div className="settings-desc">Version 1.0 · Deine persönliche Ausgaben-App</div>
          </div>
        </div>
        <div className="settings-row" style={{ borderRadius: 0 }}>
          <div className="settings-icon" style={{ background: 'rgba(255,149,0,0.15)' }}>💾</div>
          <div className="settings-info">
            <div className="settings-label">Datenspeicherung</div>
            <div className="settings-desc">Daten werden lokal in deinem Browser gespeichert</div>
          </div>
        </div>
        <div className="settings-row" style={{ borderRadius: '0 0 14px 14px' }}>
          <div className="settings-icon" style={{ background: 'rgba(175,82,222,0.15)' }}>🔒</div>
          <div className="settings-info">
            <div className="settings-label">Datenschutz</div>
            <div className="settings-desc">Keine Daten werden an Server gesendet</div>
          </div>
        </div>
      </div>
    </div>
  );
}
