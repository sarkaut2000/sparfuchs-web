const KEY = 'sparfuchs_kat_order';

export function getKatReihenfolge(): string[] {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveKatReihenfolge(names: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(names));
}
