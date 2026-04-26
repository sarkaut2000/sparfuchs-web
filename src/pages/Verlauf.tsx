import { useState, useEffect } from 'react';
import { getAusgaben, deleteAusgabe, updateAusgabe, formatEuro } from '../lib/storage';
import { getKategorie, KATEGORIEN } from '../lib/kategorien';
import Accordion from '../components/Accordion';
import type { Ausgabe, Kategorie } from '../types';

export default function Verlauf() {
  const [ausgaben, setAusgaben] = useState<Ausgabe[]>([]);
  const [editModal, setEditModal] = useState<Ausgabe | null>(null);
  const [editBetrag, setEditBetrag] = useState('');
  const [editBeschreibung, setEditBeschreibung] = useState('');
  const [editKategorie, setEditKategorie] = useState<Kategorie>('Sonstiges');
  const [editDatum, setEditDatum] = useState('');

  useEffect(() => { setAusgaben(getAusgaben()); }, []);

  function oeffneEdit(a: Ausgabe) {
    setEditModal(a);
    setEditBetrag(a.betrag.toFixed(2).replace('.', ','));
    setEditBeschreibung(a.beschreibung);
    setEditKategorie(a.kategorie);
    setEditDatum(a.datum.slice(0, 10));
  }

  function speichernEdit() {
    if (!editModal) return;
    const betragNum = parseFloat(editBetrag.replace(',', '.'));
    if (isNaN(betragNum) || betragNum <= 0) return;
    updateAusgabe(editModal.id, { betrag: betragNum, beschreibung: editBeschreibung, kategorie: editKategorie, datum: editDatum });
    setAusgaben(getAusgaben());
    setEditModal(null);
  }

  function loeschen(id: string, name: string) {
    if (confirm(`"${name}" wirklich löschen?`)) {
      deleteAusgabe(id);
      setAusgaben(getAusgaben());
      setEditModal(null);
    }
  }

  const gruppen = ausgaben.reduce<Record<string, Ausgabe[]>>((acc, a) => {
    const tag = a.datum.slice(0, 10);
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(a);
    return acc;
  }, {});

  const gruppenSortiert = Object.entries(gruppen).sort(([a], [b]) => b.localeCompare(a));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Verlauf</h1>
        <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>{ausgaben.length} Einträge</div>
      </div>

      {ausgaben.length === 0 ? (
        <div className="leer" style={{ marginTop: 60 }}>
          <span className="leer-emoji">📋</span>
          <p className="leer-text">Noch keine Ausgaben</p>
          <p className="leer-hint">Geh zur Übersicht und tippe auf ein Icon</p>
        </div>
      ) : (
        gruppenSortiert.map(([tag, items]) => (
          <Accordion
            key={tag}
            titel={new Date(tag).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
            badge={`${items.length}`}
            defaultOffen={true}
          >
            {items.map(a => {
              const k = getKategorie(a.kategorie);
              return (
                <div
                  className="buchung-zeile"
                  key={a.id}
                  onClick={() => oeffneEdit(a)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="buchung-icon" style={{ background: k.farbe + '20' }}>{k.emoji}</div>
                  <div className="buchung-info">
                    <div className="buchung-titel">{a.beschreibung || a.kategorie}</div>
                    <div className="buchung-datum">{k.name} {a.ist_fixkosten && '· 🔒'}</div>
                  </div>
                  <span className="buchung-betrag">-{formatEuro(a.betrag)}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 4 }}>›</span>
                </div>
              );
            })}
          </Accordion>
        ))
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">Bearbeiten</span>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>

            <label className="form-label">Betrag (€)</label>
            <input className="form-input" type="number" inputMode="decimal" value={editBetrag} onChange={e => setEditBetrag(e.target.value)} autoFocus />

            <label className="form-label">Beschreibung</label>
            <input className="form-input" type="text" value={editBeschreibung} onChange={e => setEditBeschreibung(e.target.value)} placeholder="Beschreibung" />

            <label className="form-label">Datum</label>
            <input className="form-input" type="date" value={editDatum} onChange={e => setEditDatum(e.target.value)} />

            <label className="form-label">Kategorie</label>
            <div className="kat-grid">
              {KATEGORIEN.map(k => (
                <button
                  key={k.name}
                  className={`kat-btn ${editKategorie === k.name ? 'aktiv' : ''}`}
                  style={editKategorie === k.name ? { background: k.farbe } : {}}
                  onClick={() => setEditKategorie(k.name)}
                  type="button"
                >
                  {k.emoji} {k.name}
                </button>
              ))}
            </div>

            <button className="btn-primary" onClick={speichernEdit} style={{ marginTop: 20 }}>
              ✓ Speichern
            </button>
            <button
              onClick={() => loeschen(editModal.id, editModal.beschreibung || editModal.kategorie)}
              style={{
                width: '100%', padding: 14, marginTop: 10,
                background: '#FF3B3010', border: 'none', borderRadius: 12,
                color: 'var(--red)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              🗑 Löschen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
