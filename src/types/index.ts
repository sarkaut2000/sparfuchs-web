export type Kategorie =
  | 'Miete' | 'Lebensmittel' | 'Transport' | 'Gesundheit'
  | 'Freizeit' | 'Kleidung' | 'Versicherung' | 'Kommunikation'
  | 'Bildung' | 'Restaurant' | 'Sonstiges';

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
