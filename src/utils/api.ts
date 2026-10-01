import { DatabaseSchema, Room, RoomApplication, Conversation, Message, User } from '../types';
import { storage } from './storage';
import { supabaseApi, isSupabaseConfigured } from './supabase';
import { auth, DEMO_USERS } from './auth';
import { RlsPolicy } from '../security/rls';
import { cacheManager } from './cacheManager';

const API_BASE = '/api';

/**
 * Helper to safely fetch JSON without throwing SyntaxError when static hosts return HTML fallback.
 */
async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const api = {
  async getFullData(): Promise<DatabaseSchema> {
    return cacheManager.deduplicate('getFullData', async () => {
      // 1. Try Supabase first if configured
      if (isSupabaseConfigured()) {
        const supaData = await supabaseApi.getFullData();
        if (supaData) {
          const cached = storage.getDbCache();
          if (cached) {
            if (Array.isArray(cached.users)) {
              const supaUserEmails = new Set((supaData.users || []).map(u => u.email.toLowerCase()));
              const localUsersToKeep = cached.users.filter(u => u && u.email && !supaUserEmails.has(u.email.toLowerCase()));
              supaData.users = [...(supaData.users || []), ...localUsersToKeep];
            }
            if (Array.isArray(cached.rooms)) {
              const supaRoomIds = new Set((supaData.rooms || []).map(r => r.id));
              const localRoomsToKeep = cached.rooms.filter(r => r && r.id && !supaRoomIds.has(r.id));
              supaData.rooms = [...(supaData.rooms || []), ...localRoomsToKeep];
            }
          }
          storage.setDbCache(supaData);
          cacheManager.indexFullData(supaData);
          return supaData;
        }
      }

      // 2. Try REST backend safely
      const json = await safeFetchJson<{ data?: DatabaseSchema }>(`${API_BASE}/data`);
      if (json?.data) {
        storage.setDbCache(json.data);
        cacheManager.indexFullData(json.data);
        return json.data;
      }

      const cached = storage.getDbCache();
      if (cached) {
        cacheManager.indexFullData(cached);
        return cached;
      }

      // Fallback default
      const empty = { users: [], rooms: [], applications: [], conversations: [], messages: [] };
      cacheManager.indexFullData(empty);
      return empty;
    });
  },

  async sync(data: Partial<DatabaseSchema>): Promise<DatabaseSchema> {
    const json = await safeFetchJson<{ data?: DatabaseSchema }>(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (json?.data) {
      storage.setDbCache(json.data);
      return json.data;
    }

    const current = storage.getDbCache() || { users: [], rooms: [], applications: [], conversations: [], messages: [] };
    const merged: DatabaseSchema = {
      users: data.users || current.users,
      rooms: data.rooms || current.rooms,
      applications: data.applications || current.applications,
      conversations: data.conversations || current.conversations,
      messages: data.messages || current.messages
    };
    storage.setDbCache(merged);
    return merged;
  },

  async getRooms(): Promise<Room[]> {
    const json = await safeFetchJson<{ data?: Room[] }>(`${API_BASE}/rooms`);
    if (json?.data) {
      return json.data;
    }
    const cached = storage.getDbCache();
    return cached?.rooms || [];
  },

  async createRoom(room: Omit<Room, 'id' | 'createdAt'> & { id?: string }): Promise<Room> {
    const currentUser = auth.getUser();
    const authCtx = {
      userId: currentUser?.id,
      role: currentUser?.role,
      email: currentUser?.email,
      isAuthenticated: !!currentUser
    };
    const rls = RlsPolicy.rooms.canInsert(room, authCtx);
    if (!rls.allowed) {
      throw new Error(rls.reason || 'RLS Policy Violation');
    }

    let finalRoom: Room | null = null;

    if (isSupabaseConfigured()) {
      finalRoom = await supabaseApi.createRoom(room);
    }

    if (!finalRoom) {
      finalRoom = {
        ...room,
        id: room.id || `room-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
    }

    // Always push to local cache so all users on this browser/session see the new room immediately
    const db = storage.getDbCache() || { users: [], rooms: [], applications: [], conversations: [], messages: [] };
    if (!db.rooms.some(r => r.id === finalRoom!.id)) {
      db.rooms.unshift(finalRoom);
      storage.setDbCache(db);
    }

    return finalRoom;
  },

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
    const currentUser = auth.getUser();
    const authCtx = {
      userId: currentUser?.id,
      role: currentUser?.role,
      email: currentUser?.email,
      isAuthenticated: !!currentUser
    };
    const cached = storage.getDbCache();
    const existing = cached?.rooms.find(r => r.id === id);
    if (existing) {
      const rls = RlsPolicy.rooms.canUpdate(existing, authCtx);
      if (!rls.allowed) {
        throw new Error(rls.reason || 'RLS Policy Violation');
      }
    }

    try {
      const res = await fetch(`${API_BASE}/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('updateRoom offline fallback', e);
    }

    const db = storage.getDbCache() || { users: [], rooms: [], applications: [], conversations: [], messages: [] };
    const index = db.rooms.findIndex(r => r.id === id);
    if (index >= 0) {
      db.rooms[index] = { ...db.rooms[index], ...updates };
      storage.setDbCache(db);
      return db.rooms[index];
    }
    throw new Error('Room not found');
  },

  async deleteRoom(id: string): Promise<boolean> {
    const currentUser = auth.getUser();
    const authCtx = {
      userId: currentUser?.id,
      role: currentUser?.role,
      email: currentUser?.email,
      isAuthenticated: !!currentUser
    };
    const cached = storage.getDbCache();
    const existing = cached?.rooms.find(r => r.id === id);
    if (existing) {
      const rls = RlsPolicy.rooms.canDelete(existing, authCtx);
      if (!rls.allowed) {
        throw new Error(rls.reason || 'RLS Policy Violation');
      }
    }

    try {
      const res = await fetch(`${API_BASE}/rooms/${id}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch (e) {
      console.warn('deleteRoom offline fallback', e);
    }

    const db = storage.getDbCache() || { users: [], rooms: [], applications: [], conversations: [], messages: [] };
    db.rooms = db.rooms.filter(r => r.id !== id);
    storage.setDbCache(db);
    return true;
  },

  async submitApplication(appData: Omit<RoomApplication, 'id' | 'createdAt' | 'status'>): Promise<RoomApplication> {
    try {
      const res = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('submitApplication offline fallback', e);
    }

    const newApp: RoomApplication = {
      ...appData,
      id: `app-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const db = storage.getDbCache() || { users: [], rooms: [], applications: [], conversations: [], messages: [] };
    db.applications.unshift(newApp);
    storage.setDbCache(db);
    return newApp;
  },

  async updateApplicationStatus(id: string, status: RoomApplication['status'], tourDate?: string): Promise<RoomApplication> {
    try {
      const res = await fetch(`${API_BASE}/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(tourDate ? { tourDate } : {}) })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('updateApplication offline fallback', e);
    }

    const db = storage.getDbCache() || { users: [], rooms: [], applications: [], conversations: [], messages: [] };
    const idx = db.applications.findIndex(a => a.id === id);
    if (idx >= 0) {
      db.applications[idx] = { ...db.applications[idx], status, ...(tourDate ? { tourDate } : {}) };
      storage.setDbCache(db);
      return db.applications[idx];
    }
    throw new Error('Application not found');
  },

  async sendMessage(data: { conversationId: string; senderId: string; senderName: string; text: string }): Promise<Message> {
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('sendMessage offline fallback', e);
    }

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderName: data.senderName,
      text: data.text,
      timestamp: new Date().toISOString(),
      read: false
    };

    const db = storage.getDbCache() || { users: [], rooms: [], applications: [], conversations: [], messages: [] };
    db.messages.push(newMsg);
    const conv = db.conversations.find(c => c.id === data.conversationId);
    if (conv) {
      conv.lastMessage = data.text;
      conv.updatedAt = newMsg.timestamp;
    }
    storage.setDbCache(db);
    return newMsg;
  },

  async markMessagesAsRead(conversationId: string, readerId: string): Promise<void> {
    const db = storage.getDbCache() || { users: [], rooms: [], applications: [], conversations: [], messages: [] };
    let updated = false;
    db.messages.forEach(m => {
      if (m.conversationId === conversationId && m.senderId !== readerId && !m.read) {
        m.read = true;
        updated = true;
      }
    });
    if (updated) {
      storage.setDbCache(db);
      try {
        await fetch(`${API_BASE}/messages/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, readerId })
        });
      } catch {
        // ignore offline fallback
      }
    }
  },

  async startConversation(data: { participants: string[]; roomId: string; initialMessage?: string; senderName?: string }): Promise<Conversation> {
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('startConversation offline fallback', e);
    }

    const db = storage.getDbCache() || { users: [], rooms: [], applications: [], conversations: [], messages: [] };
    let conv = db.conversations.find(c => c.roomId === data.roomId && data.participants.every(p => c.participants.includes(p)));

    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        participants: data.participants,
        roomId: data.roomId,
        lastMessage: data.initialMessage || 'Inquiry started',
        updatedAt: new Date().toISOString()
      };
      db.conversations.unshift(conv);
    }

    if (data.initialMessage) {
      const msg: Message = {
        id: `msg-${Date.now()}`,
        conversationId: conv.id,
        senderId: data.participants[0],
        senderName: data.senderName || 'User',
        text: data.initialMessage,
        timestamp: new Date().toISOString(),
        read: false
      };
      db.messages.push(msg);
      conv.lastMessage = data.initialMessage;
    }

    storage.setDbCache(db);
    return conv;
  },

  async authenticateUserFromDb(email: string, _role?: string): Promise<User> {
    const formattedEmail = email.toLowerCase().trim();

    // 1. Query Supabase database profiles table first
    if (isSupabaseConfigured()) {
      const dbUser = await supabaseApi.getUserByEmail(formattedEmail);
      if (dbUser) return dbUser;
    }

    // 2. Query persistent registered users store (isolated from live sync overwrites)
    const registeredUsers = storage.getRegisteredUsers();
    const regUser = registeredUsers.find(u => u && u.email && u.email.toLowerCase() === formattedEmail);
    if (regUser) return regUser;

    // 3. Query local database cache
    const cached = storage.getDbCache();
    const localUser = cached?.users?.find(u => u && u.email && u.email.toLowerCase() === formattedEmail);
    if (localUser) return localUser;

    // 4. Fallback to pre-loaded demo profiles
    const demoUser = Object.values(DEMO_USERS).find((u: User) => u && u.email && u.email.toLowerCase() === formattedEmail);
    if (demoUser) return demoUser;

    throw new Error('No user account found in database matching this email. Please register a new profile first.');
  },

  async registerUserInDb(user: User): Promise<User> {
    const formattedEmail = user.email.toLowerCase().trim();

    // Check if user email already exists in Supabase or registered store
    if (isSupabaseConfigured()) {
      const existing = await supabaseApi.getUserByEmail(formattedEmail);
      if (existing) {
        throw new Error('An account with this email address already exists in the database. Please sign in instead.');
      }
    }

    const registeredUsers = storage.getRegisteredUsers();
    if (registeredUsers.some(u => u && u.email && u.email.toLowerCase() === formattedEmail)) {
      throw new Error('An account with this email address already exists in the database. Please sign in instead.');
    }

    const db = storage.getDbCache() || { users: [], rooms: [], applications: [], conversations: [], messages: [] };
    const existingLocal = db.users.find(u => u && u.email && u.email.toLowerCase() === formattedEmail);
    if (existingLocal) {
      throw new Error('An account with this email address already exists in the database. Please sign in instead.');
    }

    // Try registering in Supabase
    let supaUser: User | null = null;
    if (isSupabaseConfigured()) {
      supaUser = await supabaseApi.registerUserInDb(user);
    }

    const finalUser = supaUser || user;

    // Save to persistent registered users store so live updates never erase account lookups
    storage.addRegisteredUser(finalUser);

    // Always push to local cache as guaranteed persistent backup
    if (!db.users.some(u => u && u.email && u.email.toLowerCase() === formattedEmail)) {
      db.users.push(finalUser);
      storage.setDbCache(db);
    }

    return finalUser;
  }
};
