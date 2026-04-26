import { useState, useEffect } from 'react';
import { getAusgaben, deleteAusgabe, updateAusgabe, formatEuro } from '../lib/storage';
import { getKategorie, getAlleKategorien } from '../lib/kategorien';
import Accordion from '../components/Accordion';
import type { Ausgabe, Kategorie } from '../types';

type Zeitraum = 'alle' | 'woche' | 'monat' | 'jahr';

function startOfWeek(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + 1);
  return d;
}

function filterAusgaben(ausgaben: Ausgabe[], zeitraum: Zeitraum): Ausgabe[] {
  if (zeitraum === 'alle') return ausgaben;
  const jetzt = new Date();
  const von = new Date();
  if (zeitraum === 'woche') von.setTime(startOfWeek().getTime());
  if (zeitraum === 'monat') { von.setDate(1); von.setHours(0, 0, 0, 0); }
  if (zeitraum === 'jahr') { von.setMonth(0, 1); von.setHours(0, 0, 0, 0); }
  return ausgaben.filter(a => {
    const d = new Date(a.datum);
    return d >= von && d <= jetzt;
  });
}

export default function Verlauf() {
  const [ausgaben, setAusgaben] = useState<Ausgabe[]>([]);
  const [zeitraum, setZeitraum] = useState<Zeitraum>('monat');
  const [editModal, setEditModal] = useState<Ausgabe | null>(null);
  const [editBetrag, setEditBetrag] = useState('');
  const [editBeschreibung, setEditBeschreibung] = useState('');
  const [editKategorie, setEditKategorie] = useState<Kategorie>('Sonstiges');
  const [editDatum, setEditDatum] = useState('');
  const [fehler, setFehler] = useState('');

  useEffect(() => { setAusgaben(getAusgaben()); }, []);

  function oeffneEdit(a: Ausgabe) {
    setEditModal(a);
    setEditBetrag(a.betrag.toString());
    setEditBeschreibung(a.beschreibung || '');
    setEditKategorie(a.kategorie);
    setEditDatum(a.datum.slice(0, 10));
    setFehler('');
  }

  function speichernEdit() {
    if (!editModal) return;
    const betragNum = parseFloat(editBetrag.replace(',', '.'));
    if (isNaN(betragNum) || betragNum <= 0) {
      setFehler('Bitte einen gültigen Betrag eingeben');
      return;
    }
    updateAusgabe(editModal.id, {
      betrag: betragNum,
      beschreibung: editBeschreibung,
      kategorie: editKategorie,
      datum: editDatum,
    });
    const aktualisiert = getAusgaben();
    setAusgaben(aktualisiert);
    setEditModal(null);
  }

  function loeschen(id: string, name: string) {
    if (confirm(`"${name}" wirklich löschen?`)) {
      deleteAusgabe(id);
      setAusgaben(getAusgaben());
      setEditModal(null);
    }
  }

  const gefiltertAusgaben = filterAusgaben(ausgaben, zeitraum);
  const gesamt = gefiltertAusgaben.reduce((s, a) => s + a.betrag, 0);

  const gruppen = gefiltertAusgaben.reduce<Record<string, Ausgabe[]>>((acc, a) => {
    const tag = a.datum.slice(0, 10);
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(a);
    return acc;
  }, {});
  const gruppenSortiert = Object.entries(gruppen).sort(([a], [b]) => b.localeCompare(a));

  const ZEITRAEUME: { key: Zeitraum; label: string }[] = [
    { key: 'woche',  label: 'Woche'  },
    { key: 'monat',  label: 'Monat'  },
    { key: 'jahr',   label: 'Jahr'   },
    { key: 'alle',   label: 'Alles'  },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Verlauf</h1>
        <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>{formatEuro(gesamt)}</div>
      </div>

      {/* Zeitraum-Filter */}
      <div style={{ display: 'flex', background: '#E5E5EA', borderRadius: 12, padding: 3, marginBottom: 16 }}>
        {ZEITRAEUME.map(z => (
          <button key={z.key} onClick={() => setZeitraum(z.key)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: zeitraum === z.key ? '#fff' : 'transparent',
            color: zeitraum === z.key ? 'var(--text)' : 'var(--text3)',
            fontWeight: zeitraum === z.key ? 700 : 500, fontSize: 13,
            boxShadow: zeitraum === z.key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}>
            {z.label}
          </button>
        ))}
      </div>

      {/* Anzahl Info */}
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12, paddingLeft: 2 }}>
        {gefiltertAusgaben.length} Buchungen · {formatEuro(gesamt)}
      </div>

      {gefiltertAusgaben.length === 0 ? (
        <div className="leer" style={{ marginTop: 40 }}>
          <span className="leer-emoji">📋</span>
          <p className="leer-text">Keine Buchungen in diesem Zeitraum</p>
        </div>
      ) : (
        gruppenSortiert.map(([tag, items]) => (
          <Accordion
            key={tag}
            titel={new Date(tag + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            badge={`${formatEuro(items.reduce((s, a) => s + a.betrag, 0))}`}
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
                    <div className="buchung-datum">{k.name}{a.ist_fixkosten ? ' · 🔒 Fix' : ''}</div>
                  </div>
                  <span className="buchung-betrag">-{formatEuro(a.betrag)}</span>
                  <span style={{ fontSize: 16, color: 'var(--text3)', marginLeft: 4 }}>✏️</span>
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
              <span className="modal-title">✏️ Bearbeiten</span>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>

            <label className="form-label">Betrag (€)</label>
            <input
              className="form-input"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={editBetrag}
              onChange={e => { setEditBetrag(e.target.value); setFehler(''); }}
              autoFocus
            />
            {fehler && <p className="fehler">{fehler}</p>}

            <label className="form-label">Beschreibung</label>
            <input
              className="form-input"
              type="text"
              value={editBeschreibung}
              onChange={e => setEditBeschreibung(e.target.value)}
              placeholder="z.B. Wocheneinkauf"
            />

            <label className="form-label">Datum</label>
            <input
              className="form-input"
              type="date"
              value={editDatum}
              onChange={e => setEditDatum(e.target.value)}
            />

            <label className="form-label">Kategorie</label>
            <div className="kat-grid" style={{ marginTop: 6 }}>
              {getAlleKategorien().map(k => (
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

            <button className="btn-primary" onClick={speichernEdit} style={{ marginTop: 22 }}>
              ✓ Änderungen speichern
            </button>
            <button
              onClick={() => loeschen(editModal.id, editModal.beschreibung || editModal.kategorie)}
              style={{
                width: '100%', padding: 14, marginTop: 10,
                background: '#FF3B3012', border: 'none', borderRadius: 12,
                color: 'var(--red)', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
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
