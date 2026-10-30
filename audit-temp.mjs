const store = new Map([['pu_language','hi']]);
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k,v) => store.set(k,String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  length: 0,
};
const mod = await import('./src/i18n/index.ts');
console.log(Object.keys(mod));
console.log(Object.keys(mod.en).slice(0,5), Object.keys(mod.hi).length, Object.keys(mod.hinglish).length);
