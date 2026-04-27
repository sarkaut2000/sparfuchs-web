import { useState, useEffect } from 'react';
import {
  getFixkosten, saveFixkosten, updateFixkosten,
  deleteFixkosten, formatEuro
} from '../lib/storage';
import { getAlleKategorien, getKategorie } from '../lib/kategorien';
import Accordion from '../components/Accordion';
import type { Fixkosten as FixkostenType, Kategorie, Zahlungsrhythmus } from '../types';
import { monatlicherBetrag, RHYTHMUS_LABEL } from '../types';

const RHYTHMEN: Zahlungsrhythmus[] = ['monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich'];


export default function Fixkosten() {
  const [fixkosten, setFixkosten] = useState<FixkostenType[]>([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [betrag, setBetrag] = useState('');
  const [kategorie, setKategorie] = useState<Kategorie>('Miete');
  const [faelligAm, setFaelligAm] = useState('1');
  const [rhythmus, setRhythmus] = useState<Zahlungsrhythmus>('monatlich');
  const [fehler, setFehler] = useState('');

  useEffect(() => { setFixkosten(getFixkosten()); }, []);

  const aktiveFixkosten = fixkosten.filter(f => f.aktiv);
  const gesamtMonatlich = aktiveFixkosten.reduce((s, f) => s + monatlicherBetrag(f), 0);
  const gesamtJaehrlich = gesamtMonatlich * 12;

  // Gruppiere nach Rhythmus
  const nachRhythmus = (r: Zahlungsrhythmus) => fixkosten.filter(f => (f.rhythmus ?? 'monatlich') === r);

  function hinzufuegen() {
    const betragNum = parseFloat(betrag.replace(',', '.'));
    if (!name.trim() || isNaN(betragNum) || betragNum <= 0) {
      setFehler('Bitte Name und Betrag eingeben.'); return;
    }
    saveFixkosten({ name: name.trim(), betrag: betragNum, kategorie, faellig_am: parseInt(faelligAm) || 1, aktiv: true, rhythmus });
    setFixkosten(getFixkosten());
    setModal(false);
    setName(''); setBetrag(''); setFaelligAm('1'); setRhythmus('monatlich'); setFehler('');
  }

  function toggle(id: string, aktiv: boolean) {
    updateFixkosten(id, { aktiv });
    setFixkosten(getFixkosten());
  }

  function loeschen(id: string, n: string) {
    if (confirm(`"${n}" wirklich löschen?`)) {
      deleteFixkosten(id);
      setFixkosten(getFixkosten());
    }
  }

  function renderFixZeile(f: FixkostenType) {
    const k = getKategorie(f.kategorie);
    const r = f.rhythmus ?? 'monatlich';
    const monatl = monatlicherBetrag(f);
    return (
      <div className="fix-zeile" key={f.id} style={{ opacity: f.aktiv ? 1 : 0.45 }}>
        <div className="buchung-icon" style={{ background: k.farbe + '20' }}>{k.emoji}</div>
        <div className="fix-info">
          <div className="fix-name">{f.name}</div>
          <div className="fix-meta">
            {k.name} · fällig am {f.faellig_am}.
            {r !== 'monatlich' && ` · ≈ ${formatEuro(monatl)}/Mo.`}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="fix-betrag">{formatEuro(f.betrag)}</div>
          {r !== 'monatlich' && <div style={{ fontSize: 10, color: 'var(--text3)' }}>{r === 'vierteljaehrlich' ? '/ Quartal' : r === 'halbjaehrlich' ? '/ Halbjahr' : '/ Jahr'}</div>}
        </div>
        <label className="toggle">
          <input type="checkbox" checked={f.aktiv} onChange={e => toggle(f.id, e.target.checked)} />
          <span className="toggle-slider" />
        </label>
        <button className="buchung-del" onClick={() => loeschen(f.id, f.name)}>🗑</button>
      </div>
    );
  }

  const betragNum = parseFloat(betrag.replace(',', '.'));
  const vorschauMonatlich = !isNaN(betragNum) && betragNum > 0
    ? (rhythmus === 'vierteljaehrlich' ? betragNum / 3 : rhythmus === 'halbjaehrlich' ? betragNum / 6 : rhythmus === 'jaehrlich' ? betragNum / 12 : betragNum)
    : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Fixkosten</h1>
        <button
          style={{ background: 'linear-gradient(135deg,#34C759,#30B455)', color: '#fff', border: 'none', borderRadius: 12, padding: '8px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={() => setModal(true)}
        >+ Neu</button>
      </div>

      {/* Hero Banner */}
      <div className="hero-card" style={{ background: 'linear-gradient(135deg,#3498DB,#5856D6)', margin: '0 4px 14px' }}>
        <div className="hero-label">Monatliche Fixkosten gesamt</div>
        <div className="hero-betrag">{formatEuro(gesamtMonatlich)}</div>
        <div className="hero-sub">{aktiveFixkosten.length} aktive Positionen</div>
        <div className="hero-pills">
          <div className="hero-pill">📅 Jährlich {formatEuro(gesamtJaehrlich)}</div>
        </div>
      </div>

      {fixkosten.length === 0 ? (
        <div className="leer" style={{ marginTop: 40 }}>
          <span className="leer-emoji">🔄</span>
          <p className="leer-text">Noch keine Fixkosten eingetragen</p>
        </div>
      ) : (
        <>
          {RHYTHMEN.map(r => {
            const items = nachRhythmus(r);
            if (items.length === 0) return null;
            const summe = items.filter(f => f.aktiv).reduce((s, f) => s + monatlicherBetrag(f), 0);
            return (
              <Accordion
                key={r}
                titel={RHYTHMUS_LABEL[r]}
                badge={`${formatEuro(summe)}/Mo.`}
                defaultOffen={true}
              >
                {items.map(f => renderFixZeile(f))}
              </Accordion>
            );
          })}
        </>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">🔄 Neue Fixkosten</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>

            <label className="form-label">Zahlungsrhythmus</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
              {RHYTHMEN.map(r => (
                <button
                  key={r}
                  onClick={() => setRhythmus(r)}
                  style={{
                    padding: '10px 8px', borderRadius: 12, border: '1.5px solid',
                    borderColor: rhythmus === r ? 'var(--accent2)' : 'var(--border)',
                    background: rhythmus === r ? 'rgba(0,122,255,0.1)' : '#fff',
                    color: rhythmus === r ? 'var(--accent2)' : 'var(--text2)',
                    fontWeight: rhythmus === r ? 700 : 500, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                  }}
                >
                  {RHYTHMUS_LABEL[r].replace('📅 ', '')}
                </button>
              ))}
            </div>

            <label className="form-label">Name</label>
            <input className="form-input" placeholder="z.B. Miete" value={name} onChange={e => { setName(e.target.value); setFehler(''); }} autoFocus />

            <label className="form-label">Betrag (€) — pro Zahlung</label>
            <input className="form-input" type="number" inputMode="decimal" placeholder="0,00" value={betrag} onChange={e => setBetrag(e.target.value)} />

            {/* Vorschau monatlicher Anteil */}
            {vorschauMonatlich > 0 && rhythmus !== 'monatlich' && (
              <div style={{ background: 'rgba(0,122,255,0.08)', borderRadius: 10, padding: '8px 14px', marginTop: 8, fontSize: 13, color: 'var(--accent2)', fontWeight: 600 }}>
                💡 Monatlicher Anteil: {formatEuro(vorschauMonatlich)}/Monat
              </div>
            )}

            <label className="form-label">Fällig am (Tag im Monat)</label>
            <input className="form-input" type="number" min="1" max="31" value={faelligAm} onChange={e => setFaelligAm(e.target.value)} />

            {fehler && <p className="fehler">{fehler}</p>}

            <label className="form-label">Kategorie</label>
            <div className="kat-grid">
              {getAlleKategorien().map(k => (
                <button
                  key={k.name}
                  className={`kat-btn ${kategorie === k.name ? 'aktiv' : ''}`}
                  style={kategorie === k.name ? { background: k.farbe } : {}}
                  onClick={() => setKategorie(k.name)}
                  type="button"
                >{k.emoji} {k.name}</button>
              ))}
            </div>

            <button className="btn-primary" onClick={hinzufuegen}>Hinzufügen</button>
          </div>
        </div>
      )}
    </div>
  );
}
