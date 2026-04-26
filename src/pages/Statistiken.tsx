import { useState } from 'react';
import { getAusgabenFuerMonat, summeNachKategorie, formatEuro } from '../lib/storage';
import { KATEGORIEN } from '../lib/kategorien';

const MONATSNAMEN = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

function letzteMonateList(n: number): string[] {
  const result: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    result.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return result;
}

export default function Statistiken() {
  const [gewaehlt, setGewaehlt] = useState(new Date().toISOString().slice(0, 7));

  const monatsListe = letzteMonateList(6);
  const dieserMonat = getAusgabenFuerMonat(gewaehlt);
  const gesamt = dieserMonat.reduce((s, a) => s + a.betrag, 0);
  const durchschnitt = dieserMonat.length > 0 ? gesamt / dieserMonat.length : 0;

  const nachKat = summeNachKategorie(dieserMonat);
  const kategorien = KATEGORIEN.filter(k => nachKat[k.name] > 0)
    .map(k => ({ ...k, betrag: nachKat[k.name] }))
    .sort((a, b) => b.betrag - a.betrag);

  const monatsGesamt = monatsListe.map(m =>
    getAusgabenFuerMonat(m).reduce((s, a) => s + a.betrag, 0)
  );
  const maxWert = Math.max(...monatsGesamt, 1);

  return (
    <div className="page">
      <h1 className="page-title">Statistiken</h1>

      {/* Monats-Tabs */}
      <div className="monat-tabs">
        {monatsListe.map(m => {
          const [jahr, mon] = m.split('-');
          return (
            <button
              key={m}
              className={`monat-tab ${gewaehlt === m ? 'aktiv' : ''}`}
              onClick={() => setGewaehlt(m)}
            >
              {MONATSNAMEN[parseInt(mon) - 1]} {jahr}
            </button>
          );
        })}
      </div>

      {/* Statistik-Karten */}
      <div className="stat-row">
        <div className="stat-card" style={{ background: '#E74C3C' }}>
          <span className="stat-label">Gesamt</span>
          <span className="stat-value">{formatEuro(gesamt)}</span>
        </div>
        <div className="stat-card" style={{ background: '#3498DB' }}>
          <span className="stat-label">Buchungen</span>
          <span className="stat-value">{dieserMonat.length}</span>
        </div>
        <div className="stat-card" style={{ background: '#9B59B6' }}>
          <span className="stat-label">Ø Buchung</span>
          <span className="stat-value">{formatEuro(durchschnitt)}</span>
        </div>
      </div>

      {/* 6-Monats Balkendiagramm */}
      <div className="card">
        <p className="card-title">Letzten 6 Monate</p>
        <div className="bar-chart">
          {monatsListe.map((m, i) => {
            const wert = monatsGesamt[i];
            const hoehe = maxWert > 0 ? (wert / maxWert) * 100 : 0;
            const istAktuell = m === gewaehlt;
            const mon = parseInt(m.split('-')[1]) - 1;
            return (
              <div className="bar-col" key={m} onClick={() => setGewaehlt(m)} style={{ cursor: 'pointer' }}>
                <span className="bar-val">{wert > 0 ? Math.round(wert) + '€' : ''}</span>
                <div className="bar-bg">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${Math.max(hoehe, 2)}%`,
                      background: istAktuell ? '#2ECC71' : '#BDC3C7',
                    }}
                  />
                </div>
                <span className={`bar-lbl ${istAktuell ? 'aktiv' : ''}`}>{MONATSNAMEN[mon]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kategorien Detail */}
      <div className="card">
        <p className="card-title">Kategorien im Detail</p>
        {kategorien.length === 0 ? (
          <div className="leer" style={{ padding: '20px 0' }}>
            <p className="leer-text">Keine Ausgaben in diesem Monat</p>
          </div>
        ) : (
          kategorien.map(k => {
            const prozent = gesamt > 0 ? (k.betrag / gesamt) * 100 : 0;
            return (
              <div className="balken-zeile" key={k.name}>
                <div className="balken-kopf">
                  <span className="balken-name">{k.emoji} {k.name}</span>
                  <span className="balken-betrag">{formatEuro(k.betrag)}</span>
                </div>
                <div className="balken-bg">
                  <div className="balken-fill" style={{ width: `${Math.round(prozent)}%`, background: k.farbe }} />
                </div>
                <p style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{prozent.toFixed(1)}%</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
