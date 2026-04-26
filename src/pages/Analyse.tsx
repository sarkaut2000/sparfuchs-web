import { useState, useEffect } from 'react';
import { getFixkosten, getAusgabenFuerMonat, summeNachKategorie, formatEuro } from '../lib/storage';
import { getKategorie } from '../lib/kategorien';
import { monatlicherBetrag } from '../types';
import type { Fixkosten } from '../types';
import Accordion from '../components/Accordion';

const MONATSNAMEN = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

function letzteMonateList(n: number): string[] {
  const result: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    result.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return result;
}

interface SparTipp {
  emoji: string;
  titel: string;
  beschreibung: string;
  sparpotenzial?: number;
  aktion: string;
  prioritaet: 'hoch' | 'mittel' | 'ok';
}

const RICHTWERTE: Record<string, { maxProzent: number; aktionen: string[] }> = {
  Restaurant:       { maxProzent: 10, aktionen: ['Meal-Prep: 1x pro Woche kochen für mehrere Tage', 'Max. 2x pro Woche auswärts essen', 'Mittagessen von zu Hause mitnehmen'] },
  Freizeit:         { maxProzent: 12, aktionen: ['Kostenlose Alternativen nutzen (Parks, Bibliothek)', 'Abos prüfen und unnötige kündigen', 'Gruppenrabatte bei Sport nutzen'] },
  Kleidung:         { maxProzent: 5,  aktionen: ['Saisonschlussverkäufe abwarten', 'Secondhand-Läden oder Vinted nutzen', 'Capsule Wardrobe: weniger aber besser'] },
  'Abos/Verträge':  { maxProzent: 5,  aktionen: ['Alle Abos auflisten und prüfen welche wirklich genutzt werden', 'Familien-/Gruppenabos teilen', 'Jährliche Zahlung spart oft 20%'] },
  Lebensmittel:     { maxProzent: 25, aktionen: ['Wocheneinkauf mit Liste planen', 'Eigenmarken statt Markenprodukte', 'Saisonales Gemüse kaufen'] },
  Transport:        { maxProzent: 15, aktionen: ['ÖPNV-Jahresticket prüfen', 'Fahrrad für kurze Strecken', 'Carsharing statt eigenes Auto'] },
  Mobiltelefon:     { maxProzent: 3,  aktionen: ['Handytarif vergleichen (z.B. Billiganbieter)', 'WLAN-Calling nutzen um Daten zu sparen', 'Alten Tarif regelmäßig neu verhandeln'] },
  Internet:         { maxProzent: 3,  aktionen: ['Tarif vergleichen und ggf. kündigen', 'Anbieter wechseln bei Vertragsende', 'Kombiangebote prüfen'] },
  Schuldentilgung:  { maxProzent: 20, aktionen: ['Höchstzinskredite zuerst tilgen (Avalanche-Methode)', 'Sondertilgungen bei Boni nutzen', 'Schuldenberatung in Anspruch nehmen'] },
};

