import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://jqhbamzpyhrqielmqxnw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaGJhbXpweWhycWllbG1xeG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNjY5NzQsImV4cCI6MjEwNTY0Mjk3NH0.oWCZxrzacd2P2w3oWxioU1hqPrUH2YlwDgLxaN6Er-M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function pushAllToSupabase() {
  console.log('Starting sync push of all data to Supabase (project: jqhbamzpyhrqielmqxnw)...');

  const dbPath = path.resolve(process.cwd(), 'data/db.json');
  const dbContent = fs.readFileSync(dbPath, 'utf-8');
  const db = JSON.parse(dbContent);

  // 1. Profiles / Users
  const profilesData = (db.users || []).map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    bio: u.bio,
    avatar: u.avatar,
    created_at: u.createdAt || new Date().toISOString()
  }));
  const { error: profileErr } = await supabase.from('profiles').upsert(profilesData, { onConflict: 'id' });
  if (profileErr) console.error('Profiles upsert error:', profileErr.message);
  else console.log(`✓ Upserted ${profilesData.length} profiles to Supabase profiles table`);

  // 2. Rooms
  const roomsData = (db.rooms || []).map((r: any) => ({
    id: r.id,
    landlord_id: r.landlordId,
    landlord_name: r.landlordName,
    landlord_email: r.landlordEmail,
    title: r.title,
    description: r.description,
    price: r.price,
    deposit: r.deposit,
    room_type: r.roomType,
    city: r.city,
    neighborhood: r.neighborhood,
    address: r.address,
    images: r.images,
    amenities: r.amenities,
    bills_included: r.billsIncluded,
    available_date: r.availableDate,
    min_lease_months: r.minLeaseMonths,
    rules: r.rules,
    status: r.status,
    created_at: r.createdAt || new Date().toISOString()
  }));
  const { error: roomErr } = await supabase.from('rooms').upsert(roomsData, { onConflict: 'id' });
  if (roomErr) console.error('Rooms upsert error:', roomErr.message);
  else console.log(`✓ Upserted ${roomsData.length} property listings to Supabase rooms table`);

  // 3. Applications
  const appsData = (db.applications || []).map((a: any) => ({
    id: a.id,
    room_id: a.roomId,
    room_title: a.roomTitle,
    room_image: a.roomImage,
    room_price: a.roomPrice,
    room_city: a.roomCity,
    landlord_id: a.landlordId,
    tenant_id: a.tenantId,
    tenant_name: a.tenantName,
    tenant_email: a.tenantEmail,
    tenant_phone: a.tenantPhone,
    status: a.status,
    move_in_date: a.moveInDate,
    lease_months: a.leaseMonths,
    occupation: a.occupation,
    monthly_income: a.monthlyIncome,
    bio: a.bio,
    tour_date: a.tourDate,
    tour_type: a.tourType,
    created_at: a.createdAt || new Date().toISOString()
  }));
  const { error: appErr } = await supabase.from('applications').upsert(appsData, { onConflict: 'id' });
  if (appErr) console.error('Applications upsert error:', appErr.message);
  else console.log(`✓ Upserted ${appsData.length} rental applications to Supabase applications table`);

  // 4. Conversations
  const convsData = (db.conversations || []).map((c: any) => ({
    id: c.id,
    participants: c.participants,
    room_id: c.roomId,
    last_message: c.lastMessage,
    updated_at: c.updatedAt || new Date().toISOString()
  }));
  const { error: convErr } = await supabase.from('conversations').upsert(convsData, { onConflict: 'id' });
  if (convErr) console.error('Conversations upsert error:', convErr.message);
  else console.log(`✓ Upserted ${convsData.length} chat threads to Supabase conversations table`);

  // 5. Messages
  const msgsData = (db.messages || []).map((m: any) => ({
    id: m.id,
    conversation_id: m.conversationId,
    sender_id: m.senderId,
    sender_name: m.senderName,
    text: m.text,
    read: m.read,
    timestamp: m.timestamp || new Date().toISOString()
  }));
  const { error: msgErr } = await supabase.from('messages').upsert(msgsData, { onConflict: 'id' });
  if (msgErr) console.error('Messages upsert error:', msgErr.message);
  else console.log(`✓ Upserted ${msgsData.length} chat messages to Supabase messages table`);

  console.log('\n======================================================');
  console.log('ALL UPDATES SUCCESSFULLY PUSHED TO SUPABASE DATABASE!');
  console.log('======================================================');
}

pushAllToSupabase().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
