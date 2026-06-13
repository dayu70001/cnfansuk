const memoryStorage = new Map<string, string>();

export function readStorage(key: string) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    return memoryStorage.get(key) || null;
  }
  return memoryStorage.get(key) || null;
}

export function writeStorage(key: string, value: string) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch {
    memoryStorage.set(key, value);
    return;
  }
  memoryStorage.set(key, value);
}
