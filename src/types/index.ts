// Kategorie ist jetzt ein offener string-Typ damit benutzerdefinierte Kategorien möglich sind
export type Kategorie = string;

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
}