export default function Analyse() {
  const [fixkosten, setFixkosten] = useState<Fixkosten[]>([]);

  useEffect(() => {
    setFixkosten(getFixkosten());
  }, []);

  const monate = letzteMonateList(6);
  const monatsGesamt = monate.map(m => getAusgabenFuerMonat(m).reduce((s, a) => s + a.betrag, 0));
  const maxMonat = Math.max(...monatsGesamt, 1);
  const durchschnitt = monatsGesamt.filter(v => v > 0).reduce((s, v) => s + v, 0) / Math.max(monatsGesamt.filter(v => v > 0).length, 1);

  // Letzten 3 Monate für Analyse
  const letzteMonateDaten = letzteMonateList(3).flatMap(m => getAusgabenFuerMonat(m));
  const gesamtL3 = letzteMonateDaten.reduce((s, a) => s + a.betrag, 0);
  const durchschnittMonat = gesamtL3 / 3;
  const nachKatL3 = summeNachKategorie(letzteMonateDaten);
  const nachKatMonat: Record<string, number> = {};
  for (const [kat, summe] of Object.entries(nachKatL3)) nachKatMonat[kat] = summe / 3;

  // Fixkosten monatlich
  const fixMonatlich = fixkosten.filter(f => f.aktiv).reduce((s, f) => s + monatlicherBetrag(f), 0);
  const variabelMonatlich = durchschnittMonat - (letzteMonateDaten.filter(a => a.ist_fixkosten).reduce((s, a) => s + a.betrag, 0) / 3);

  // Sparempfehlungen generieren
  const tipps: SparTipp[] = [];
  for (const [kat, avgMonat] of Object.entries(nachKatMonat)) {
    const prozent = durchschnittMonat > 0 ? (avgMonat / durchschnittMonat) * 100 : 0;
    const richtwert = RICHTWERTE[kat];
    if (richtwert && prozent > richtwert.maxProzent) {
      const sparpotenzial = avgMonat - (durchschnittMonat * richtwert.maxProzent / 100);
      tipps.push({
        emoji: getKategorie(kat).emoji,
        titel: `${kat} optimieren`,
        beschreibung: `Du gibst Ø ${formatEuro(avgMonat)}/Monat aus (${prozent.toFixed(0)}% deines Budgets). Richtwert: unter ${richtwert.maxProzent}%.`,
        sparpotenzial: Math.max(0, sparpotenzial),
        aktion: richtwert.aktionen[0],
        prioritaet: prozent > richtwert.maxProzent * 1.5 ? 'hoch' : 'mittel',
      });
    }
  }

  // Kleine Ausgaben-Tipp
  const kleineAusgaben = letzteMonateDaten.filter(a => a.betrag < 5);
  if (kleineAusgaben.length > 15) {
    const summe = kleineAusgaben.reduce((s, a) => s + a.betrag, 0) / 3;
    tipps.push({ emoji: '☕', titel: 'Kleine Beträge summieren sich', beschreibung: `${kleineAusgaben.length} Ausgaben unter 5€ in 3 Monaten = Ø ${formatEuro(summe)}/Monat.`, aktion: 'Täglich 1-2 kleine Käufe hinterfragen — das Latte-Faktor-Prinzip.', prioritaet: 'mittel' });
  }

  // Fixkosten-Tipp
  if (fixMonatlich > durchschnittMonat * 0.6) {
    tipps.push({ emoji: '🔒', titel: 'Hohe Fixkosten-Quote', beschreibung: `${((fixMonatlich / durchschnittMonat) * 100).toFixed(0)}% deines Budgets sind Fixkosten. Idealwert: unter 60%.`, aktion: 'Alle Verträge und Abos einmal jährlich auf Kündigung prüfen.', prioritaet: 'mittel' });
  }

  tipps.sort((a, b) => ({ hoch: 0, mittel: 1, ok: 2 }[a.prioritaet] - { hoch: 0, mittel: 1, ok: 2 }[b.prioritaet]));

  const gesamtSparpotenzial = tipps.reduce((s, t) => s + (t.sparpotenzial ?? 0), 0);

  const topKats = Object.entries(nachKatMonat).sort(([,a],[,b]) => b - a).slice(0, 8);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Analyse</h1>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>letzte 6 Monate</div>
      </div>

      {/* Zusammenfassung Hero */}
      <div className="hero-card" style={{ background: 'linear-gradient(135deg, #AF52DE, #5856D6)' }}>
        <div className="hero-label">Ø Ausgaben / Monat</div>
        <div className="hero-betrag">{formatEuro(durchschnitt)}</div>
        <div className="hero-sub">basierend auf {monate.filter((_, i) => monatsGesamt[i] > 0).length} Monaten mit Daten</div>
        <div className="hero-pills">
          <div className="hero-pill">🔒 Fix {formatEuro(fixMonatlich)}</div>
          <div className="hero-pill">📊 Var. {formatEuro(Math.max(0, variabelMonatlich))}</div>
          {gesamtSparpotenzial > 0 && <div className="hero-pill" style={{ background: 'rgba(52,199,89,0.3)' }}>💰 Sparpotenzial {formatEuro(gesamtSparpotenzial)}</div>}
        </div>
      </div>

      {/* 6-Monats Verlauf */}
      <Accordion titel="Ausgaben-Verlauf" defaultOffen={true}>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: 140, gap: 8, padding: '4px 0' }}>
          {monate.map((m, i) => {
            const wert = monatsGesamt[i];
            const hoehe = maxMonat > 0 ? (wert / maxMonat) * 100 : 0;
            const istAktuell = m === letzteMonateList(1)[0];
            const monIdx = parseInt(m.split('-')[1]) - 1;
            return (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 4 }}>{wert > 0 ? Math.round(wert) + '€' : ''}</div>
                <div style={{ flex: 1, width: '100%', background: 'rgba(0,0,0,0.05)', borderRadius: 8, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: `${Math.max(hoehe, 2)}%`, background: istAktuell ? 'var(--accent2)' : 'rgba(175,82,222,0.5)', borderRadius: 8, transition: 'height 0.5s' }} />
                </div>
                <div style={{ fontSize: 10, color: istAktuell ? 'var(--accent2)' : 'var(--text3)', fontWeight: istAktuell ? 700 : 400, marginTop: 4 }}>{MONATSNAMEN[monIdx]}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)' }}>
          <span>Ø {formatEuro(durchschnitt)}/Monat</span>
          <span>Trend: {monatsGesamt[5] > monatsGesamt[4] ? '📈 steigend' : monatsGesamt[5] < monatsGesamt[4] ? '📉 sinkend' : '➡️ stabil'}</span>
        </div>
      </Accordion>

      {/* Kategorie-Analyse */}
      <Accordion titel="Kategorie-Analyse" badge={`${topKats.length}`} defaultOffen={true}>
        {topKats.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 14, textAlign: 'center' }}>Noch zu wenig Daten</p>
        ) : (
          topKats.map(([kat, avg]) => {
            const k = getKategorie(kat);
            const prozent = durchschnittMonat > 0 ? (avg / durchschnittMonat) * 100 : 0;
            const istHoch = RICHTWERTE[kat] && prozent > RICHTWERTE[kat].maxProzent;
            return (
              <div key={kat} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {k.emoji} {kat}
                    {istHoch && <span style={{ fontSize: 10, background: '#FF3B3015', color: 'var(--red)', borderRadius: 6, padding: '1px 6px', fontWeight: 700 }}>Hoch</span>}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{formatEuro(avg)}/Mo.</span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3 }}>
                  <div style={{ height: 6, borderRadius: 3, background: istHoch ? 'var(--red)' : k.farbe, width: `${Math.min(prozent, 100)}%`, transition: 'width 0.5s' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                  {prozent.toFixed(1)}% des Budgets
                  {RICHTWERTE[kat] && ` · Richtwert: max. ${RICHTWERTE[kat].maxProzent}%`}
                </div>
              </div>
            );
          })
        )}
      </Accordion>

      {/* Sparempfehlungen */}
      <Accordion titel="💡 Sparempfehlungen" badge={tipps.length > 0 ? `${tipps.length}` : undefined} defaultOffen={true}>
        {tipps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌟</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Ausgezeichnet!</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Deine Ausgaben sind in allen Kategorien im grünen Bereich.</div>
          </div>
        ) : (
          tipps.map((t, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: i < tipps.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: t.prioritaet === 'hoch' ? '#FF3B3015' : '#FF950015',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>{t.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{t.titel}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 8, background: t.prioritaet === 'hoch' ? '#FF3B3015' : '#FF950015', color: t.prioritaet === 'hoch' ? 'var(--red)' : 'var(--orange)' }}>
                      {t.prioritaet === 'hoch' ? '⚠️ Hoch' : '💡 Mittel'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 8 }}>{t.beschreibung}</div>
                  <div style={{ background: 'rgba(0,122,255,0.07)', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent2)' }}>💡 Tipp: </span>
                    <span style={{ color: 'var(--text2)' }}>{t.aktion}</span>
                  </div>
                  {t.sparpotenzial && t.sparpotenzial > 5 && (
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>
                      💰 Einsparpotenzial: ~{formatEuro(t.sparpotenzial)}/Monat · {formatEuro(t.sparpotenzial * 12)}/Jahr
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </Accordion>

      {/* Fixkosten-Übersicht */}
      <Accordion titel="🔒 Fixkosten-Analyse" defaultOffen={false}>
        {fixkosten.filter(f => f.aktiv).length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Keine Fixkosten erfasst</p>
        ) : (
          <>
            {fixkosten.filter(f => f.aktiv).sort((a, b) => monatlicherBetrag(b) - monatlicherBetrag(a)).map(f => {
              const k = getKategorie(f.kategorie);
              const anteil = fixMonatlich > 0 ? (monatlicherBetrag(f) / fixMonatlich) * 100 : 0;
              return (
                <div key={f.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 14 }}>{k.emoji} {f.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{formatEuro(monatlicherBetrag(f))}/Mo.</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 3 }}>
                    <div style={{ height: 5, borderRadius: 3, background: k.farbe, width: `${Math.min(anteil, 100)}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{anteil.toFixed(1)}% der Fixkosten · {formatEuro(monatlicherBetrag(f) * 12)}/Jahr</div>
                </div>
              );
            })}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Gesamt monatlich</span>
              <span>{formatEuro(fixMonatlich)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>
              <span>Gesamt jährlich</span>
              <span>{formatEuro(fixMonatlich * 12)}</span>
            </div>
          </>
        )}
      </Accordion>
    </div>
  );
}
