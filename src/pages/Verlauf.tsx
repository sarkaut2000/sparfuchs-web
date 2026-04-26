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

  return (
    <div className="page">
      <h1 className="page-title">Verlauf</h1>
      {ausgaben.length === 0 ? (
        <div className="leer">
          <span className="leer-emoji">📋</span>
          <p className="leer-text">Noch keine Ausgaben erfasst</p>
        </div>
      ) : (
        <div className="card">
          {ausgaben.map(a => {
            const k = getKategorie(a.kategorie);
            return (
              <div className="buchung-zeile" key={a.id}>
                <div className="buchung-dot" style={{ background: k.farbe }} />
                <div className="buchung-info">
                  <div className="buchung-titel">{a.beschreibung || a.kategorie}</div>
                  <div className="buchung-datum">
                    {k.emoji} {a.kategorie} · {new Date(a.datum).toLocaleDateString('de-DE')}
                  </div>
                </div>
                <span className="buchung-betrag">-{formatEuro(a.betrag)}</span>
                <button
                  className="buchung-del"
                  onClick={() => loeschen(a.id, a.beschreibung || a.kategorie)}
                  title="Löschen"
                >🗑</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
