import { DatabaseSchema, Room, User } from '../types';

const STORAGE_KEYS = {
  DB_CACHE: 'roomshare_db_cache_v1',
  AUTH_USER: 'roomshare_current_user_v1',
  FAVORITES: 'roomshare_favorite_rooms_v1',
  THEME: 'roomshare_theme_v1',
  REGISTERED_USERS: 'roomshare_registered_users_v1',
  REGISTERED_ROOMS: 'roomshare_registered_rooms_v1'
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
  },

  getRegisteredUsers(): User[] {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  },

  addRegisteredUser(user: User): void {
    try {
      const existing = this.getRegisteredUsers();
      const filtered = existing.filter(u => u && u.email && u.email.toLowerCase() !== user.email.toLowerCase());
      filtered.push(user);
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  },

  getRegisteredRooms(): Room[] {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.REGISTERED_ROOMS);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  },

  addRegisteredRoom(room: Room): void {
    try {
      const existing = this.getRegisteredRooms();
      const filtered = existing.filter(r => r && r.id !== room.id);
      filtered.unshift(room);
      localStorage.setItem(STORAGE_KEYS.REGISTERED_ROOMS, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }
};
