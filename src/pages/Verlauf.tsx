import { useState, useEffect } from 'react';
import { getAusgaben, deleteAusgabe, formatEuro } from '../lib/storage';
import { getKategorie } from '../lib/kategorien';
import type { Ausgabe } from '../types';

export default function Verlauf() {
  const [ausgaben, setAusgaben] = useState<Ausgabe[]>([]);

  useEffect(() => { setAusgaben(getAusgaben()); }, []);

  function loeschen(id: string, name: string) {
    if (confirm(`"${name}" wirklich löschen?`)) {
      deleteAusgabe(id);
      setAusgaben(getAusgaben());
    }
  }

  // Gruppiere nach Datum
  const gruppen = ausgaben.reduce<Record<string, Ausgabe[]>>((acc, a) => {
    const tag = a.datum.slice(0, 10);
    if (!acc[tag]) acc[tag] = [];
    acc[tag].push(a);
    return acc;
  }, {});

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
        Object.entries(gruppen)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([tag, items]) => (
            <div key={tag}>
              <div className="verlauf-gruppe-title">
                {new Date(tag).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <div className="glass-card" style={{ padding: '4px 16px' }}>
                {items.map(a => {
                  const k = getKategorie(a.kategorie);
                  return (
                    <div className="buchung-zeile" key={a.id}>
                      <div className="buchung-icon" style={{ background: k.farbe + '20' }}>{k.emoji}</div>
                      <div className="buchung-info">
                        <div className="buchung-titel">{a.beschreibung || a.kategorie}</div>
                        <div className="buchung-datum">{k.name}</div>
                      </div>
                      <span className="buchung-betrag">-{formatEuro(a.betrag)}</span>
                      <button className="buchung-del" onClick={() => loeschen(a.id, a.beschreibung || a.kategorie)}>🗑</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
