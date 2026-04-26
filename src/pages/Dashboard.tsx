import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAusgaben, getFixkosten, getAusgabenFuerMonat,
  summeNachKategorie, saveAusgabe, saveFixkosten,
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

  // Modal State
  const [modal, setModal] = useState<Kategorie | null>(null);
  const [betrag, setBetrag] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10));
  const [buchungsTyp, setBuchungsTyp] = useState<'einmalig' | 'monatlich'>('einmalig');
  const [faelligAm, setFaelligAm] = useState('1');
  const [fehler, setFehler] = useState('');

  useEffect(() => {
    setAusgaben(getAusgaben());
    setFixkosten(getFixkosten());
    setDesigns(getKategorieDesigns());
  }, []);

  const monat = aktuellerMonat();
  const dieserMonat = getAusgabenFuerMonat(monat);
  const gesamt = dieserMonat.reduce((s, a) => s + a.betrag, 0);
  const fixGesamt = fixkosten.filter(f => f.aktiv).reduce((s, f) => s + f.betrag, 0);
  const variabel = gesamt - dieserMonat.filter(a => a.ist_fixkosten).reduce((s, a) => s + a.betrag, 0);
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

  function renderKatIcon(kat: Kategorie) {
    const k = getKategorie(kat);
    const design = designs[kat];
    const hatCustomIcon = design?.customIcon;
    const hintergrund = design?.hintergrundFarbe;
    const istTransparent = hintergrund === 'transparent';

    let bg = k.farbe;
    let border = 'none';
    if (hintergrund && !istTransparent) bg = hintergrund;
    if (istTransparent) { bg = 'transparent'; border = `2px solid ${design?.randFarbe ?? k.farbe}`; }

    return (
      <button
        key={kat}
        className="schnell-btn"
        style={{ background: bg, border, boxSizing: 'border-box' }}
        onClick={() => oeffneModal(kat)}
        title={kat}
      >
        {hatCustomIcon
          ? <img src={design.customIcon} alt={kat} style={{ width: '60%', height: '60%', objectFit: 'contain' }} />
          : k.emoji
        }
      </button>
    );
  }

  const modalKat = modal ? getKategorie(modal) : null;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>{MONATSNAMEN[d.getMonth()]} {d.getFullYear()}</div>
          <h1 className="page-title">Übersicht</h1>
        </div>
        <button className="header-btn" onClick={() => navigate('/einstellungen')} title="Einstellungen">⚙️</button>
      </div>

      {/* Hero Karte */}
      <div className="hero-card">
        <div className="hero-label">Ausgaben diesen Monat</div>
        <div className="hero-betrag">{formatEuro(gesamt)}</div>
        <div className="hero-sub">{dieserMonat.length} Buchungen</div>
        <div className="hero-pills">
          <div className="hero-pill">🔒 Fix {formatEuro(fixGesamt)}</div>
          <div className="hero-pill">📊 Var. {formatEuro(variabel)}</div>
        </div>
      </div>

      {/* Schnell-Erfassung */}
      <Accordion titel="Schnell erfassen" defaultOffen={true}>
        <div className="schnell-grid">
          {getAlleKategorien().map(k => renderKatIcon(k.name))}
        </div>
      </Accordion>

      {/* Top Ausgaben */}
      <Accordion titel="Top Ausgaben" badge={topKats.length > 0 ? `${topKats.length}` : undefined} defaultOffen={true}>
        {topKats.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center', padding: '8px 0' }}>Noch keine Ausgaben</p>
        ) : (
          topKats.map(([name, betragVal]) => {
            const k = getKategorie(name as Kategorie);
            const prozent = gesamt > 0 ? (betragVal / gesamt) * 100 : 0;
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
      <Accordion titel="💡 Sparempfehlungen" badge={tipps.filter(t => t.prioritaet === 'hoch').length > 0 ? '!' : undefined} defaultOffen={true}>
        {tipps.slice(0, 3).map((tipp, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: tipp.prioritaet === 'hoch' ? '#FF3B3015' : tipp.prioritaet === 'mittel' ? '#FF950015' : '#34C75915',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>{tipp.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{tipp.titel}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.4 }}>{tipp.beschreibung}</div>
              {tipp.sparpotenzial && tipp.sparpotenzial > 0 && (
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 4 }}>
                  Einsparpotenzial: ~{formatEuro(tipp.sparpotenzial)}/Monat
                </div>
              )}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
              background: tipp.prioritaet === 'hoch' ? '#FF3B3015' : tipp.prioritaet === 'mittel' ? '#FF950015' : '#34C75915',
              color: tipp.prioritaet === 'hoch' ? '#FF3B30' : tipp.prioritaet === 'mittel' ? '#FF9500' : '#34C759',
            }}>
              {tipp.prioritaet === 'hoch' ? 'Hoch' : tipp.prioritaet === 'mittel' ? 'Mittel' : 'OK'}
            </div>
          </div>
        ))}
      </Accordion>

      {/* Letzte Buchungen */}
      <Accordion titel="Letzte Buchungen" badge={ausgaben.length > 0 ? `${ausgaben.length}` : undefined} defaultOffen={true}>
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
                  <div className="buchung-datum">{new Date(a.datum).toLocaleDateString('de-DE')} {a.ist_fixkosten && '· 🔒 Fix'}</div>
                </div>
                <span className="buchung-betrag">-{formatEuro(a.betrag)}</span>
              </div>
            );
          })
        )}
      </Accordion>

      {/* Schnell-Erfassung Modal */}
      {modal && modalKat && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-header">
              <span className="modal-title">{modalKat.emoji} {modal}</span>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            {/* Einmalig / Monatlich Toggle */}
            <div style={{ display: 'flex', background: '#E5E5EA', borderRadius: 12, padding: 3, marginBottom: 16 }}>
              {(['einmalig', 'monatlich'] as const).map(typ => (
                <button key={typ} onClick={() => setBuchungsTyp(typ)} style={{
                  flex: 1, padding: '8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: buchungsTyp === typ ? '#fff' : 'transparent',
                  color: buchungsTyp === typ ? 'var(--text)' : 'var(--text3)',
                  fontWeight: buchungsTyp === typ ? 700 : 500, fontSize: 14,
                  boxShadow: buchungsTyp === typ ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}>
                  {typ === 'einmalig' ? '⚡ Einmalig' : '🔄 Monatlich Fix'}
                </button>
              ))}
            </div>

            {buchungsTyp === 'monatlich' && (
              <div style={{ background: '#007AFF10', borderRadius: 12, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--accent2)' }}>
                💡 Wird als Fixkosten gespeichert und monatlich wiederholt
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <input
                className="betrag-input"
                type="number"
                inputMode="decimal"
                placeholder="0,00"
                value={betrag}
                onChange={e => { setBetrag(e.target.value); setFehler(''); }}
                autoFocus
              />
              {fehler && <p className="fehler">{fehler}</p>}
            </div>

            <label className="form-label">Beschreibung</label>
            <input className="form-input" type="text" placeholder={buchungsTyp === 'monatlich' ? 'z.B. Netflix' : 'z.B. Wocheneinkauf'} value={beschreibung} onChange={e => setBeschreibung(e.target.value)} />

            {buchungsTyp === 'monatlich' ? (
              <>
                <label className="form-label">Fällig am (Tag)</label>
                <input className="form-input" type="number" min="1" max="31" value={faelligAm} onChange={e => setFaelligAm(e.target.value)} />
              </>
            ) : (
              <>
                <label className="form-label">Datum</label>
                <input className="form-input" type="date" value={datum} onChange={e => setDatum(e.target.value)} />
              </>
            )}

            <button className="btn-primary" onClick={speichern}>Bestätigen</button>
          </div>
        </div>
      )}
    </div>
  );
}
