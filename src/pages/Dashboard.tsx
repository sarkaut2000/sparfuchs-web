import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAusgaben, getFixkosten, getAusgabenFuerMonat,
  summeNachKategorie, saveAusgabe, formatEuro, aktuellerMonat
} from '../lib/storage';
import { KATEGORIEN, getKategorie } from '../lib/kategorien';
import type { Ausgabe, Fixkosten, Kategorie } from '../types';

const MONATSNAMEN = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [ausgaben, setAusgaben] = useState<Ausgabe[]>([]);
  const [fixkosten, setFixkosten] = useState<Fixkosten[]>([]);
  const [modal, setModal] = useState<Kategorie | null>(null);
  const [betrag, setBetrag] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [fehler, setFehler] = useState('');

  useEffect(() => {
    setAusgaben(getAusgaben());
    setFixkosten(getFixkosten());
  }, []);

  const monat = aktuellerMonat();
  const dieserMonat = getAusgabenFuerMonat(monat);
  const gesamt = dieserMonat.reduce((s, a) => s + a.betrag, 0);
  const fixGesamt = fixkosten.filter(f => f.aktiv).reduce((s, f) => s + f.betrag, 0);
  const variabel = gesamt - dieserMonat.filter(a => a.ist_fixkosten).reduce((s, a) => s + a.betrag, 0);
  const nachKat = summeNachKategorie(dieserMonat);
  const topKats = Object.entries(nachKat).sort(([,a],[,b]) => b - a).slice(0, 5);
  const d = new Date();

  function oeffneModal(kat: Kategorie) {
    setModal(kat);
    setBetrag('');
    setBeschreibung('');
    setDatum(new Date().toISOString().slice(0, 10));
    setFehler('');
  }

  function speichern() {
    const betragNum = parseFloat(betrag.replace(',', '.'));
    if (isNaN(betragNum) || betragNum <= 0) { setFehler('Bitte einen gültigen Betrag eingeben'); return; }
    saveAusgabe({ betrag: betragNum, beschreibung, kategorie: modal!, datum, ist_fixkosten: false });
    setAusgaben(getAusgaben());
    setModal(null);
  }

  const modalKat = modal ? getKategorie(modal) : null;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>{MONATSNAMEN[d.getMonth()]} {d.getFullYear()}</div>
          <h1 className="page-title">Übersicht</h1>
        </div>
        <button className="header-btn" onClick={() => navigate('/einstellungen')} title="Einstellungen">⚙️</button>
      </div>

      {/* Hero Karte */}
      <div className="hero-card">
        <div className="hero-label">Ausgaben diesen Monat</div>
        <div className="hero-betrag">{formatEuro(gesamt)}</div>
        <div className="hero-sub">{dieserMonat.length} Buchungen</div>
        <div className="hero-pills">
          <div className="hero-pill">🔒 Fix {formatEuro(fixGesamt)}</div>
          <div className="hero-pill">📊 Var. {formatEuro(variabel)}</div>
        </div>
      </div>

      {/* Schnell-Erfassung */}
      <div className="glass-card">
        <div className="card-title">Schnell erfassen</div>
        <div className="schnell-grid">
          {KATEGORIEN.map(k => (
            <button
              key={k.name}
              className="schnell-btn"
              style={{ background: k.farbe }}
              onClick={() => oeffneModal(k.name)}
              title={k.name}
            >
              {k.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Top Kategorien */}
      {topKats.length > 0 && (
        <div className="glass-card">
          <div className="card-title">Top Ausgaben</div>
          {topKats.map(([name, betragVal]) => {
            const k = getKategorie(name as Kategorie);
            const prozent = gesamt > 0 ? (betragVal / gesamt) * 100 : 0;
            return (
              <div className="balken-zeile" key={name}>
                <div className="balken-kopf">
                  <span className="balken-name">{k.emoji} {name}</span>
                  <span className="balken-betrag">{formatEuro(betragVal)}</span>
                </div>
                <div className="balken-bg">
                  <div className="balken-fill" style={{ width: `${Math.round(prozent)}%`, background: k.farbe }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Letzte Buchungen */}
      <div className="glass-card">
        <div className="card-title">Letzte Buchungen</div>
        {ausgaben.length === 0 ? (
          <div className="leer">
            <span className="leer-emoji">🧾</span>
            <p className="leer-text">Noch keine Ausgaben</p>
            <p className="leer-hint">Tippe oben auf ein Icon zum Erfassen</p>
          </div>
        ) : (
          ausgaben.slice(0, 5).map(a => {
            const k = getKategorie(a.kategorie);
            return (
              <div className="buchung-zeile" key={a.id}>
                <div className="buchung-icon" style={{ background: k.farbe + '20' }}>{k.emoji}</div>
                <div className="buchung-info">
                  <div className="buchung-titel">{a.beschreibung || a.kategorie}</div>
                  <div className="buchung-datum">{new Date(a.datum).toLocaleDateString('de-DE')}</div>
                </div>
                <span className="buchung-betrag">-{formatEuro(a.betrag)}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Schnell-Erfassung Modal */}
      {modal && modalKat && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">{modalKat.emoji} {modal}</span>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>Betrag in Euro</div>
              <input
                className="betrag-input"
                type="number"
                inputMode="decimal"
                placeholder="0,00"
                value={betrag}
                onChange={e => { setBetrag(e.target.value); setFehler(''); }}
                autoFocus
              />
              {fehler && <p className="fehler">{fehler}</p>}
            </div>

            <label className="form-label">Beschreibung (optional)</label>
            <input className="form-input" type="text" placeholder="z.B. Wocheneinkauf" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} />

            <label className="form-label">Datum</label>
            <input className="form-input" type="date" value={datum} onChange={e => setDatum(e.target.value)} />

            <button className="btn-primary" onClick={speichern}>
              Bestätigen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
