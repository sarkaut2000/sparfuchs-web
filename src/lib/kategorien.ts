import type { KategorieDefinition } from '../types';

const CUSTOM_KEY = 'sparfuchs_kategorien';

export const STANDARD_KATEGORIEN: KategorieDefinition[] = [
  { name: 'Miete',             farbe: '#E74C3C', emoji: '🏠', istStandard: true },
  { name: 'Lebensmittel',      farbe: '#2ECC71', emoji: '🛒', istStandard: true },
  { name: 'Stadtwerke',        farbe: '#F39C12', emoji: '⚡', istStandard: true },
  { name: 'Mobilität',         farbe: '#3498DB', emoji: '🚗', istStandard: true },
  { name: 'Gesundheit',        farbe: '#1ABC9C', emoji: '💊', istStandard: true },
  { name: 'Freizeit',          farbe: '#9B59B6', emoji: '🎮', istStandard: true },
  { name: 'Tango',             farbe: '#E91E63', emoji: '💃', istStandard: true },
  { name: 'Kleidung',          farbe: '#FF9800', emoji: '👕', istStandard: true },
  { name: 'Versicherung',      farbe: '#34495E', emoji: '🛡️', istStandard: true },
  { name: 'Internet',          farbe: '#00BCD4', emoji: '🌐', istStandard: true },
  { name: 'Mobiltelefon',      farbe: '#16A085', emoji: '📱', istStandard: true },
  { name: 'Bildung',           farbe: '#8E44AD', emoji: '📚', istStandard: true },
  { name: 'Restaurant',        farbe: '#E67E22', emoji: '🍽️', istStandard: true },
  { name: 'Abos/Verträge',     farbe: '#607D8B', emoji: '📄', istStandard: true },
  { name: 'Schuldentilgung',   farbe: '#C0392B', emoji: '💳', istStandard: true },
  { name: 'Sonstiges',         farbe: '#95A5A6', emoji: '📦', istStandard: true },
];

export function getCustomKategorien(): KategorieDefinition[] {
  const raw = localStorage.getItem(CUSTOM_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getAlleKategorien(): KategorieDefinition[] {
  const alle = [...STANDARD_KATEGORIEN, ...getCustomKategorien()];
  const reihenfolge = (() => {
    const raw = localStorage.getItem('sparfuchs_kat_order');
    return raw ? (JSON.parse(raw) as string[]) : [];
  })();
  if (reihenfolge.length === 0) return alle;
  const map = new Map(alle.map(k => [k.name, k]));
  const sortiert = reihenfolge.map(n => map.get(n)).filter(Boolean) as KategorieDefinition[];
  const restliche = alle.filter(k => !reihenfolge.includes(k.name));
  return [...sortiert, ...restliche];
}

// Alias für bestehenden Code
export const KATEGORIEN = STANDARD_KATEGORIEN;

export function getKategorie(name: string): KategorieDefinition {
  return getAlleKategorien().find(k => k.name === name) ?? STANDARD_KATEGORIEN[STANDARD_KATEGORIEN.length - 1];
}

export function addCustomKategorie(def: Omit<KategorieDefinition, 'istStandard'>): void {
  const alle = getCustomKategorien();
  if (getAlleKategorien().some(k => k.name.toLowerCase() === def.name.toLowerCase())) return;
  alle.push({ ...def, istStandard: false });
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(alle));
}

export function deleteCustomKategorie(name: string): void {
  const gefiltert = getCustomKategorien().filter(k => k.name !== name);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(gefiltert));
}

// Zufällige Farbe für neue Kategorien
const EXTRA_FARBEN = ['#FF5722','#795548','#9C27B0','#4CAF50','#2196F3','#FF4081','#00E5FF','#76FF03'];
export function zufaelligeFarbe(): string {
  return EXTRA_FARBEN[Math.floor(Math.random() * EXTRA_FARBEN.length)];
}
