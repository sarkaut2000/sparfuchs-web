import { useState, useEffect } from 'react';
import { getAusgaben, deleteAusgabe, updateAusgabe, formatEuro } from '../lib/storage';
import { getKategorie, getAlleKategorien } from '../lib/kategorien';
import type { Ausgabe, Kategorie } from '../types';

type Zeitraum = 'alle' | 'woche' | 'monat' | 'jahr';

function filterNachZeit(ausgaben: Ausgabe[], zeitraum: Zeitraum): Ausgabe[] {
  if (zeitraum === 'alle') return ausgaben;
  const jetzt = new Date(); const von = new Date();
  if (zeitraum === 'woche')  { von.setDate(von.getDate() - 7); }
  if (zeitraum === 'monat')  { von.setDate(1); von.setHours(0,0,0,0); }
  if (zeitraum === 'jahr')   { von.setMonth(0,1); von.setHours(0,0,0,0); }
  return ausgaben.filter(a => new Date(a.datum) >= von && new Date(a.datum) <= jetzt);
}

const ZEITRAEUME: { key: Zeitraum; label: string }[] = [
  { key: 'alle', label: 'ALL' },
  { key: 'monat', label: 'MONTH' },
  { key: 'woche', label: 'WEEK' },
  { key: 'jahr', label: 'YEAR' },
];

