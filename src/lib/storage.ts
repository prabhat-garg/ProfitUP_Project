const PREFIX = 'pu_';

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string) {
  try {
    localStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // Storage can be unavailable in private mode.
  }
}

export function stateKey(sessionId: string) {
  return `state_${sessionId}_v1`;
}

export function readTheme() {
  return localStorage.getItem(`${PREFIX}theme`) || 'system';
}

export function writeTheme(theme: string) {
  localStorage.setItem(`${PREFIX}theme`, theme);
}

export function readLanguage() {
  return localStorage.getItem(`${PREFIX}language`) || 'hi';
}

export function writeLanguage(lang: string) {
  localStorage.setItem(`${PREFIX}language`, lang);
}
