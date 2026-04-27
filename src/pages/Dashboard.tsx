import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAusgaben, getFixkosten, getAusgabenFuerMonat,
  summeNachKategorie, saveAusgabe, saveFixkosten,
  getEinkommenFuerMonat, saveEinkommen,
  formatEuro, aktuellerMonat
} from '../lib/storage';
import { getAlleKategorien, getKategorie } from '../lib/kategorien';
import { getKategorieDesigns } from '../lib/icons';
import { analysiereSparPotenzial } from '../lib/analyse';
import Accordion from '../components/Accordion';
import type { Ausgabe, Fixkosten, Kategorie } from '../types';

const MONATSNAMEN = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [ausgaben, setAusgaben] = useState<Ausgabe[]>([]);
  const [fixkosten, setFixkosten] = useState<Fixkosten[]>([]);
  const [designs, setDesigns] = useState(getKategorieDesigns());
  const [einkommen, setEinkommen] = useState(0);

  // Ausgaben Modal
  const [modal, setModal] = useState<Kategorie | null>(null);
  const [betrag, setBetrag] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [buchungsTyp, setBuchungsTyp] = useState<'einmalig' | 'monatlich'>('einmalig');
  const [faelligAm, setFaelligAm] = useState('1');
  const [fehler, setFehler] = useState('');

  // Einnahmen Modal
  const [einnahmenModal, setEinnahmenModal] = useState(false);
  const [einnahmenInput, setEinnahmenInput] = useState('');

  const monat = aktuellerMonat();

  useEffect(() => {
    setAusgaben(getAusgaben());
    setFixkosten(getFixkosten());
    setDesigns(getKategorieDesigns());
    setEinkommen(getEinkommenFuerMonat(monat));
  }, []);

  const dieserMonat = getAusgabenFuerMonat(monat);
  const gesamtAusgaben = dieserMonat.reduce((s, a) => s + a.betrag, 0);
  const fixGesamt = fixkosten.filter(f => f.aktiv).reduce((s, f) => s + f.betrag, 0);
  const variabel = gesamtAusgaben - dieserMonat.filter(a => a.ist_fixkosten).reduce((s, a) => s + a.betrag, 0);
  const verbleibend = einkommen - gesamtAusgaben;
  const sparQuote = einkommen > 0 ? (verbleibend / einkommen) * 100 : 0;
  const nachKat = summeNachKategorie(dieserMonat);
  const topKats = Object.entries(nachKat).sort(([,a],[,b]) => b - a).slice(0, 6);
  const tipps = analysiereSparPotenzial();
  const d = new Date();

  function oeffneModal(kat: Kategorie) {
    setModal(kat);
    setBetrag(''); setBeschreibung(''); setFehler('');
    setDatum(new Date().toISOString().slice(0, 10));
    setBuchungsTyp('einmalig'); setFaelligAm('1');
  }

  function speichern() {
    const betragNum = parseFloat(betrag.replace(',', '.'));
    if (isNaN(betragNum) || betragNum <= 0) { setFehler('Bitte einen gültigen Betrag eingeben'); return; }
    if (buchungsTyp === 'monatlich') {
      saveFixkosten({ name: beschreibung || modal!, betrag: betragNum, kategorie: modal!, faellig_am: parseInt(faelligAm) || 1, aktiv: true });
      saveAusgabe({ betrag: betragNum, beschreibung, kategorie: modal!, datum, ist_fixkosten: true });
    } else {
      saveAusgabe({ betrag: betragNum, beschreibung, kategorie: modal!, datum, ist_fixkosten: false });
    }
    setAusgaben(getAusgaben());
    setFixkosten(getFixkosten());
    setModal(null);
  }

  function einnahmenSpeichern() {
    const num = parseFloat(einnahmenInput.replace(',', '.'));
    if (isNaN(num) || num < 0) return;
    saveEinkommen(monat, num);
    setEinkommen(num);
    setEinnahmenModal(false);
    setEinnahmenInput('');
  }

  function renderKatPill(kat: Kategorie) {
    const k = getKategorie(kat);
    const design = designs[kat];
    const hatCustomIcon = design?.customIcon;
    return (
      <button
        key={kat}
        onClick={() => oeffneModal(kat)}
        title={kat}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.03)',
          cursor: 'pointer', transition: 'all 0.15s',
          color: '#e2e2e2', fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
          whiteSpace: 'nowrap' as const, flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(0,242,255,0.4)';
          e.currentTarget.style.background = 'rgba(0,242,255,0.05)';
          e.currentTarget.style.color = '#00f2ff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          e.currentTarget.style.color = '#e2e2e2';
        }}
      >
        {hatCustomIcon
          ? <img src={design.customIcon} alt={kat} style={{ width: 20, height: 20, objectFit: 'contain' }} />
          : <span style={{ fontSize: 18 }}>{k.emoji}</span>
        }
        {kat}
      </button>
    );
  }

  const modalKat = modal ? getKategorie(modal) : null;
  const verbleibendFarbe = verbleibend >= 0 ? '#4A8A5F' : '#B05050';

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>{MONATSNAMEN[d.getMonth()]} {d.getFullYear()}</div>
          <h1 className="page-title">Übersicht</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="header-btn"
            title="Daten exportieren (Backup)"
            onClick={() => {
              const data = {
                ausgaben:    localStorage.getItem('sparfuchs_ausgaben'),
                fixkosten:   localStorage.getItem('sparfuchs_fixkosten'),
                einkommen:   localStorage.getItem('sparfuchs_einkommen'),
                kategorien:  localStorage.getItem('sparfuchs_kategorien'),
                icons:       localStorage.getItem('sparfuchs_icons'),
                reihenfolge: localStorage.getItem('sparfuchs_kat_order'),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sparfuchs-backup-${new Date().toISOString().slice(0,10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >💾</button>
          <button className="header-btn" onClick={() => navigate('/einstellungen')} title="Einstellungen">⚙️</button>
        </div>
      </div>

      {/* ── Budget-Karte (Einnahmen / Ausgaben / Verbleibend) ── */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        marginBottom: 14,
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
      }}>
        {/* Hauptzeile */}
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Verbleibend</div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', color: verbleibendFarbe }}>
                {einkommen > 0 ? formatEuro(verbleibend) : '—'}
              </div>
              {einkommen > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                  {sparQuote >= 0 ? `${sparQuote.toFixed(1)}% gespart` : `${Math.abs(sparQuote).toFixed(1)}% überzogen`}
                </div>
              )}
            </div>
            <button
              onClick={() => { setEinnahmenInput(einkommen > 0 ? einkommen.toString() : ''); setEinnahmenModal(true); }}
              style={{
                padding: '8px 14px', borderRadius: 20,
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                color: 'var(--text2)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {einkommen > 0 ? '✏️ Einkommen' : '+ Einkommen'}
            </button>
          </div>

          {/* Fortschrittsbalken */}
          {einkommen > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${Math.min((gesamtAusgaben / einkommen) * 100, 100)}%`,
                  background: gesamtAusgaben > einkommen ? '#B05050' : gesamtAusgaben > einkommen * 0.8 ? '#A07040' : '#4A8A5F',
                  transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--text3)' }}>
                <span>0 €</span>
                <span>{formatEuro(einkommen)}</span>
              </div>
            </div>
          )}

          {/* 3 Spalten */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'Einnahmen', wert: einkommen, emoji: '💰', farbe: '#4A8A5F' },
              { label: 'Ausgaben',  wert: gesamtAusgaben, emoji: '💸', farbe: '#B05050' },
              { label: 'Fixkosten', wert: fixGesamt, emoji: '🔒', farbe: '#4A72A0' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'var(--surface2)', borderRadius: 14, padding: '12px 10px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 16, marginBottom: 5 }}>{item.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)' }}>
                  {item.wert > 0 ? formatEuro(item.wert) : '—'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Variabel-Zeile */}
        {variabel > 0 && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text3)' }}>
            <span>Variable Ausgaben</span>
            <span style={{ fontWeight: 600, color: 'var(--text2)' }}>{formatEuro(variabel)}</span>
          </div>
        )}
      </div>

      {/* Schnell-Erfassung */}
      <Accordion titel="Schnell erfassen" defaultOffen={true}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {getAlleKategorien().map(k => renderKatPill(k.name))}
        </div>
      </Accordion>

      {/* Top Ausgaben */}
      <Accordion titel="Top Ausgaben" badge={topKats.length > 0 ? String(topKats.length) : undefined} defaultOffen={true}>
        {topKats.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: '8px 0' }}>Noch keine Ausgaben</p>
        ) : (
          topKats.map(([name, betragVal]) => {
            const k = getKategorie(name);
            const prozent = gesamtAusgaben > 0 ? (betragVal / gesamtAusgaben) * 100 : 0;
            return (
              <div className="balken-zeile" key={name}>
                <div className="balken-kopf">
                  <span className="balken-name">{k.emoji} {name}</span>
                  <span className="balken-betrag">{formatEuro(betragVal)}</span>
                </div>
                <div className="balken-bg">
                  <div className="balken-fill" style={{ width: `${Math.round(prozent)}%`, background: k.farbe }} />
                </div>
              </div>
            );
          })
        )}
      </Accordion>

      {/* Sparempfehlungen */}
      <Accordion titel="💡 Sparempfehlungen" badge={tipps.filter(t => t.prioritaet === 'hoch').length > 0 ? '!' : undefined} defaultOffen={false}>
        {tipps.slice(0, 3).map((tipp, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{tipp.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{tipp.titel}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.4 }}>{tipp.beschreibung}</div>
              {tipp.sparpotenzial && tipp.sparpotenzial > 0 && (
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>≈ {formatEuro(tipp.sparpotenzial)}/Monat sparen</div>
              )}
            </div>
          </div>
        ))}
      </Accordion>

      {/* Letzte Buchungen */}
      <Accordion titel="Letzte Buchungen" badge={ausgaben.length > 0 ? String(ausgaben.length) : undefined} defaultOffen={true}>
        {ausgaben.length === 0 ? (
          <div className="leer">
            <span className="leer-emoji">🧾</span>
            <p className="leer-text">Noch keine Ausgaben</p>
            <p className="leer-hint">Tippe oben auf ein Icon</p>
          </div>
        ) : (
          ausgaben.slice(0, 5).map(a => {
            const k = getKategorie(a.kategorie);
            return (
              <div className="buchung-zeile" key={a.id}>
                <div className="buchung-icon" style={{ background: k.farbe + '20' }}>{k.emoji}</div>
                <div className="buchung-info">
                  <div className="buchung-titel">{a.beschreibung || a.kategorie}</div>
                  <div className="buchung-datum">{new Date(a.datum).toLocaleDateString('de-DE')} {a.ist_fixkosten && '· 🔒'}</div>
                </div>
                <span className="buchung-betrag">-{formatEuro(a.betrag)}</span>
              </div>
            );
          })
        )}
      </Accordion>

      {/* ── Einnahmen Modal ── */}
      {einnahmenModal && (
        <div className="modal-overlay" onClick={() => setEinnahmenModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">💰 Mein Einkommen</span>
              <button className="modal-close" onClick={() => setEinnahmenModal(false)}>✕</button>
            </div>

            <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>
              Gib dein monatliches Nettoeinkommen ein. Das wird verwendet um zu zeigen wieviel Geld nach deinen Ausgaben übrig bleibt.
            </div>

            <label className="form-label">Monatliches Nettoeinkommen (€)</label>
            <input
              className="betrag-input"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={einnahmenInput}
              onChange={e => setEinnahmenInput(e.target.value)}
              autoFocus
            />

            {einnahmenInput && parseFloat(einnahmenInput) > 0 && (
              <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: '14px 16px', marginTop: 16 }}>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 10, fontWeight: 600 }}>Vorschau für {MONATSNAMEN[d.getMonth()]}</div>
                {[
                  { label: 'Einkommen',   wert: parseFloat(einnahmenInput), plus: true },
                  { label: 'Ausgaben',    wert: gesamtAusgaben, plus: false },
                  { label: 'Verbleibend', wert: parseFloat(einnahmenInput) - gesamtAusgaben, plus: parseFloat(einnahmenInput) >= gesamtAusgaben, bold: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: i === 2 ? '1px solid var(--border)' : 'none', marginTop: i === 2 ? 6 : 0 }}>
                    <span style={{ fontSize: 14, color: 'var(--text3)', fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: row.bold ? 800 : 600, color: row.bold ? (row.plus ? '#4A8A5F' : '#B05050') : 'var(--text2)' }}>
                      {row.plus ? '+' : '-'}{formatEuro(Math.abs(row.wert))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button className="btn-primary" onClick={einnahmenSpeichern} style={{ marginTop: 20 }}>
              Speichern
            </button>
            {einkommen > 0 && (
              <button
                onClick={() => { saveEinkommen(monat, 0); setEinkommen(0); setEinnahmenModal(false); }}
                style={{ width: '100%', padding: 14, marginTop: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text3)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Einkommen entfernen
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Ausgaben Modal ── */}
      {modal && modalKat && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">{modalKat.emoji} {modal}</span>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 12, padding: 3, marginBottom: 16 }}>
              {(['einmalig', 'monatlich'] as const).map(typ => (
                <button key={typ} onClick={() => setBuchungsTyp(typ)} style={{
                  flex: 1, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: buchungsTyp === typ ? 'var(--surface3)' : 'transparent',
                  color: buchungsTyp === typ ? 'var(--text)' : 'var(--text3)',
                  fontWeight: buchungsTyp === typ ? 700 : 500, fontSize: 14,
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}>
                  {typ === 'einmalig' ? '⚡ Einmalig' : '🔄 Monatlich Fix'}
                </button>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <input className="betrag-input" type="number" inputMode="decimal" placeholder="0,00" value={betrag} onChange={e => { setBetrag(e.target.value); setFehler(''); }} autoFocus />
              {fehler && <p className="fehler">{fehler}</p>}
            </div>

            <label className="form-label">Beschreibung</label>
            <input className="form-input" type="text" placeholder={buchungsTyp === 'monatlich' ? 'z.B. Netflix' : 'z.B. Wocheneinkauf'} value={beschreibung} onChange={e => setBeschreibung(e.target.value)} />

            {buchungsTyp === 'monatlich' ? (
              <><label className="form-label">Fällig am (Tag)</label>
              <input className="form-input" type="number" min="1" max="31" value={faelligAm} onChange={e => setFaelligAm(e.target.value)} /></>
            ) : (
              <><label className="form-label">Datum</label>
              <input className="form-input" type="date" value={datum} onChange={e => setDatum(e.target.value)} /></>
            )}

            <button className="btn-primary" onClick={speichern}>Bestätigen</button>
          </div>
        </div>
      )}
    </div>
  );
}