export default function Verlauf() {
  const [ausgaben, setAusgaben] = useState<Ausgabe[]>([]);
  const [suche, setSuche] = useState('');
  const [zeitraum, setZeitraum] = useState<Zeitraum>('monat');
  const [filterKat, setFilterKat] = useState<string>('ALL');
  const [editModal, setEditModal] = useState<Ausgabe | null>(null);
  const [editBetrag, setEditBetrag] = useState('');
  const [editBeschreibung, setEditBeschreibung] = useState('');
  const [editKategorie, setEditKategorie] = useState<Kategorie>('Sonstiges');
  const [editDatum, setEditDatum] = useState('');

  useEffect(() => { setAusgaben(getAusgaben()); }, []);

  const alleKategorien = getAlleKategorien();
  const katFilter = ['ALL', ...alleKategorien.map(k => k.name)];

  let gefiltert = filterNachZeit(ausgaben, zeitraum);
  if (filterKat !== 'ALL') gefiltert = gefiltert.filter(a => a.kategorie === filterKat);
  if (suche.trim()) gefiltert = gefiltert.filter(a =>
    (a.beschreibung + a.kategorie).toLowerCase().includes(suche.toLowerCase())
  );
  const gesamt = gefiltert.reduce((s, a) => s + a.betrag, 0);

  const gruppen = gefiltert.reduce<Record<string, Ausgabe[]>>((acc, a) => {
    const tag = a.datum.slice(0, 10);
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(a);
    return acc;
  }, {});
  const gruppenSortiert = Object.entries(gruppen).sort(([a], [b]) => b.localeCompare(a));

  function oeffneEdit(a: Ausgabe) {
    setEditModal(a);
    setEditBetrag(a.betrag.toString());
    setEditBeschreibung(a.beschreibung || '');
    setEditKategorie(a.kategorie);
    setEditDatum(a.datum.slice(0, 10));
  }

  function speichernEdit() {
    if (!editModal) return;
    const n = parseFloat(editBetrag.replace(',', '.'));
    if (isNaN(n) || n <= 0) return;
    updateAusgabe(editModal.id, { betrag: n, beschreibung: editBeschreibung, kategorie: editKategorie, datum: editDatum });
    setAusgaben(getAusgaben());
    setEditModal(null);
  }

  function loeschen(id: string, name: string) {
    if (confirm(`"${name}" wirklich löschen?`)) { deleteAusgabe(id); setAusgaben(getAusgaben()); setEditModal(null); }
  }

  return (
    <div className="page" style={{ paddingTop: 24 }}>
      {/* Hero Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 48, fontWeight: 900, letterSpacing: '-0.02em', color: '#e2e2e2', lineHeight: 1, marginBottom: 8 }}>ACTIVITY</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Detailed breakdown of your financial interactions and real-time ledger updates.</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>search</span>
        <input
          style={{ width: '100%', padding: '12px 14px 12px 44px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e2e2', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: '0.08em', outline: 'none' }}
          placeholder="SEARCH TRANSACTIONS..."
          value={suche}
          onChange={e => setSuche(e.target.value)}
        />
      </div>

      {/* Zeitraum Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
        {ZEITRAEUME.map(z => (
          <button key={z.key} onClick={() => setZeitraum(z.key)} style={{
            padding: '8px 18px', borderRadius: 8, border: `1px solid ${zeitraum === z.key ? 'rgba(0,242,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
            background: zeitraum === z.key ? 'rgba(0,242,255,0.08)' : 'transparent',
            color: zeitraum === z.key ? '#00f2ff' : 'rgba(255,255,255,0.4)',
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            cursor: 'pointer', whiteSpace: 'nowrap' as const,
            boxShadow: zeitraum === z.key ? '0 0 12px rgba(0,242,255,0.15)' : 'none',
          }}>{z.label}</button>
        ))}
      </div>

      {/* Kategorie Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {katFilter.slice(0, 8).map(k => (
          <button key={k} onClick={() => setFilterKat(k)} style={{
            padding: '6px 14px', borderRadius: 6, border: `1px solid ${filterKat === k ? 'rgba(0,242,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
            background: filterKat === k ? 'rgba(0,242,255,0.08)' : 'transparent',
            color: filterKat === k ? '#00f2ff' : 'rgba(255,255,255,0.3)',
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
            cursor: 'pointer', whiteSpace: 'nowrap' as const,
          }}>{k}</button>
        ))}
      </div>

      {/* Zusammenfassung */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20, padding: '12px 16px', background: 'rgba(0,242,255,0.04)', border: '1px solid rgba(0,242,255,0.1)', borderRadius: 8 }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)' }}>{gefiltert.length} Transactions</span>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, color: '#e2e2e2', letterSpacing: '-0.01em' }}>{formatEuro(gesamt)}</span>
      </div>

      {/* Listen */}
      {gefiltert.length === 0 ? (
        <div className="leer"><span className="leer-emoji">📋</span><p className="leer-text">Keine Buchungen gefunden</p></div>
      ) : (
        gruppenSortiert.map(([tag, items]) => (
          <div key={tag}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', margin: '16px 0 8px', padding: '0 2px' }}>
              {new Date(tag + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
              <span style={{ marginLeft: 12, color: 'rgba(0,242,255,0.5)' }}>{formatEuro(items.reduce((s,a)=>s+a.betrag,0))}</span>
            </div>
            <div style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
              {items.map((a, i) => {
                const k = getKategorie(a.kategorie);
                return (
                  <div key={a.id} onClick={() => oeffneEdit(a)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < items.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(0,242,255,0.08)', border: '1px solid rgba(0,242,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{k.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e2e2' }}>{a.beschreibung || a.kategorie}</div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                        {a.kategorie} {a.ist_fixkosten ? '· FIXED MONTHLY' : '· VARIABLE'}
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: '#e2e2e2' }}>-{formatEuro(a.betrag)}</span>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>›</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">Edit Transaction</span>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <label className="form-label">Amount (€)</label>
            <input className="form-input" type="number" inputMode="decimal" step="0.01" value={editBetrag} onChange={e => setEditBetrag(e.target.value)} autoFocus />
            <label className="form-label">Description</label>
            <input className="form-input" type="text" value={editBeschreibung} onChange={e => setEditBeschreibung(e.target.value)} />
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={editDatum} onChange={e => setEditDatum(e.target.value)} />
            <label className="form-label">Category</label>
            <div className="kat-grid">
              {getAlleKategorien().map(k => (
                <button key={k.name} className={`kat-btn ${editKategorie === k.name ? 'aktiv' : ''}`} style={editKategorie === k.name ? { background: '#00f2ff' } : {}} onClick={() => setEditKategorie(k.name)} type="button">{k.emoji} {k.name}</button>
              ))}
            </div>
            <button className="btn-primary" onClick={speichernEdit}>Save Changes</button>
            <button onClick={() => loeschen(editModal.id, editModal.beschreibung || editModal.kategorie)} style={{ width: '100%', padding: 14, marginTop: 10, background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)', borderRadius: 8, color: '#ff6b6b', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.08em' }}>DELETE TRANSACTION</button>
          </div>
        </div>
      )}
    </div>
  );
}
