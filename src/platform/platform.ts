export interface Storage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export interface Platform {
  storage: Storage;
  achievements: { unlock(id: string): void };
  openUrl(url: string): void;
  isSteamDeck(): boolean;
  locale(): string;
}

/** Web implementacija: localStorage s fallbackom u memoriju (privatni prozor, blokiran storage). */
export function createWebPlatform(): Platform {
  const mem = new Map<string, string>();
  const storage: Storage = {
    get(k) { try { return localStorage.getItem(k); } catch { return mem.get(k) ?? null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { mem.set(k, v); } },
    remove(k) { try { localStorage.removeItem(k); } catch { mem.delete(k); } },
  };
  return {
    storage,
    achievements: { unlock() { /* web: lokalna lista u MetaState */ } },
    openUrl(url) { window.open(url, '_blank', 'noopener'); },
    isSteamDeck() { return /steam/i.test(navigator.userAgent) && window.innerWidth === 1280 && window.innerHeight === 800; },
    locale() { return navigator.language || 'bs'; },
  };
}
