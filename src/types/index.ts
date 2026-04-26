export type Kategorie = string;

export type Zahlungsrhythmus = 'monatlich' | 'vierteljaehrlich' | 'halbjaehrlich' | 'jaehrlich';

export interface KategorieDefinition {
  name: string;
  farbe: string;
  emoji: string;
  istStandard?: boolean;
}

export interface Ausgabe {
  id: string;
  betrag: number;
  kategorie: Kategorie;
  beschreibung: string;
  datum: string;
  ist_fixkosten: boolean;
  created_at: string;
}

export interface Fixkosten {
  id: string;
  name: string;
  betrag: number;
  kategorie: Kategorie;
  faellig_am: number;
  aktiv: boolean;
  rhythmus?: Zahlungsrhythmus; // Standard: monatlich
}

// Monatlicher Äquivalentwert einer Fixkosten-Position
export function monatlicherBetrag(f: Fixkosten): number {
  switch (f.rhythmus) {
    case 'vierteljaehrlich': return f.betrag / 3;
    case 'halbjaehrlich':    return f.betrag / 6;
    case 'jaehrlich':        return f.betrag / 12;
    default:                 return f.betrag;
  }
}

export const RHYTHMUS_LABEL: Record<Zahlungsrhythmus, string> = {
  monatlich:        '📅 Monatlich',
  vierteljaehrlich: '📅 Vierteljährlich',
  halbjaehrlich:    '📅 Halbjährlich',
  jaehrlich:        '📅 Jährlich',
};
