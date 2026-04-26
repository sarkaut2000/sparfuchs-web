import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  STANDARD_KATEGORIEN, getAlleKategorien, getKategorie,
  getCustomKategorien, addCustomKategorie, deleteCustomKategorie, zufaelligeFarbe
} from '../lib/kategorien';
import { getAlleDesigns, saveDesign, resetDesign, pngZuBase64, NAV_KEYS, APP_KEYS } from '../lib/icons';
import type { KategorieDefinition } from '../types';

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

const EMOJI_VORSCHLAEGE = ['🏠','🛒','⚡','🚗','💊','🎮','💃','👕','🛡️','🌐','📱','📚','🍽️','📄','💳','📦','🎵','🐶','🌿','✈️','🏋️','🎨','📷','🎸','🍕','☕','🎁','🌍','💰','🏦'];

export default function Einstellungen() {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState(getAlleDesigns());
  const [kategorien, setKategorien] = useState<KategorieDefinition[]>(getAlleKategorien());
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editTyp, setEditTyp] = useState<EditTyp>('kategorie');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Neue Kategorie State
  const [neuerName, setNeuerName] = useState('');
  const [neuesEmoji, setNeuesEmoji] = useState('📦');
  const [neueFarbe, setNeueFarbe] = useState('#3498DB');
  const [neuKatFehler, setNeuKatFehler] = useState('');
  const [addKatOffen, setAddKatOffen] = useState(false);

  function aktualisieren() {
    setDesigns(getAlleDesigns());
    setKategorien(getAlleKategorien());
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
    if (d[editKey]) {
      delete d[editKey].customIcon;
      localStorage.setItem('sparfuchs_icons', JSON.stringify(d));
    }
    aktualisieren();
  }

  function katHinzufuegen() {
    if (!neuerName.trim()) { setNeuKatFehler('Bitte einen Namen eingeben'); return; }
    if (kategorien.some(k => k.name.toLowerCase() === neuerName.trim().toLowerCase())) {
      setNeuKatFehler('Diese Kategorie existiert bereits'); return;
    }
    addCustomKategorie({ name: neuerName.trim(), emoji: neuesEmoji, farbe: neueFarbe });
    setKategorien(getAlleKategorien());
    setNeuerName(''); setNeuesEmoji('📦'); setNeueFarbe(zufaelligeFarbe());
    setNeuKatFehler(''); setAddKatOffen(false);
  }

  function katLoeschen(name: string) {
    if (confirm(`Kategorie "${name}" wirklich löschen?`)) {
      deleteCustomKategorie(name);
      setKategorien(getAlleKategorien());
    }
  }

  function renderVorschau(schluessel: string, defaultEmoji: string, gross = false, istKat = false) {
    const design = designs[schluessel];
    const gr = gross ? 56 : 36;
    const br = gross ? 16 : 10;
    const fs = gross ? 26 : 18;
    let bg = '#E5E5EA';
    let border = 'none';
    if (istKat) { bg = getKategorie(schluessel).farbe; }
    if (design?.hintergrundFarbe === 'transparent') { bg = 'transparent'; border = `2px solid ${design?.randFarbe ?? '#ccc'}`; }
    else if (design?.hintergrundFarbe) { bg = design.hintergrundFarbe; }
    return (
      <div style={{ width: gr, height: gr, borderRadius: br, background: bg, border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fs, flexShrink: 0 }}>
        {design?.customIcon
          ? <img src={design.customIcon} alt="" style={{ width: '65%', height: '65%', objectFit: 'contain' }} />
          : defaultEmoji}
      </div>
    );
  }

  function IconEditor({ schluessel, defaultEmoji, label, istKat = false }: { schluessel: string; defaultEmoji: string; label: string; istKat?: boolean }) {
    const design = designs[schluessel];
    return (
      <div style={{ background: '#F2F2F7', borderRadius: 16, padding: 16, margin: '6px 0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {renderVorschau(schluessel, defaultEmoji, true, istKat)}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>512 × 512 px PNG empfohlen</div>
          </div>
        </div>

        {/* Upload */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Eigenes Icon hochladen</div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIconUpload} />
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '10px 18px', borderRadius: 12, border: '1.5px dashed var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', color: 'var(--accent2)', fontWeight: 600 }}>
            📁 Icon hochladen
          </button>
          {design?.customIcon && (
            <button onClick={removeIcon} style={{ marginLeft: 8, padding: '10px 14px', borderRadius: 12, border: 'none', background: '#FF3B3015', cursor: 'pointer', fontSize: 14, color: 'var(--red)', fontFamily: 'inherit', fontWeight: 600 }}>Entfernen</button>
          )}
        </div>

        {/* Hintergrundfarbe */}
        {(istKat || editTyp === 'nav') && (
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
                <label style={{ width: 36, height: 36, borderRadius: 10, border: '2px dashed var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, overflow: 'hidden', position: 'relative' }}>
                  🎨
                  <input type="color" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} onChange={e => handleTransparent(e.target.value)} />
                </label>
              </div>
            </div>
          </>
        )}
        <button onClick={handleReset} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: '#FF3B3015', cursor: 'pointer', fontSize: 14, color: 'var(--red)', fontFamily: 'inherit', fontWeight: 600 }}>Auf Standard zurücksetzen</button>
      </div>
    );
  }

  function renderKatZeile(k: KategorieDefinition) {
    const istOffen = editKey === k.name;
    const istCustom = !k.istStandard;
    return (
      <div key={k.name}>
        <div
          className="settings-row"
          style={{ cursor: 'pointer', background: istOffen ? 'rgba(0,122,255,0.07)' : undefined }}
          onClick={() => { setEditKey(istOffen ? null : k.name); setEditTyp('kategorie'); }}
        >
          {renderVorschau(k.name, k.emoji, false, true)}
          <div className="settings-info">
            <div className="settings-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {k.name}
              {istCustom && <span style={{ fontSize: 10, background: 'var(--accent2)', color: '#fff', borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>Eigene</span>}
            </div>
            <div className="settings-desc">{designs[k.name]?.customIcon ? '✓ Eigenes Icon' : 'Standard'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {istCustom && (
              <button
                onClick={e => { e.stopPropagation(); katLoeschen(k.name); }}
                style={{ background: '#FF3B3015', border: 'none', borderRadius: 8, padding: '4px 8px', color: 'var(--red)', cursor: 'pointer', fontSize: 14 }}
              >🗑</button>
            )}
            <span style={{ color: 'var(--text3)', fontSize: 14, transform: istOffen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
          </div>
        </div>
        {istOffen && <IconEditor schluessel={k.name} defaultEmoji={k.emoji} label={k.name} istKat={true} />}
      </div>
    );
  }

  function renderSystemZeile(key: string, emoji: string, label: string, typ: EditTyp, desc?: string) {
    const istOffen = editKey === key;
    return (
      <div key={key}>
        <div
          className="settings-row"
          style={{ cursor: 'pointer', background: istOffen ? 'rgba(0,122,255,0.07)' : undefined }}
          onClick={() => { setEditKey(istOffen ? null : key); setEditTyp(typ); }}
        >
          {renderVorschau(key, emoji)}
          <div className="settings-info">
            <div className="settings-label">{label}</div>
            {desc && <div className="settings-desc">{desc}</div>}
            <div className="settings-desc">{designs[key]?.customIcon ? '✓ Eigenes Icon' : 'Standard'}</div>
          </div>
          <span style={{ color: 'var(--text3)', fontSize: 14, transform: istOffen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
        </div>
        {istOffen && <IconEditor schluessel={key} defaultEmoji={emoji} label={label} />}
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

      {/* ── Kategorien verwalten ── */}
      <div className="settings-section">
        <div className="settings-section-title">Kategorien verwalten</div>

        {/* Standard Kategorien */}
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, paddingLeft: 4 }}>Standard ({STANDARD_KATEGORIEN.length})</div>
        {STANDARD_KATEGORIEN.map(k => renderKatZeile(k))}

        {/* Eigene Kategorien */}
        {getCustomKategorien().length > 0 && (
          <>
            <div style={{ fontSize: 12, color: 'var(--text3)', margin: '16px 0 8px', paddingLeft: 4 }}>Eigene ({getCustomKategorien().length})</div>
            {getCustomKategorien().map(k => renderKatZeile(k))}
          </>
        )}

        {/* Neue Kategorie hinzufügen */}
        <button
          onClick={() => setAddKatOffen(!addKatOffen)}
          style={{
            width: '100%', marginTop: 12, padding: '13px', borderRadius: 14,
            border: '1.5px dashed var(--accent2)', background: addKatOffen ? 'rgba(0,122,255,0.07)' : '#fff',
            color: 'var(--accent2)', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
          }}
        >
          {addKatOffen ? '✕ Abbrechen' : '+ Neue Kategorie hinzufügen'}
        </button>

        {addKatOffen && (
          <div style={{ background: '#F2F2F7', borderRadius: 16, padding: 16, marginTop: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Neue Kategorie</div>

            <label className="form-label">Name</label>
            <input
              className="form-input"
              placeholder="z.B. Haustier"
              value={neuerName}
              onChange={e => { setNeuerName(e.target.value); setNeuKatFehler(''); }}
            />
            {neuKatFehler && <p className="fehler">{neuKatFehler}</p>}

            <label className="form-label">Emoji Icon</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {EMOJI_VORSCHLAEGE.map(e => (
                <button
                  key={e}
                  onClick={() => setNeuesEmoji(e)}
                  style={{
                    width: 40, height: 40, borderRadius: 10, border: 'none',
                    background: neuesEmoji === e ? 'var(--accent2)' : '#fff',
                    fontSize: 20, cursor: 'pointer',
                    boxShadow: neuesEmoji === e ? `0 0 0 2px var(--accent2)` : 'none',
                  }}
                >{e}</button>
              ))}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>Oder eigenes Emoji eingeben:</div>
            <input className="form-input" style={{ fontSize: 22, textAlign: 'center', maxWidth: 80 }} value={neuesEmoji} onChange={e => setNeuesEmoji(e.target.value)} maxLength={2} />

            <label className="form-label">Farbe</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {FARBEN.map(f => (
                <button key={f} onClick={() => setNeueFarbe(f)} style={{ width: 36, height: 36, borderRadius: 10, background: f, border: 'none', cursor: 'pointer', boxShadow: neueFarbe === f ? `0 0 0 3px #fff, 0 0 0 5px ${f}` : 'none' }} />
              ))}
              <label style={{ width: 36, height: 36, borderRadius: 10, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, overflow: 'hidden', position: 'relative' }}>
                🎨
                <input type="color" value={neueFarbe} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} onChange={e => setNeueFarbe(e.target.value)} />
              </label>
            </div>

            {/* Vorschau */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0', padding: '12px', background: '#fff', borderRadius: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: neueFarbe, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{neuesEmoji}</div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{neuerName || 'Vorschau'}</div>
            </div>

            <button className="btn-primary" onClick={katHinzufuegen} style={{ marginTop: 4 }}>
              + Kategorie hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* ── Navigation Icons ── */}
      <div className="settings-section">
        <div className="settings-section-title">Navigation Icons (unten)</div>
        {NAV_ITEMS.map(item => renderSystemZeile(item.key, item.emoji, item.label, 'nav'))}
      </div>

      {/* ── App Info Icons ── */}
      <div className="settings-section">
        <div className="settings-section-title">App Info Icons</div>
        {APP_ITEMS.map(item => renderSystemZeile(item.key, item.emoji, item.label, 'app', item.desc))}
      </div>
    </div>
  );
}
