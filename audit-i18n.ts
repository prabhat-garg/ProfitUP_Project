import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const store = new Map<string, string>([['pu_language', 'hi']]);
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, String(v)),
  removeItem: (k: string) => store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
};

const { resources } = await import('./src/i18n/index.ts');

function flatten(obj: any, prefix = '', out = new Set<string>()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out.add(key);
  }
  return out;
}

const langs = {
  en: flatten(resources.en.translation),
  hi: flatten(resources.hi.translation),
  hinglish: flatten(resources.hinglish.translation),
};

const files: string[] = [];
function walk(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !full.includes('i18n')) files.push(full);
  }
}
walk('src');

const keys = new Map<string, string[]>();
const dynamic: string[] = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/(?<![\w.])t\(\s*['"]([^'"`]+)['"]/g)) {
    const list = keys.get(match[1]) ?? [];
    list.push(file);
    keys.set(match[1], list);
  }
  for (const match of text.matchAll(/(?<![\w.])t\(\s*`([^`]+)`/g)) dynamic.push(`${file}: ${match[1]}`);
}

for (const [lang, set] of Object.entries(langs)) {
  const missing = [...keys.keys()].filter((key) => !set.has(key));
  console.error(`\n${lang}: ${missing.length} missing`);
  for (const key of missing) console.error(`  ${key}  <- ${[...new Set(keys.get(key))].join(', ')}`);
}
console.error(`\nDynamic keys (${dynamic.length}):`);
for (const item of dynamic) console.error('  ' + item);
