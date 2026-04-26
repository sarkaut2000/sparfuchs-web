import type { Ausgabe, Fixkosten } from '../types';

const AUSGABEN_KEY = 'sparfuchs_ausgaben';
const FIXKOSTEN_KEY = 'sparfuchs_fixkosten';

export function getAusgaben(): Ausgabe[] {
  const raw = localStorage.getItem(AUSGABEN_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveAusgabe(data: Omit<Ausgabe, 'id' | 'created_at'>): Ausgabe {
  const alle = getAusgaben();
  const neu: Ausgabe = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() };
  localStorage.setItem(AUSGABEN_KEY, JSON.stringify([neu, ...alle]));
  return neu;
}

export function deleteAusgabe(id: string): void {
  localStorage.setItem(AUSGABEN_KEY, JSON.stringify(getAusgaben().filter((a) => a.id !== id)));
}

export function updateAusgabe(id: string, updates: Partial<Ausgabe>): void {
  const aktualisiert = getAusgaben().map((a) => (a.id === id ? { ...a, ...updates } : a));
  localStorage.setItem(AUSGABEN_KEY, JSON.stringify(aktualisiert));
}

export function getFixkosten(): Fixkosten[] {
  const raw = localStorage.getItem(FIXKOSTEN_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveFixkosten(data: Omit<Fixkosten, 'id'>): Fixkosten {
  const alle = getFixkosten();
  const neu: Fixkosten = { ...data, id: Date.now().toString() };
  localStorage.setItem(FIXKOSTEN_KEY, JSON.stringify([...alle, neu]));
  return neu;
}

export function updateFixkosten(id: string, updates: Partial<Fixkosten>): void {
  const aktualisiert = getFixkosten().map((f) => (f.id === id ? { ...f, ...updates } : f));
  localStorage.setItem(FIXKOSTEN_KEY, JSON.stringify(aktualisiert));
}

export function deleteFixkosten(id: string): void {
  localStorage.setItem(FIXKOSTEN_KEY, JSON.stringify(getFixkosten().filter((f) => f.id !== id)));
}

export function getAusgabenFuerMonat(monat: string): Ausgabe[] {
  return getAusgaben().filter((a) => a.datum.startsWith(monat));
}

export function summeNachKategorie(ausgaben: Ausgabe[]): Record<string, number> {
  return ausgaben.reduce<Record<string, number>>((acc, a) => {
    acc[a.kategorie] = (acc[a.kategorie] ?? 0) + a.betrag;
    return acc;
  }, {});
}

export function formatEuro(betrag: number): string {
  return betrag.toFixed(2).replace('.', ',') + ' €';
}

export function aktuellerMonat(): string {
  return new Date().toISOString().slice(0, 7);
}
