/** Local-only catalog search. Does not make dispensing decisions. */
export type CachedMedicine = {
  id: string;
  name: string;
  strength: string | null;
  quantity: number;
  unit: string;
  synced_at: string;
  locations: {rack: string; shelf: string}[];
};

export function normalize(text: string): string {
  return text.normalize("NFKC").toLocaleLowerCase().replace(/[^\\p{L}\\p{N}]+/gu, " ").trim();
}

function editDistance(a: string, b: string): number {
  const prev = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    for (let j = 0; j <= b.length; j++) prev[j] = next[j];
  }
  return prev[b.length];
}

export function searchCached(catalog: CachedMedicine[], query: string): CachedMedicine[] {
  const q = normalize(query);
  if (!q) return catalog.slice(0, 100);
  const matches = catalog.map(item => {
    const name = normalize(item.name);
    const score = name === q ? 100 : name.startsWith(q) ? 90 : name.includes(q) ? 80 : Math.max(0, 70 - 12 * editDistance(name, q));
    return {item, score};
  }).filter(entry => entry.score >= 46);
  matches.sort((a,b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  return matches.slice(0, 100).map(entry => entry.item);
}
