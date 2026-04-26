import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAusgabe } from '../lib/storage';
import { KATEGORIEN } from '../lib/kategorien';
import type { Kategorie } from '../types';

export default function NeueAusgabe() {
  const navigate = useNavigate();
  const [betrag, setBetrag] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [kategorie, setKategorie] = useState<Kategorie>('Sonstiges');
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [fehler, setFehler] = useState('');

  function speichern() {
    const betragNum = parseFloat(betrag.replace(',', '.'));
    if (isNaN(betragNum) || betragNum <= 0) {
      setFehler('Bitte einen gültigen Betrag eingeben (z.B. 12,50)');
      return;
    }
    setSaving(true);
    saveAusgabe({ betrag: betragNum, beschreibung, kategorie, datum, ist_fixkosten: false });
    navigate('/');
  }

  return (
    <div className="page">
      <h1 className="page-title">Neue Ausgabe</h1>

      <label className="form-label">Betrag (€)</label>
      <input
        className="form-input"
        type="number"
        inputMode="decimal"
        placeholder="0,00"
        value={betrag}
        onChange={e => { setBetrag(e.target.value); setFehler(''); }}
        autoFocus
      />
      {fehler && <p style={{ color: '#E74C3C', fontSize: 13, marginTop: 6 }}>{fehler}</p>}

      <label className="form-label">Beschreibung (optional)</label>
      <input
        className="form-input"
        type="text"
        placeholder="z.B. Wocheneinkauf"
        value={beschreibung}
        onChange={e => setBeschreibung(e.target.value)}
      />

      <label className="form-label">Datum</label>
      <input
        className="form-input"
        type="date"
        value={datum}
        onChange={e => setDatum(e.target.value)}
      />

      <label className="form-label">Kategorie</label>
      <div className="kat-grid">
        {KATEGORIEN.map(k => (
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

      <button className="btn-primary" onClick={speichern} disabled={saving}>
        {saving ? 'Wird gespeichert...' : '✓ Ausgabe speichern'}
      </button>

      <button
        onClick={() => navigate('/')}
        style={{ width: '100%', padding: 14, marginTop: 10, background: 'none', border: 'none', color: '#999', fontSize: 14, cursor: 'pointer' }}
      >
        Abbrechen
      </button>
    </div>
  );
}
