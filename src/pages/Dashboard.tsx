import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAusgaben, getFixkosten, getAusgabenFuerMonat,
  summeNachKategorie, formatEuro, aktuellerMonat
} from '../lib/storage';
import { getKategorie } from '../lib/kategorien';
import type { Ausgabe, Fixkosten } from '../types';

const MONATSNAMEN = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [ausgaben, setAusgaben] = useState<Ausgabe[]>([]);
  const [fixkosten, setFixkosten] = useState<Fixkosten[]>([]);

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
  const topKats = Object.entries(nachKat).sort(([,a],[,b]) => b - a).slice(0, 6);

  const d = new Date();
  const monatsName = `${MONATSNAMEN[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Übersicht</h1>
        <button className="add-btn" onClick={() => navigate('/neu')} aria-label="Neue Ausgabe">+</button>
      </div>
      <p style={{ fontSize: 13, color: '#999', marginBottom: 16, marginTop: -12 }}>{monatsName}</p>

      {/* Statistik-Karten */}
      <div className="stat-row">
        <div className="stat-card" style={{ background: '#E74C3C' }}>
          <span className="stat-label">Gesamt</span>
          <span className="stat-value">{formatEuro(gesamt)}</span>
        </div>
        <div className="stat-card" style={{ background: '#3498DB' }}>
          <span className="stat-label">Fixkosten</span>
          <span className="stat-value">{formatEuro(fixGesamt)}</span>
        </div>
        <div className="stat-card" style={{ background: '#9B59B6' }}>
          <span className="stat-label">Variabel</span>
          <span className="stat-value">{formatEuro(variabel)}</span>
        </div>
      </div>

      {/* Kategorien-Balken */}
      {topKats.length > 0 && (
        <div className="card">
          <p className="card-title">Ausgaben nach Kategorie</p>
          {topKats.map(([name, betrag]) => {
            const k = getKategorie(name as any);
            const prozent = gesamt > 0 ? (betrag / gesamt) * 100 : 0;
            return (
              <div className="balken-zeile" key={name}>
                <div className="balken-kopf">
                  <span className="balken-name">{k.emoji} {name}</span>
                  <span className="balken-betrag">{formatEuro(betrag)}</span>
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
      <div className="card">
        <p className="card-title">Letzte Buchungen</p>
        {ausgaben.length === 0 ? (
          <div className="leer">
            <span className="leer-emoji">🧾</span>
            <p className="leer-text">Noch keine Ausgaben — tippe oben auf +</p>
          </div>
        ) : (
          ausgaben.slice(0, 6).map(a => {
            const k = getKategorie(a.kategorie);
            return (
              <div className="buchung-zeile" key={a.id}>
                <div className="buchung-dot" style={{ background: k.farbe }} />
                <div className="buchung-info">
                  <div className="buchung-titel">{a.beschreibung || a.kategorie}</div>
                  <div className="buchung-datum">{new Date(a.datum).toLocaleDateString('de-DE')} · {a.kategorie}</div>
                </div>
                <span className="buchung-betrag">-{formatEuro(a.betrag)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
