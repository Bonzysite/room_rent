import { Room, RoomApplication, Conversation, Message, User, UserRole } from '../types';

export interface AuthContext {
  userId?: string;
  role?: UserRole;
  email?: string;
  isAuthenticated: boolean;
}

export interface RlsPolicyResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Row Level Security (RLS) Policy Engine for RoomShare Platform
 * Enforces least-privilege tenant and landlord isolation.
 */
export const RlsPolicy = {
  // ================= ROOMS POLICIES =================
  rooms: {
    /**
     * SELECT: Public can see active rooms. Non-active (paused/rented) are only
     * readable by the property's owning landlord.
     */
    canSelect(room: Room, auth: AuthContext): boolean {
      if (room.status === 'active') {
        return true;
      }
      return !!auth.userId && auth.userId === room.landlordId;
    },

    /**
     * INSERT: Must have landlord role and landlordId must match auth user.
     */
    canInsert(room: Partial<Room>, auth: AuthContext): RlsPolicyResult {
      if (!auth.isAuthenticated || !auth.userId) {
        return { allowed: false, reason: 'Authentication required to publish listings.' };
      }
      if (auth.role !== 'landlord') {
        return { allowed: false, reason: 'Only verified landlord accounts can publish listings.' };
      }
      if (room.landlordId && room.landlordId !== auth.userId) {
        return { allowed: false, reason: 'Cannot create a listing under another landlord identity.' };
      }
      return { allowed: true };
    },

    /**
     * UPDATE: Only the owning landlord can modify listing details or change availability.
     */
    canUpdate(existing: Room, auth: AuthContext): RlsPolicyResult {
      if (!auth.isAuthenticated || !auth.userId) {
        return { allowed: false, reason: 'Authentication required to update property.' };
      }
      if (existing.landlordId !== auth.userId) {
        return { allowed: false, reason: 'RLS Violation: You can only edit your own listings.' };
      }
      return { allowed: true };
    },

    /**
     * DELETE: Only the owning landlord can delete the room listing.
     */
    canDelete(existing: Room, auth: AuthContext): RlsPolicyResult {
      if (!auth.isAuthenticated || !auth.userId) {
        return { allowed: false, reason: 'Authentication required to delete property.' };
      }
      if (existing.landlordId !== auth.userId) {
        return { allowed: false, reason: 'RLS Violation: You can only delete your own listings.' };
      }
      return { allowed: true };
    }
  },

  // ================= APPLICATIONS POLICIES =================
  applications: {
    /**
     * SELECT: Strictly accessible ONLY by the applicant tenant or the owning landlord.
     * Prevents third parties from seeing tenant income, occupation, bio, or contact.
     */
    canSelect(app: RoomApplication, auth: AuthContext): boolean {
      if (!auth.isAuthenticated || !auth.userId) {
        return false;
      }
      return auth.userId === app.tenantId || auth.userId === app.landlordId;
    },

    /**
     * INSERT: Tenant can only submit applications for themselves.
     */
    canInsert(app: Partial<RoomApplication>, auth: AuthContext): RlsPolicyResult {
      if (!auth.isAuthenticated || !auth.userId) {
        return { allowed: false, reason: 'Authentication required to submit applications.' };
      }
      if (app.tenantId && app.tenantId !== auth.userId) {
        return { allowed: false, reason: 'RLS Violation: Cannot submit applications on behalf of another user.' };
      }
      return { allowed: true };
    },

    /**
     * UPDATE: Landlord can update status (accept/decline/confirm tour);
     * Tenant can only update move-in date while still pending.
     */
    canUpdate(existing: RoomApplication, updates: Partial<RoomApplication>, auth: AuthContext): RlsPolicyResult {
      if (!auth.isAuthenticated || !auth.userId) {
        return { allowed: false, reason: 'Authentication required.' };
      }

      // If updating status, user must be the landlord
      if (updates.status && updates.status !== existing.status) {
        if (auth.userId !== existing.landlordId) {
          return { allowed: false, reason: 'RLS Violation: Only the landlord can accept or decline applications.' };
        }
      }

      // Non-landlord updates must belong to the tenant
      if (auth.userId !== existing.landlordId && auth.userId !== existing.tenantId) {
        return { allowed: false, reason: 'RLS Violation: Unauthorized access to application.' };
      }

      return { allowed: true };
    }
  },

  // ================= CONVERSATIONS & MESSAGES POLICIES =================
  conversations: {
    /**
     * SELECT: Only participants of the conversation can access the thread.
     */
    canSelect(conv: Conversation, auth: AuthContext): boolean {
      if (!auth.isAuthenticated || !auth.userId) return false;
      return conv.participants.includes(auth.userId);
    },

    /**
     * INSERT: Requester must be listed in participants.
     */
    canInsert(conv: Partial<Conversation>, auth: AuthContext): RlsPolicyResult {
      if (!auth.isAuthenticated || !auth.userId) {
        return { allowed: false, reason: 'Authentication required.' };
      }
      if (conv.participants && !conv.participants.includes(auth.userId)) {
        return { allowed: false, reason: 'RLS Violation: You must be a participant to create this thread.' };
      }
      return { allowed: true };
    }
  },

  messages: {
    /**
     * SELECT: Only participants of the associated conversation can read messages.
     */
    canSelect(conversation: Conversation, auth: AuthContext): boolean {
      if (!auth.isAuthenticated || !auth.userId) return false;
      return conversation.participants.includes(auth.userId);
    },

    /**
     * INSERT: Sender ID must match authenticated user and must belong to conversation.
     */
    canInsert(msg: Partial<Message>, conversation: Conversation, auth: AuthContext): RlsPolicyResult {
      if (!auth.isAuthenticated || !auth.userId) {
        return { allowed: false, reason: 'Authentication required to send messages.' };
      }
      if (msg.senderId && msg.senderId !== auth.userId) {
        return { allowed: false, reason: 'RLS Violation: Sender ID spoofing detected.' };
      }
      if (!conversation.participants.includes(auth.userId)) {
        return { allowed: false, reason: 'RLS Violation: Cannot post into a thread you are not part of.' };
      }
      return { allowed: true };
    }
  },

  // ================= USERS POLICIES =================
  users: {
    /**
     * UPDATE: Users can only update their own profile.
     */
    canUpdate(targetUserId: string, auth: AuthContext): RlsPolicyResult {
      if (!auth.isAuthenticated || !auth.userId) {
        return { allowed: false, reason: 'Authentication required.' };
      }
      if (auth.userId !== targetUserId) {
        return { allowed: false, reason: 'RLS Violation: Cannot edit another user profile.' };
      }
      return { allowed: true };
    },

    /**
     * Sanitizes user object to strip passwords or credentials.
     */
    sanitize(user: User): Omit<User, 'password'> {
      const { password, ...safe } = user;
      return safe;
    }
  }
};
