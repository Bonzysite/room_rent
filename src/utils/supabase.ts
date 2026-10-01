import { createClient } from '@supabase/supabase-js';
import { DatabaseSchema, Room, RoomApplication, Conversation, Message, User } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jqhbamzpyhrqielmqxnw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseAnonKey.trim().length > 0);
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'dummy-anon-key-placeholder'
);

/**
 * Supabase Data Mapper & API Bridge
 */
export const supabaseApi = {
  async getFullData(): Promise<DatabaseSchema | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const [usersRes, roomsRes, appsRes, convsRes, msgsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('rooms').select('*'),
        supabase.from('applications').select('*'),
        supabase.from('conversations').select('*'),
        supabase.from('messages').select('*')
      ]);

      if (usersRes.error || roomsRes.error) {
        console.warn('Supabase query error:', usersRes.error || roomsRes.error);
        return null;
      }

      return {
        users: (usersRes.data || []).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
          bio: u.bio,
          avatar: u.avatar,
          createdAt: u.created_at
        })),
        rooms: (roomsRes.data || []).map(r => ({
          id: r.id,
          landlordId: r.landlord_id,
          landlordName: r.landlord_name,
          landlordEmail: r.landlord_email,
          title: r.title,
          description: r.description,
          price: Number(r.price),
          deposit: Number(r.deposit),
          roomType: r.room_type,
          city: r.city,
          neighborhood: r.neighborhood,
          address: r.address,
          images: Array.isArray(r.images) ? r.images : JSON.parse(r.images || '[]'),
          amenities: Array.isArray(r.amenities) ? r.amenities : JSON.parse(r.amenities || '[]'),
          billsIncluded: Boolean(r.bills_included),
          availableDate: r.available_date,
          minLeaseMonths: Number(r.min_lease_months),
          rules: Array.isArray(r.rules) ? r.rules : JSON.parse(r.rules || '[]'),
          status: r.status,
          createdAt: r.created_at
        })),
        applications: (appsRes.data || []).map(a => ({
          id: a.id,
          roomId: a.room_id,
          roomTitle: a.room_title,
          roomImage: a.room_image,
          roomPrice: Number(a.room_price),
          roomCity: a.room_city,
          landlordId: a.landlord_id,
          tenantId: a.tenant_id,
          tenantName: a.tenant_name,
          tenantEmail: a.tenant_email,
          tenantPhone: a.tenant_phone,
          status: a.status,
          moveInDate: a.move_in_date,
          leaseMonths: Number(a.lease_months),
          occupation: a.occupation,
          monthlyIncome: Number(a.monthly_income),
          bio: a.bio,
          tourDate: a.tour_date,
          tourType: a.tour_type,
          createdAt: a.created_at
        })),
        conversations: (convsRes.data || []).map(c => ({
          id: c.id,
          participants: Array.isArray(c.participants) ? c.participants : JSON.parse(c.participants || '[]'),
          roomId: c.room_id,
          lastMessage: c.last_message,
          updatedAt: c.updated_at
        })),
        messages: (msgsRes.data || []).map(m => ({
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          text: m.text,
          timestamp: m.timestamp || m.created_at,
          read: Boolean(m.read)
        }))
      };
    } catch (err) {
      console.warn('Supabase fetch failed:', err);
      return null;
    }
  },

  async createRoom(room: Omit<Room, 'id' | 'createdAt'> & { id?: string }): Promise<Room | null> {
    if (!isSupabaseConfigured()) return null;

    const id = room.id || `room-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const { data, error } = await supabase.from('rooms').insert([{
      id,
      landlord_id: room.landlordId,
      landlord_name: room.landlordName,
      landlord_email: room.landlordEmail,
      title: room.title,
      description: room.description,
      price: room.price,
      deposit: room.deposit,
      room_type: room.roomType,
      city: room.city,
      neighborhood: room.neighborhood,
      address: room.address,
      images: room.images,
      amenities: room.amenities,
      bills_included: room.billsIncluded,
      available_date: room.availableDate,
      min_lease_months: room.minLeaseMonths,
      rules: room.rules,
      status: room.status,
      created_at: createdAt
    }]).select().single();

    if (error || !data) {
      console.error('Supabase createRoom error:', error);
      return null;
    }

    return {
      id: data.id,
      landlordId: data.landlord_id,
      landlordName: data.landlord_name,
      landlordEmail: data.landlord_email,
      title: data.title,
      description: data.description,
      price: Number(data.price),
      deposit: Number(data.deposit),
      roomType: data.room_type,
      city: data.city,
      neighborhood: data.neighborhood,
      address: data.address,
      images: data.images,
      amenities: data.amenities,
      billsIncluded: Boolean(data.bills_included),
      availableDate: data.available_date,
      minLeaseMonths: Number(data.min_lease_months),
      rules: data.rules,
      status: data.status,
      createdAt: data.created_at
    };
  },

  async upsertUser(user: User): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const { error } = await supabase.from('profiles').upsert([{
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      bio: user.bio,
      avatar: user.avatar,
      created_at: user.createdAt || new Date().toISOString()
    }], { onConflict: 'id' });
    if (error) console.warn('Supabase upsertUser error:', error);
    return !error;
  },

  async updateRoom(id: string, updates: Partial<Room>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const patch: any = {};
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.price !== undefined) patch.price = updates.price;
    if (updates.deposit !== undefined) patch.deposit = updates.deposit;
    if (updates.roomType !== undefined) patch.room_type = updates.roomType;
    if (updates.city !== undefined) patch.city = updates.city;
    if (updates.neighborhood !== undefined) patch.neighborhood = updates.neighborhood;
    if (updates.address !== undefined) patch.address = updates.address;
    if (updates.images !== undefined) patch.images = updates.images;
    if (updates.amenities !== undefined) patch.amenities = updates.amenities;
    if (updates.billsIncluded !== undefined) patch.bills_included = updates.billsIncluded;
    if (updates.availableDate !== undefined) patch.available_date = updates.availableDate;
    if (updates.minLeaseMonths !== undefined) patch.min_lease_months = updates.minLeaseMonths;
    if (updates.rules !== undefined) patch.rules = updates.rules;
    if (updates.status !== undefined) patch.status = updates.status;

    const { error } = await supabase.from('rooms').update(patch).eq('id', id);
    if (error) console.warn('Supabase updateRoom error:', error);
    return !error;
  },

  async deleteRoom(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (error) console.warn('Supabase deleteRoom error:', error);
    return !error;
  },

  async submitApplication(app: RoomApplication): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const { error } = await supabase.from('applications').upsert([{
      id: app.id,
      room_id: app.roomId,
      room_title: app.roomTitle,
      room_image: app.roomImage,
      room_price: app.roomPrice,
      room_city: app.roomCity,
      landlord_id: app.landlordId,
      tenant_id: app.tenantId,
      tenant_name: app.tenantName,
      tenant_email: app.tenantEmail,
      tenant_phone: app.tenantPhone,
      status: app.status,
      move_in_date: app.moveInDate,
      lease_months: app.leaseMonths,
      occupation: app.occupation,
      monthly_income: app.monthlyIncome,
      bio: app.bio,
      tour_date: app.tourDate,
      tour_type: app.tourType,
      created_at: app.createdAt || new Date().toISOString()
    }], { onConflict: 'id' });
    if (error) console.warn('Supabase submitApplication error:', error);
    return !error;
  },

  async sendMessage(msg: Message): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const { error } = await supabase.from('messages').insert([{
      id: msg.id,
      conversation_id: msg.conversationId,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      text: msg.text,
      read: msg.read,
      timestamp: msg.timestamp || new Date().toISOString()
    }]);
    if (error) console.warn('Supabase sendMessage error:', error);
    return !error;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;
    const cleanEmail = email.toLowerCase().trim();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .limit(1);

      if (error || !data || data.length === 0) return null;

      const profile = data[0];
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role as any,
        phone: profile.phone,
        bio: profile.bio,
        avatar: profile.avatar,
        createdAt: profile.created_at
      };
    } catch (err) {
      console.warn('Supabase getUserByEmail failed:', err);
      return null;
    }
  },

  async registerUserInDb(user: User): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const cleanEmail = user.email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('profiles')
        .upsert([{
          id: user.id,
          name: user.name,
          email: cleanEmail,
          role: user.role,
          phone: user.phone,
          bio: user.bio,
          avatar: user.avatar,
          created_at: user.createdAt || new Date().toISOString()
        }], { onConflict: 'email' })
        .select()
        .single();

      if (error || !data) {
        console.error('Supabase registerUserInDb error:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as any,
        phone: data.phone,
        bio: data.bio,
        avatar: data.avatar,
        createdAt: data.created_at
      };
    } catch (err) {
      console.error('Supabase registerUserInDb failed:', err);
      return null;
    }
  }
};

/**
 * Supabase Realtime WebSocket subscription for live updates across clients.
 */
export const subscribeToRealtime = (onDataChange: () => void): (() => void) => {
  if (!isSupabaseConfigured()) return () => {};

  try {
    const channel = supabase
      .channel('roomshare_live_updates')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        onDataChange();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Realtime subscription fallback:', e);
    return () => {};
  }
};
