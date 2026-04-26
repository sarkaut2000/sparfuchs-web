import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { KATEGORIEN, getKategorie } from '../lib/kategorien';
import { getAlleDesigns, saveDesign, resetDesign, pngZuBase64, NAV_KEYS, APP_KEYS } from '../lib/icons';
import type { Kategorie } from '../types';

const FARBEN = ['#E74C3C','#2ECC71','#3498DB','#9B59B6','#F39C12','#1ABC9C','#E67E22','#34495E','#E91E63','#00BCD4','#8BC34A','#FF5722'];

const NAV_ITEMS = [
  { key: NAV_KEYS.home,        label: 'Übersicht',   emoji: '🏠' },
  { key: NAV_KEYS.verlauf,     label: 'Verlauf',     emoji: '📋' },
  { key: NAV_KEYS.fixkosten,   label: 'Fixkosten',   emoji: '🔄' },
  { key: NAV_KEYS.statistiken, label: 'Statistiken', emoji: '📊' },
];

const APP_ITEMS = [
  { key: APP_KEYS.app,         label: 'Sparfuchs',        emoji: '🐷', desc: 'Version 2.0' },
  { key: APP_KEYS.daten,       label: 'Datenspeicherung', emoji: '💾', desc: 'Lokal im Browser' },
  { key: APP_KEYS.datenschutz, label: 'Datenschutz',      emoji: '🔒', desc: 'Keine Daten gesendet' },
  { key: APP_KEYS.analyse,     label: 'Sparempfehlungen', emoji: '💡', desc: 'KI-Analyse 3 Monate' },
];

type EditTyp = 'kategorie' | 'nav' | 'app';

