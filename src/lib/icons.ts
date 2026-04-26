// Unterstützt Kategorie-Icons UND System-Icons (Navigation, App-Info)
export interface IconDesign {
  customIcon?: string; // base64
  hintergrundFarbe?: string; // hex oder 'transparent'
  randFarbe?: string;
}

const ICONS_KEY = 'sparfuchs_icons';

export function getAlleDesigns(): Record<string, IconDesign> {
  const raw = localStorage.getItem(ICONS_KEY);
  return raw ? JSON.parse(raw) : {};
}

// Alias für Kompatibilität
export function getKategorieDesigns() { return getAlleDesigns(); }

export function saveDesign(schluessel: string, design: Partial<IconDesign>) {
  const alle = getAlleDesigns();
  alle[schluessel] = { ...alle[schluessel], ...design };
  // undefined-Felder entfernen
  if (design.customIcon === undefined && 'customIcon' in design) delete alle[schluessel].customIcon;
  localStorage.setItem(ICONS_KEY, JSON.stringify(alle));
}

// Alias für Kompatibilität
export function saveKategorieDesign(schluessel: string, design: Partial<IconDesign>) {
  saveDesign(schluessel, design);
}

export function resetDesign(schluessel: string) {
  const alle = getAlleDesigns();
  delete alle[schluessel];
  localStorage.setItem(ICONS_KEY, JSON.stringify(alle));
}

export function resetKategorieDesign(schluessel: string) { resetDesign(schluessel); }

export function pngZuBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// System-Schlüssel für Navigation und App-Info
export const NAV_KEYS = {
  home:       'nav_home',
  verlauf:    'nav_verlauf',
  fixkosten:  'nav_fixkosten',
  statistiken:'nav_statistiken',
} as const;

export const APP_KEYS = {
  app:        'app_app',
  daten:      'app_daten',
  datenschutz:'app_datenschutz',
  analyse:    'app_analyse',
} as const;
