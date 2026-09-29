import { User, UserRole } from '../types';
import { storage } from './storage';

export const DEMO_USERS: Record<string, User> = {
  landlord: {
    id: 'user-landlord-1',
    name: 'Kwame Mensah',
    email: 'kwame.mensah@roomshare.gh',
    role: 'landlord',
    phone: '+233 24 412 8990',
    bio: 'Certified property manager with 8+ years hosting corporate expats, healthcare professionals, and postgraduate scholars in Accra.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-01-10T09:00:00.000Z'
  },
  tenant: {
    id: 'user-tenant-1',
    name: 'Emmanuel Owusu',
    email: 'emmanuel.owusu@techaccra.com',
    role: 'tenant',
    phone: '+233 55 123 4567',
    bio: 'Software Engineer working remotely for a fintech firm. Looking for a quiet, reliable self-contained room or flat with generator backup.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    createdAt: '2026-02-01T12:00:00.000Z'
  }
};

export const auth = {
  getUser(): User | null {
    return storage.getCurrentUser();
  },

  setUser(user: User | null): void {
    storage.setCurrentUser(user);
  },

  logout(): void {
    storage.setCurrentUser(null);
  },

  switchRole(role: UserRole): User {
    const current = this.getUser();
    if (current && current.role === role) return current;

    if (role === 'landlord') {
      const landlord = DEMO_USERS.landlord;
      storage.setCurrentUser(landlord);
      return landlord;
    } else {
      const tenant = DEMO_USERS.tenant;
      storage.setCurrentUser(tenant);
      return tenant;
    }
  }
};
