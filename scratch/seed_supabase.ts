import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://jqhbamzpyhrqielmqxnw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaGJhbXpweWhycWllbG1xeG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNjY5NzQsImV4cCI6MjEwNTY0Mjk3NH0.oWCZxrzacd2P2w3oWxioU1hqPrUH2YlwDgLxaN6Er-M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('Reading data/db.json...');
  const raw = fs.readFileSync(path.join(process.cwd(), 'data', 'db.json'), 'utf-8');
  const db = JSON.parse(raw);

  // 1. Seed profiles
  console.log(`Seeding ${db.users.length} users...`);
  for (const u of db.users) {
    const { error } = await supabase.from('profiles').upsert({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      bio: u.bio,
      avatar: u.avatar,
      created_at: u.createdAt
    });
    if (error) console.warn('Error inserting profile:', u.id, error.message);
  }

  // 2. Seed rooms
  console.log(`Seeding ${db.rooms.length} rooms...`);
  for (const r of db.rooms) {
    const { error } = await supabase.from('rooms').upsert({
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
      created_at: r.createdAt
    });
    if (error) console.warn('Error inserting room:', r.id, error.message);
  }

  // 3. Seed applications
  console.log(`Seeding ${db.applications.length} applications...`);
  for (const a of db.applications) {
    const { error } = await supabase.from('applications').upsert({
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
      created_at: a.createdAt
    });
    if (error) console.warn('Error inserting application:', a.id, error.message);
  }

  // 4. Seed conversations
  console.log(`Seeding ${db.conversations.length} conversations...`);
  for (const c of db.conversations) {
    const { error } = await supabase.from('conversations').upsert({
      id: c.id,
      participants: c.participants,
      room_id: c.roomId,
      last_message: c.lastMessage,
      updated_at: c.updatedAt
    });
    if (error) console.warn('Error inserting conversation:', c.id, error.message);
  }

  // 5. Seed messages
  console.log(`Seeding ${db.messages.length} messages...`);
  for (const m of db.messages) {
    const { error } = await supabase.from('messages').upsert({
      id: m.id,
      conversation_id: m.conversationId,
      sender_id: m.senderId,
      sender_name: m.senderName,
      text: m.text,
      read: m.read,
      timestamp: m.timestamp
    });
    if (error) console.warn('Error inserting message:', m.id, error.message);
  }

  console.log('Seeding process complete!');
}

seed().catch(console.error);