export default function Einstellungen() {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState(getAlleDesigns());
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editTyp, setEditTyp] = useState<EditTyp>('kategorie');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function aktualisieren() {
    const d = getAlleDesigns();
    setDesigns(d);
    window.dispatchEvent(new Event('sparfuchs_icons_update'));
  }

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editKey || !e.target.files?.[0]) return;
    const base64 = await pngZuBase64(e.target.files[0]);
    saveDesign(editKey, { customIcon: base64 });
    aktualisieren();
    e.target.value = '';
  }

  function handleFarbe(farbe: string) {
    if (!editKey) return;
    saveDesign(editKey, { hintergrundFarbe: farbe, randFarbe: farbe });
    aktualisieren();
  }

  function handleTransparent(randFarbe: string) {
    if (!editKey) return;
    saveDesign(editKey, { hintergrundFarbe: 'transparent', randFarbe });
    aktualisieren();
  }

  function handleReset() {
    if (!editKey) return;
    resetDesign(editKey);
    aktualisieren();
    setEditKey(null);
  }

  function removeIcon() {
    if (!editKey) return;
    const d = getAlleDesigns();
    if (d[editKey]) { delete d[editKey].customIcon; localStorage.setItem('sparfuchs_icons', JSON.stringify(d)); }
    aktualisieren();
  }

  function renderVorschau(schluessel: string, defaultEmoji: string, gross = false) {
    const design = designs[schluessel];
    const gr = gross ? 56 : 36;
    const br = gross ? 16 : 10;
    const fs = gross ? 26 : 18;
    let bg = '#E5E5EA';
    let border = 'none';
    if (design?.hintergrundFarbe === 'transparent') {
      bg = 'transparent'; border = `2px solid ${design?.randFarbe ?? '#ccc'}`;
    } else if (design?.hintergrundFarbe) { bg = design.hintergrundFarbe; }
    else if (editTyp === 'kategorie' && schluessel in Object.fromEntries(KATEGORIEN.map(k => [k.name, k]))) {
      bg = getKategorie(schluessel as Kategorie).farbe;
    }
    return (
      <div style={{ width: gr, height: gr, borderRadius: br, background: bg, border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fs, flexShrink: 0 }}>
        {design?.customIcon
          ? <img src={design.customIcon} alt="" style={{ width: '65%', height: '65%', objectFit: 'contain' }} />
          : defaultEmoji
        }
      </div>
    );
  }

  function renderKatVorschau(kat: Kategorie, gross = false) {
    const k = getKategorie(kat);
    const design = designs[kat];
    const gr = gross ? 56 : 36;
    const br = gross ? 16 : 10;
    const fs = gross ? 26 : 18;
    let bg = k.farbe;
    let border = 'none';
    if (design?.hintergrundFarbe === 'transparent') { bg = 'transparent'; border = `2px solid ${design?.randFarbe ?? k.farbe}`; }
    else if (design?.hintergrundFarbe) { bg = design.hintergrundFarbe; }
    return (
      <div style={{ width: gr, height: gr, borderRadius: br, background: bg, border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fs, flexShrink: 0 }}>
        {design?.customIcon ? <img src={design.customIcon} alt={kat} style={{ width: '65%', height: '65%', objectFit: 'contain' }} /> : k.emoji}
      </div>
    );
  }

  function IconEditor({ schluessel, defaultEmoji, label }: { schluessel: string; defaultEmoji: string; label: string }) {
    const design = designs[schluessel];
    return (
      <div style={{ background: '#F2F2F7', borderRadius: 16, padding: 16, margin: '8px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {editTyp === 'kategorie'
            ? renderKatVorschau(schluessel as Kategorie, true)
            : renderVorschau(schluessel, defaultEmoji, true)
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Vorschau · 512×512 px empfohlen</div>
          </div>
        </div>

        {/* Upload */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Eigenes Icon (PNG/JPG/SVG)</div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIconUpload} />
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 18px', borderRadius: 12, border: '1.5px dashed var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', color: 'var(--accent2)', fontWeight: 600 }}>
            📁 Icon hochladen
          </button>
          {design?.customIcon && (
            <button onClick={removeIcon} style={{ marginLeft: 8, padding: '10px 14px', borderRadius: 12, border: 'none', background: '#FF3B3015', cursor: 'pointer', fontSize: 14, color: 'var(--red)', fontFamily: 'inherit', fontWeight: 600 }}>Entfernen</button>
          )}
        </div>

        {/* Hintergrundfarbe (nur für Kategorie und Nav) */}
        {editTyp !== 'app' && (
          <>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Hintergrundfarbe</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FARBEN.map(f => (
                  <button key={f} onClick={() => handleFarbe(f)} style={{ width: 36, height: 36, borderRadius: 10, background: f, border: 'none', cursor: 'pointer', boxShadow: design?.hintergrundFarbe === f ? `0 0 0 3px #fff, 0 0 0 5px ${f}` : 'none', transition: 'box-shadow 0.15s' }} />
                ))}
                <label style={{ width: 36, height: 36, borderRadius: 10, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, overflow: 'hidden', position: 'relative' }}>
                  🎨
                  <input type="color" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} onChange={e => handleFarbe(e.target.value)} />
                </label>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>iOS 26 Transparent mit Rand</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {FARBEN.slice(0, 8).map(f => (
                  <button key={f} onClick={() => handleTransparent(f)} style={{ width: 36, height: 36, borderRadius: 10, background: 'transparent', border: `2.5px solid ${f}`, cursor: 'pointer', boxShadow: design?.hintergrundFarbe === 'transparent' && design?.randFarbe === f ? `0 0 0 3px #fff, 0 0 0 5px ${f}` : 'none', transition: 'box-shadow 0.15s' }} />
                ))}
              </div>
            </div>
          </>
        )}

        <button onClick={handleReset} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: '#FF3B3015', cursor: 'pointer', fontSize: 14, color: 'var(--red)', fontFamily: 'inherit', fontWeight: 600 }}>Auf Standard zurücksetzen</button>
      </div>
    );
  }

  function renderSection(key: string, defaultEmoji: string, label: string, typ: EditTyp, desc?: string) {
    const istOffen = editKey === key;
    return (
      <div key={key}>
        <div
          className="settings-row"
          style={{ cursor: 'pointer', background: istOffen ? 'rgba(0,122,255,0.07)' : undefined }}
          onClick={() => { setEditKey(istOffen ? null : key); setEditTyp(typ); }}
        >
          {typ === 'kategorie' ? renderKatVorschau(key as Kategorie) : renderVorschau(key, defaultEmoji)}
          <div className="settings-info">
            <div className="settings-label">{label}</div>
            {desc && <div className="settings-desc">{desc}</div>}
            <div className="settings-desc">{designs[key]?.customIcon ? '✓ Eigenes Icon' : 'Standard'}</div>
          </div>
          <span style={{ color: 'var(--text3)', fontSize: 14, transform: istOffen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
        </div>
        {istOffen && <IconEditor schluessel={key} defaultEmoji={defaultEmoji} label={label} />}
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="header-btn" onClick={() => navigate(-1)}>←</button>
        <h1 className="page-title">Einstellungen</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Kategorie Icons */}
      <div className="settings-section">
        <div className="settings-section-title">Kategorie Icons · <span style={{ fontWeight: 400, textTransform: 'none' }}>512×512 px PNG empfohlen</span></div>
        {KATEGORIEN.map(k => renderSection(k.name, k.emoji, k.name, 'kategorie'))}
      </div>

      {/* Navigation Icons */}
      <div className="settings-section">
        <div className="settings-section-title">Navigation Icons (unten)</div>
        {NAV_ITEMS.map(item => renderSection(item.key, item.emoji, item.label, 'nav'))}
      </div>

      {/* App Info Icons */}
      <div className="settings-section">
        <div className="settings-section-title">App Info Icons</div>
        {APP_ITEMS.map(item => renderSection(item.key, item.emoji, item.label, 'app', item.desc))}
      </div>
    </div>
  );
}
