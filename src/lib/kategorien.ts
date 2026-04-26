import type { Kategorie } from '../types';

export const KATEGORIEN: { name: Kategorie; farbe: string; emoji: string }[] = [
  { name: 'Miete',         farbe: '#E74C3C', emoji: '🏠' },
  { name: 'Lebensmittel',  farbe: '#2ECC71', emoji: '🛒' },
  { name: 'Transport',     farbe: '#3498DB', emoji: '🚗' },
  { name: 'Gesundheit',    farbe: '#1ABC9C', emoji: '💊' },
  { name: 'Freizeit',      farbe: '#9B59B6', emoji: '🎮' },
  { name: 'Kleidung',      farbe: '#F39C12', emoji: '👕' },
  { name: 'Versicherung',  farbe: '#34495E', emoji: '🛡️' },
  { name: 'Kommunikation', farbe: '#16A085', emoji: '📱' },
  { name: 'Bildung',       farbe: '#8E44AD', emoji: '📚' },
  { name: 'Restaurant',    farbe: '#E67E22', emoji: '🍽️' },
  { name: 'Sonstiges',     farbe: '#95A5A6', emoji: '📦' },
];

export function getKategorie(name: Kategorie) {
  return KATEGORIEN.find((k) => k.name === name) ?? KATEGORIEN[KATEGORIEN.length - 1];
}
