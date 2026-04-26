import { getAusgabenFuerMonat } from './storage';
import type { Kategorie } from '../types';

export interface SparTipp {
  emoji: string;
  titel: string;
  beschreibung: string;
  sparpotenzial?: number;
  prioritaet: 'hoch' | 'mittel' | 'niedrig';
}

function letzteMonateList(n: number): string[] {
  const result: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    result.unshift(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return result;
}

export function analysiereSparPotenzial(): SparTipp[] {
  const tipps: SparTipp[] = [];
  const monate = letzteMonateList(3);

  // Durchschnittliche Ausgaben der letzten 3 Monate
  const monatsAusgaben = monate.map(m => getAusgabenFuerMonat(m));
  const alleAusgaben = monatsAusgaben.flat();

  if (alleAusgaben.length < 2) {
    return [{
      emoji: '📊',
      titel: 'Noch zu wenig Daten',
      beschreibung: 'Erfasse mindestens 2 Wochen Ausgaben, damit ich dir gute Sparempfehlungen geben kann.',
      prioritaet: 'niedrig',
    }];
  }

  const gesamtDurchschnitt = alleAusgaben.reduce((s, a) => s + a.betrag, 0) / Math.max(monate.length, 1);
  const nachKatGesamt: Record<string, number> = {};
  for (const ausgabe of alleAusgaben) {
    nachKatGesamt[ausgabe.kategorie] = (nachKatGesamt[ausgabe.kategorie] ?? 0) + ausgabe.betrag;
  }

  const nachKatDurchschnitt: Record<string, number> = {};
  for (const [kat, summe] of Object.entries(nachKatGesamt)) {
    nachKatDurchschnitt[kat] = summe / Math.max(monate.length, 1);
  }

  // Empfehlungen basierend auf Richtwerten
  const RICHTWERTE: Partial<Record<Kategorie, { maxProzent: number; tipp: string }>> = {
    Restaurant:    { maxProzent: 10, tipp: 'Kochen zu Hause spart oft 60-70% gegenüber Restaurants.' },
    Freizeit:      { maxProzent: 12, tipp: 'Günstige Alternativen wie Parks, Bibliotheken oder Streaming sparen viel.' },
    Kleidung:      { maxProzent: 5,  tipp: 'Secondhand-Läden oder Saisonschlussverkäufe nutzen.' },
    Kommunikation: { maxProzent: 5,  tipp: 'Handytarif vergleichen — oft 30-50% günstiger möglich.' },
    Transport:     { maxProzent: 15, tipp: 'ÖPNV, Fahrrad oder Carsharing statt eigenem Auto.' },
    Lebensmittel:  { maxProzent: 25, tipp: 'Wocheneinkauf planen und Eigenmarken wählen.' },
  };

  for (const [kat, avgMonat] of Object.entries(nachKatDurchschnitt)) {
    const prozent = gesamtDurchschnitt > 0 ? (avgMonat / gesamtDurchschnitt) * 100 : 0;
    const richtwert = RICHTWERTE[kat as Kategorie];
    if (richtwert && prozent > richtwert.maxProzent) {
      const ueberRichtwert = avgMonat - (gesamtDurchschnitt * richtwert.maxProzent / 100);
      tipps.push({
        emoji: getKatEmoji(kat as Kategorie),
        titel: `${kat} reduzieren`,
        beschreibung: `Du gibst ${prozent.toFixed(0)}% deines Budgets für ${kat} aus (Richtwert: ${richtwert.maxProzent}%). ${richtwert.tipp}`,
        sparpotenzial: Math.max(0, ueberRichtwert),
        prioritaet: prozent > richtwert.maxProzent * 1.5 ? 'hoch' : 'mittel',
      });
    }
  }

  // Häufige kleine Ausgaben
  const kleineAusgaben = alleAusgaben.filter(a => a.betrag < 10);
  if (kleineAusgaben.length > 10) {
    const summeKlein = kleineAusgaben.reduce((s, a) => s + a.betrag, 0);
    tipps.push({
      emoji: '☕',
      titel: 'Kleine Ausgaben summieren sich',
      beschreibung: `Du hast ${kleineAusgaben.length} Ausgaben unter 10€ — zusammen ${summeKlein.toFixed(2).replace('.', ',')}€. Bewusstes Kaufen kann hier viel sparen.`,
      prioritaet: 'mittel',
    });
  }

  // Positives Feedback
  if (tipps.length === 0) {
    tipps.push({
      emoji: '🌟',
      titel: 'Sehr gut!',
      beschreibung: 'Deine Ausgaben sind in allen Kategorien im grünen Bereich. Weiter so!',
      prioritaet: 'niedrig',
    });
  }

  return tipps.sort((a, b) => {
    const reihenfolge = { hoch: 0, mittel: 1, niedrig: 2 };
    return reihenfolge[a.prioritaet] - reihenfolge[b.prioritaet];
  });
}

function getKatEmoji(kat: Kategorie): string {
  const map: Partial<Record<Kategorie, string>> = {
    Restaurant: '🍽️', Freizeit: '🎮', Kleidung: '👕',
    Kommunikation: '📱', Transport: '🚗', Lebensmittel: '🛒',
    Miete: '🏠', Gesundheit: '💊', Versicherung: '🛡️',
    Bildung: '📚', Sonstiges: '📦',
  };
  return map[kat] ?? '📦';
}
