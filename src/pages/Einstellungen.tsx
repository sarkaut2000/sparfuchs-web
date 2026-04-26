import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { KATEGORIEN, getKategorie } from '../lib/kategorien';
import { getKategorieDesigns, saveKategorieDesign, resetKategorieDesign, pngZuBase64 } from '../lib/icons';
import type { Kategorie } from '../types';

const FARBEN = ['#E74C3C','#2ECC71','#3498DB','#9B59B6','#F39C12','#1ABC9C','#E67E22','#34495E','#E91E63','#00BCD4','#8BC34A','#FF5722'];

export default function Einstellungen() {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState(getKategorieDesigns());
  const [editKat, setEditKat] = useState<Kategorie | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function aktualisiereDesigns() {
    setDesigns(getKategorieDesigns());
  }

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!editKat || !e.target.files?.[0]) return;
    const base64 = await pngZuBase64(e.target.files[0]);
    saveKategorieDesign(editKat, { customIcon: base64 });
    aktualisiereDesigns();
  }

  function handleFarbe(farbe: string) {
    if (!editKat) return;
    saveKategorieDesign(editKat, { hintergrundFarbe: farbe, randFarbe: farbe });
    aktualisiereDesigns();
  }

  function handleTransparent(randFarbe: string) {
    if (!editKat) return;
    saveKategorieDesign(editKat, { hintergrundFarbe: 'transparent', randFarbe });
    aktualisiereDesigns();
  }

  function handleReset() {
    if (!editKat) return;
    resetKategorieDesign(editKat);
    aktualisiereDesigns();
    setEditKat(null);
  }

  function renderKatVorschau(kat: Kategorie, gross = false) {
    const k = getKategorie(kat);
    const design = designs[kat];
    const gr = gross ? 56 : 36;
    const br = gross ? 16 : 10;
    const fs = gross ? 26 : 18;
    let bg = k.farbe;
    let border = 'none';
    if (design?.hintergrundFarbe === 'transparent') {
      bg = 'transparent';
      border = `2px solid ${design?.randFarbe ?? k.farbe}`;
    } else if (design?.hintergrundFarbe) {
      bg = design.hintergrundFarbe;
    }
    return (
      <div style={{ width: gr, height: gr, borderRadius: br, background: bg, border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fs, flexShrink: 0 }}>
        {design?.customIcon
          ? <img src={design.customIcon} alt={kat} style={{ width: '65%', height: '65%', objectFit: 'contain' }} />
          : k.emoji
        }
      </div>
    );
  }

  const editKatInfo = editKat ? getKategorie(editKat) : null;
  const editDesign = editKat ? designs[editKat] : null;

  return (
    <div className="page">
      <div className="page-header">
        <button className="header-btn" onClick={() => navigate(-1)}>←</button>
        <h1 className="page-title">Einstellungen</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Icon-Anpassung */}
      <div className="settings-section">
        <div className="settings-section-title">
          Icons anpassen
          <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8, textTransform: 'none', fontWeight: 400 }}>
            Empfohlene Größe: 512 × 512 px, PNG
          </span>
        </div>
        {KATEGORIEN.map((k) => (
          <div
            key={k.name}
            className="settings-row"
            style={{
              cursor: 'pointer',
              background: editKat === k.name ? 'rgba(0,122,255,0.07)' : undefined,
            }}
            onClick={() => setEditKat(editKat === k.name ? null : k.name)}
          >
            {renderKatVorschau(k.name)}
            <div className="settings-info">
              <div className="settings-label">{k.name}</div>
              <div className="settings-desc">
                {designs[k.name]?.customIcon ? '✓ Eigenes Icon' : 'Standard Emoji'}
                {designs[k.name]?.hintergrundFarbe === 'transparent' ? ' · Transparent' : ''}
              </div>
            </div>
            <span style={{ color: 'var(--text3)', fontSize: 14, transform: editKat === k.name ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>›</span>
          </div>
        ))}

        {/* Inline Editor */}
        {editKat && editKatInfo && (
          <div style={{ background: '#F2F2F7', borderRadius: 16, padding: 16, margin: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              {renderKatVorschau(editKat, true)}
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{editKat}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Vorschau</div>
              </div>
            </div>

            {/* Icon Upload */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Eigenes Icon (PNG)</div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" style={{ display: 'none' }} onChange={handleIconUpload} />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '10px 18px', borderRadius: 12, border: '1.5px dashed var(--border)', background: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', color: 'var(--accent2)', fontWeight: 600 }}
              >
                📁 Icon hochladen
              </button>
              {editDesign?.customIcon && (
                <button
                  onClick={() => { saveKategorieDesign(editKat, { customIcon: undefined }); aktualisiereDesigns(); }}
                  style={{ marginLeft: 8, padding: '10px 14px', borderRadius: 12, border: 'none', background: '#FF3B3015', cursor: 'pointer', fontSize: 14, color: 'var(--red)', fontFamily: 'inherit', fontWeight: 600 }}
                >
                  Entfernen
                </button>
              )}
            </div>

            {/* Hintergrundfarbe */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Hintergrundfarbe</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FARBEN.map(f => (
                  <button
                    key={f}
                    onClick={() => handleFarbe(f)}
                    style={{
                      width: 36, height: 36, borderRadius: 10, background: f, border: 'none', cursor: 'pointer',
                      boxShadow: editDesign?.hintergrundFarbe === f ? `0 0 0 3px #fff, 0 0 0 5px ${f}` : 'none',
                      transition: 'box-shadow 0.15s',
                    }}
                  />
                ))}
                {/* Custom color */}
                <label style={{ width: 36, height: 36, borderRadius: 10, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, overflow: 'hidden', position: 'relative' }}>
                  🎨
                  <input type="color" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} onChange={e => handleFarbe(e.target.value)} />
                </label>
              </div>
            </div>

            {/* Transparent Option */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>iOS 26 Glassmorphism (Transparent mit Rand)</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {FARBEN.slice(0, 6).map(f => (
                  <button
                    key={f}
                    onClick={() => handleTransparent(f)}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'transparent',
                      border: `2.5px solid ${f}`,
                      cursor: 'pointer',
                      boxShadow: editDesign?.hintergrundFarbe === 'transparent' && editDesign?.randFarbe === f
                        ? `0 0 0 3px #fff, 0 0 0 5px ${f}` : 'none',
                      transition: 'box-shadow 0.15s',
                    }}
                  />
                ))}
              </div>
            </div>

            <button onClick={handleReset} style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: '#FF3B3015', cursor: 'pointer', fontSize: 14, color: 'var(--red)', fontFamily: 'inherit', fontWeight: 600 }}>
              Auf Standard zurücksetzen
            </button>
          </div>
        )}
      </div>

      {/* Navigation Erklärung */}
      <div className="settings-section">
        <div className="settings-section-title">Navigation (Icons unten)</div>
        {[
          { emoji: '🏠', label: 'Übersicht', desc: 'Dashboard mit Monatsausgaben und Schnell-Erfassung' },
          { emoji: '📋', label: 'Verlauf', desc: 'Alle Buchungen — antippen zum Bearbeiten oder Löschen' },
          { emoji: '🔄', label: 'Fixkosten', desc: 'Monatlich wiederkehrende Ausgaben verwalten' },
          { emoji: '📊', label: 'Statistiken', desc: 'Charts und Vergleiche über mehrere Monate' },
        ].map((item, i, arr) => (
          <div className="settings-row" key={item.label} style={{
            borderRadius: i === 0 ? '14px 14px 0 0' : i === arr.length - 1 ? '0 0 14px 14px' : 0,
          }}>
            <div className="settings-icon" style={{ background: 'rgba(0,122,255,0.12)' }}>{item.emoji}</div>
            <div className="settings-info">
              <div className="settings-label">{item.label}</div>
              <div className="settings-desc">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* App Info */}
      <div className="settings-section">
        <div className="settings-section-title">App Info</div>
        {[
          { emoji: '🐷', label: 'Sparfuchs', desc: 'Version 2.0 · Persönliche Ausgaben-App', bg: 'rgba(52,199,89,0.15)' },
          { emoji: '💾', label: 'Datenspeicherung', desc: 'Daten lokal im Browser — kein Server', bg: 'rgba(255,149,0,0.15)' },
          { emoji: '🔒', label: 'Datenschutz', desc: 'Keine Daten werden gesendet', bg: 'rgba(175,82,222,0.15)' },
          { emoji: '💡', label: 'Sparempfehlungen', desc: 'KI-Analyse deiner letzten 3 Monate', bg: 'rgba(0,122,255,0.15)' },
        ].map((item, i, arr) => (
          <div className="settings-row" key={item.label} style={{
            borderRadius: i === 0 ? '14px 14px 0 0' : i === arr.length - 1 ? '0 0 14px 14px' : 0,
          }}>
            <div className="settings-icon" style={{ background: item.bg }}>{item.emoji}</div>
            <div className="settings-info">
              <div className="settings-label">{item.label}</div>
              <div className="settings-desc">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
