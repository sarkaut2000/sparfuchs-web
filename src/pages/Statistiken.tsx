import { useState } from 'react';
import { getAusgabenFuerMonat, summeNachKategorie, formatEuro } from '../lib/storage';
import { getAlleKategorien } from '../lib/kategorien';

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

// SVG Smooth Line Chart
function LineChart({ daten, breite = 360, hoehe = 160 }: { daten: number[]; breite?: number; hoehe?: number }) {
  if (daten.length < 2) return null;
  const max = Math.max(...daten, 1);
  const pad = 20;
  const w = breite - pad * 2;
  const h = hoehe - pad * 2;
  const punkte = daten.map((v, i) => ({
    x: pad + (i / (daten.length - 1)) * w,
    y: pad + h - (v / max) * h,
  }));

  // Smooth bezier path
  function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 2;
      const cp1y = pts[i - 1].y;
      const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) / 2;
      const cp2y = pts[i].y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pts[i].x},${pts[i].y}`;
    }
    return d;
  }

  const linePath = smoothPath(punkte);
  const fillPath = linePath + ` L ${punkte[punkte.length - 1].x},${pad + h} L ${punkte[0].x},${pad + h} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${breite} ${hoehe}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00f2ff" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Horizontale Guide Lines */}
      {[0.25, 0.5, 0.75, 1].map(frac => (
        <line key={frac} x1={pad} y1={pad + h - frac * h} x2={pad + w} y2={pad + h - frac * h}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {/* Fill */}
      <path d={fillPath} fill="url(#chartGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#00f2ff" strokeWidth="2" filter="url(#glow)" />
      {/* Punkte */}
      {punkte.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#000" stroke="#00f2ff" strokeWidth="2"
          style={{ filter: 'drop-shadow(0 0 6px rgba(0,242,255,0.8))' }} />
      ))}
    </svg>
  );
}

// SVG Bar Chart (wie im Design)
function BarChart({ daten, aktiv }: { daten: number[]; labels?: string[]; aktiv: number }) {
  const max = Math.max(...daten, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, padding: '0 4px' }}>
      {daten.map((v, i) => {
        const pct = (v / max) * 100;
        const istAktiv = i === aktiv;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 8, fontFamily: "'Space Grotesk', sans-serif", color: istAktiv ? '#00f2ff' : 'transparent', marginBottom: 4, fontWeight: 700 }}>
              {v > 0 ? Math.round(v) : ''}
            </div>
            <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 4)}%`, background: istAktiv ? 'linear-gradient(180deg, #00f2ff 0%, rgba(0,242,255,0.3) 100%)' : 'rgba(255,255,255,0.07)', boxShadow: istAktiv ? '0 0 16px rgba(0,242,255,0.4)' : 'none', transition: 'all 0.3s' }} />
          </div>
        );
      })}
    </div>
  );
}

export default function Statistiken() {
  const [gewaehlt, setGewaehlt] = useState(new Date().toISOString().slice(0, 7));
  const monatsListe = letzteMonateList(6);
  const aktiv = monatsListe.indexOf(gewaehlt);
  const dieserMonat = getAusgabenFuerMonat(gewaehlt);
  const gesamt = dieserMonat.reduce((s, a) => s + a.betrag, 0);
  const durchschnitt = dieserMonat.length > 0 ? gesamt / dieserMonat.length : 0;
  const nachKat = summeNachKategorie(dieserMonat);
  const kategorien = getAlleKategorien().filter(k => nachKat[k.name] > 0).map(k => ({ ...k, betrag: nachKat[k.name] })).sort((a, b) => b.betrag - a.betrag);
  const monatsGesamt = monatsListe.map(m => getAusgabenFuerMonat(m).reduce((s, a) => s + a.betrag, 0));

  // Tages-Daten für Line Chart (letzten 14 Tage)
  const tagsDaten = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const tag = d.toISOString().slice(0, 10);
    return getAusgabenFuerMonat(tag.slice(0, 7)).filter(a => a.datum.startsWith(tag)).reduce((s, a) => s + a.betrag, 0);
  });

  return (
    <div className="page" style={{ paddingTop: 24 }}>
      {/* Hero */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', color: '#e2e2e2', lineHeight: 1, marginBottom: 6 }}>STATISTICS</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>Analytics console with real-time spending patterns.</p>
      </div>

      {/* Monat Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto' }}>
        {monatsListe.map((m) => {
          const monIdx = parseInt(m.split('-')[1]) - 1;
          const istAktiv = m === gewaehlt;
          return (
            <button key={m} onClick={() => setGewaehlt(m)} style={{
              padding: '6px 14px', borderRadius: 6, whiteSpace: 'nowrap' as const,
              border: `1px solid ${istAktiv ? 'rgba(0,242,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
              background: istAktiv ? 'rgba(0,242,255,0.08)' : 'transparent',
              color: istAktiv ? '#00f2ff' : 'rgba(255,255,255,0.3)',
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              cursor: 'pointer', boxShadow: istAktiv ? '0 0 10px rgba(0,242,255,0.15)' : 'none',
            }}>{MONATSNAMEN[monIdx].toUpperCase()}</button>
          );
        })}
      </div>

      {/* Stat Karten */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'TOTAL SPEND', wert: formatEuro(gesamt), cyan: true },
          { label: 'TRANSACTIONS', wert: dieserMonat.length.toString() },
          { label: 'AVG. TICKET', wert: formatEuro(durchschnitt) },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 10px' }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: s.cyan ? '#00f2ff' : '#e2e2e2', letterSpacing: '-0.01em' }}>{s.wert}</div>
          </div>
        ))}
      </div>

      {/* Line Chart — 14 Tage */}
      <div style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px', marginBottom: 12 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>WEEKLY · MONTHLY · YEARLY</div>
        <LineChart daten={tagsDaten} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: "'Space Grotesk', sans-serif", fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '0.05em' }}>
          <span>-14D</span><span>-7D</span><span>TODAY</span>
        </div>
      </div>

      {/* Bar Chart — 6 Monate */}
      <div style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)' }}>6-MONTH OVERVIEW</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: '#00f2ff' }}>{formatEuro(monatsGesamt[aktiv] || 0)}</div>
        </div>
        <BarChart daten={monatsGesamt} aktiv={aktiv} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {monatsListe.map((m, i) => (
            <span key={m} onClick={() => setGewaehlt(m)} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', color: i === aktiv ? '#00f2ff' : 'rgba(255,255,255,0.2)', cursor: 'pointer', flex: 1, textAlign: 'center' }}>
              {MONATSNAMEN[parseInt(m.split('-')[1])-1].toUpperCase().slice(0,3)}
            </span>
          ))}
        </div>
      </div>

      {/* Kategorie Breakdown */}
      <div style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px', marginBottom: 12 }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>CATEGORY BREAKDOWN</div>
        {kategorien.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No data for this period</p>
        ) : (
          kategorien.map((k, idx) => {
            const pct = gesamt > 0 ? (k.betrag / gesamt) * 100 : 0;
            return (
              <div key={k.name} style={{ marginBottom: idx < kategorien.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#e2e2e2', display: 'flex', alignItems: 'center', gap: 8 }}>{k.emoji} {k.name}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#e2e2e2' }}>{formatEuro(k.betrag)}</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{pct.toFixed(1)}%</div>
                  </div>
                </div>
                <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <div style={{ height: 2, borderRadius: 1, width: `${Math.round(pct)}%`, background: '#00f2ff', boxShadow: '0 0 8px rgba(0,242,255,0.5)', transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
