import { useState, useEffect } from 'react';
import {
  getFixkosten, saveFixkosten, updateFixkosten,
  deleteFixkosten, formatEuro
} from '../lib/storage';
import { getAlleKategorien, getKategorie } from '../lib/kategorien';
import type { Fixkosten as FixkostenType, Kategorie } from '../types';

export default function Fixkosten() {
  const [fixkosten, setFixkosten] = useState<FixkostenType[]>([]);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [betrag, setBetrag] = useState('');
  const [kategorie, setKategorie] = useState<Kategorie>('Miete');
  const [faelligAm, setFaelligAm] = useState('1');
  const [fehler, setFehler] = useState('');

  useEffect(() => { setFixkosten(getFixkosten()); }, []);

  const gesamt = fixkosten.filter(f => f.aktiv).reduce((s, f) => s + f.betrag, 0);

  function hinzufuegen() {
    const betragNum = parseFloat(betrag.replace(',', '.'));
    if (!name.trim() || isNaN(betragNum) || betragNum <= 0) {
      setFehler('Bitte Name und Betrag eingeben.');
      return;
    }
    saveFixkosten({ name: name.trim(), betrag: betragNum, kategorie, faellig_am: parseInt(faelligAm) || 1, aktiv: true });
    setFixkosten(getFixkosten());
    setModal(false);
    setName(''); setBetrag(''); setFaelligAm('1'); setFehler('');
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

  return (
    <div className="page">
      <h1 className="page-title">Fixkosten</h1>

      <div className="banner" style={{ background: '#3498DB' }}>
        <p className="banner-label">Monatliche Fixkosten gesamt</p>
        <p className="banner-betrag">{formatEuro(gesamt)}</p>
      </div>

      {fixkosten.length === 0 ? (
        <div className="leer">
          <span className="leer-emoji">🔄</span>
          <p className="leer-text">Noch keine Fixkosten eingetragen</p>
        </div>
      ) : (
        <div className="card">
          {fixkosten.map(f => {
            const k = getKategorie(f.kategorie);
            return (
              <div className="fix-zeile" key={f.id} style={{ opacity: f.aktiv ? 1 : 0.4 }}>
                <div className="buchung-dot" style={{ background: k.farbe }} />
                <div className="fix-info">
                  <div className="fix-name">{f.name}</div>
                  <div className="fix-meta">{k.emoji} {f.kategorie} · fällig am {f.faellig_am}.</div>
                </div>
                <span className="fix-betrag">{formatEuro(f.betrag)}</span>
                <label className="toggle">
                  <input type="checkbox" checked={f.aktiv} onChange={e => toggle(f.id, e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
                <button className="buchung-del" onClick={() => loeschen(f.id, f.name)}>🗑</button>
              </div>
            );
          })}
        </div>
      )}

      <button className="fab" onClick={() => setModal(true)} aria-label="Hinzufügen">+</button>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Neue Fixkosten</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>

            <label className="form-label">Name</label>
            <input className="form-input" placeholder="z.B. Miete" value={name} onChange={e => { setName(e.target.value); setFehler(''); }} autoFocus />

            <label className="form-label">Betrag (€)</label>
            <input className="form-input" type="number" inputMode="decimal" placeholder="0,00" value={betrag} onChange={e => setBetrag(e.target.value)} />

            <label className="form-label">Fällig am (Tag im Monat)</label>
            <input className="form-input" type="number" min="1" max="31" value={faelligAm} onChange={e => setFaelligAm(e.target.value)} />

            {fehler && <p style={{ color: '#E74C3C', fontSize: 13, marginTop: 8 }}>{fehler}</p>}

            <label className="form-label">Kategorie</label>
            <div className="kat-grid">
              {getAlleKategorien().map(k => (
                <button
                  key={k.name}
                  className={`kat-btn ${kategorie === k.name ? 'aktiv' : ''}`}
                  style={kategorie === k.name ? { background: k.farbe } : {}}
                  onClick={() => setKategorie(k.name)}
                  type="button"
                >
                  {k.emoji} {k.name}
                </button>
              ))}
            </div>

            <button className="btn-primary" onClick={hinzufuegen}>Hinzufügen</button>
          </div>
        </div>
      )}
    </div>
  );
}
