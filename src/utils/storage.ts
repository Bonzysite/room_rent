import { DatabaseSchema, Room, User } from '../types';

const STORAGE_KEYS = {
  DB_CACHE: 'roomshare_db_cache_v1',
  AUTH_USER: 'roomshare_current_user_v1',
  FAVORITES: 'roomshare_favorite_rooms_v1',
  THEME: 'roomshare_theme_v1'
};

export const storage = {
  getDbCache(): DatabaseSchema | null {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.DB_CACHE);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  setDbCache(db: DatabaseSchema): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DB_CACHE, JSON.stringify(db));
    } catch (e) {
      console.warn('LocalStorage quota reached when caching DB', e);
    }
  },

  getCurrentUser(): User | null {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    }
  },

  getFavorites(): string[] {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  },

  toggleFavorite(roomId: string): string[] {
    const favs = this.getFavorites();
    const idx = favs.indexOf(roomId);
    let next: string[];
    if (idx >= 0) {
      next = favs.filter(id => id !== roomId);
    } else {
      next = [...favs, roomId];
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(next));
    return next;
  },

  getTheme(): 'dark' | 'light' {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.THEME);
      return (item === 'light' || item === 'dark') ? item : 'dark';
    } catch {
      return 'dark';
    }
  },

  setTheme(theme: 'dark' | 'light'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // ignore
    }
  }
};
