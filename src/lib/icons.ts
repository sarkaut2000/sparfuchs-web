import type { Kategorie } from '../types';

export interface KategorieDesign {
  customIcon?: string; // base64 PNG
  hintergrundFarbe?: string; // hex color oder 'transparent'
  randFarbe?: string; // hex color für transparent-Modus
}

const ICONS_KEY = 'sparfuchs_icons';

export function getKategorieDesigns(): Record<string, KategorieDesign> {
  const raw = localStorage.getItem(ICONS_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function saveKategorieDesign(kategorie: Kategorie, design: KategorieDesign) {
  const alle = getKategorieDesigns();
  alle[kategorie] = { ...alle[kategorie], ...design };
  localStorage.setItem(ICONS_KEY, JSON.stringify(alle));
}

export function resetKategorieDesign(kategorie: Kategorie) {
  const alle = getKategorieDesigns();
  delete alle[kategorie];
  localStorage.setItem(ICONS_KEY, JSON.stringify(alle));
}

export function pngZuBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
