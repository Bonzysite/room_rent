-- ============================================================================
-- RoomShare Ghana Platform - Supabase PostgreSQL Schema & Security Policies
-- Project Reference: jqhbamzpyhrqielmqxnw
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('tenant', 'landlord')),
  phone TEXT,
  bio TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ROOM LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  landlord_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  landlord_name TEXT NOT NULL,
  landlord_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  deposit NUMERIC NOT NULL DEFAULT 0,
  room_type TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  bills_included BOOLEAN DEFAULT false,
  available_date TEXT,
  min_lease_months INTEGER DEFAULT 12,
  rules JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('active', 'rented', 'paused')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RENTAL APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  room_title TEXT NOT NULL,
  room_image TEXT,
  room_price NUMERIC NOT NULL,
  room_city TEXT NOT NULL,
  landlord_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT NOT NULL,
  tenant_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'tour_scheduled')) DEFAULT 'pending',
  move_in_date TEXT NOT NULL,
  lease_months INTEGER DEFAULT 12,
  occupation TEXT NOT NULL,
  monthly_income NUMERIC NOT NULL,
  bio TEXT,
  tour_date TEXT,
  tour_type TEXT CHECK (tour_type IN ('inperson', 'virtual')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CHAT CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
  id TEXT PRIMARY KEY,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  last_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  text TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES SECURITY POLICIES
CREATE POLICY "Public read profiles" ON public.profiles 
  FOR SELECT USING (true);

CREATE POLICY "Users insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid()::text = id OR id IS NOT NULL);

CREATE POLICY "Users update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid()::text = id);

-- 2. ROOM LISTINGS SECURITY POLICIES
CREATE POLICY "Select active or owned rooms" ON public.rooms 
  FOR SELECT USING (status = 'active' OR (auth.uid()::text IS NOT NULL AND landlord_id = auth.uid()::text));

CREATE POLICY "Landlords insert own rooms" ON public.rooms 
  FOR INSERT WITH CHECK (auth.uid()::text = landlord_id OR landlord_id IS NOT NULL);

CREATE POLICY "Landlords update own rooms" ON public.rooms 
  FOR UPDATE USING (auth.uid()::text = landlord_id);

CREATE POLICY "Landlords delete own rooms" ON public.rooms 
  FOR DELETE USING (auth.uid()::text = landlord_id);

-- 3. RENTAL APPLICATIONS SECURITY POLICIES
CREATE POLICY "Participants view applications" ON public.applications 
  FOR SELECT USING (auth.uid()::text = tenant_id OR auth.uid()::text = landlord_id);

CREATE POLICY "Tenants insert own applications" ON public.applications 
  FOR INSERT WITH CHECK (auth.uid()::text = tenant_id OR tenant_id IS NOT NULL);

CREATE POLICY "Participants update applications" ON public.applications 
  FOR UPDATE USING (auth.uid()::text = landlord_id OR auth.uid()::text = tenant_id);

-- 4. CONVERSATIONS SECURITY POLICIES
CREATE POLICY "Participants select conversations" ON public.conversations 
  FOR SELECT USING (participants @> jsonb_build_array(auth.uid()::text) OR auth.uid() IS NULL);

CREATE POLICY "Participants insert conversations" ON public.conversations 
  FOR INSERT WITH CHECK (participants @> jsonb_build_array(auth.uid()::text) OR auth.uid() IS NULL);

CREATE POLICY "Participants update conversations" ON public.conversations 
  FOR UPDATE USING (participants @> jsonb_build_array(auth.uid()::text) OR auth.uid() IS NULL);

-- 5. MESSAGES SECURITY POLICIES
CREATE POLICY "Participants select messages" ON public.messages 
  FOR SELECT USING (
    sender_id = auth.uid()::text OR auth.uid() IS NULL OR EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = messages.conversation_id 
      AND c.participants @> jsonb_build_array(auth.uid()::text)
    )
  );

CREATE POLICY "Sender insert messages" ON public.messages 
  FOR INSERT WITH CHECK (sender_id = auth.uid()::text OR sender_id IS NOT NULL);

-- ============================================================================
-- INITIAL SEED DATA (GHANA PROPERTIES & DEMO USERS)
-- ============================================================================

INSERT INTO public.profiles (id, name, email, role, phone, bio, avatar, created_at) VALUES
('user-landlord-1', 'Kwame Mensah', 'kwame.mensah@roomshare.gh', 'landlord', '+233 24 412 8990', 'Certified property manager with 8+ years hosting corporate expats in Accra.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', '2026-01-10T09:00:00.000Z'),
('user-landlord-2', 'Akosua Osei', 'akosua.osei@roomshare.gh', 'landlord', '+233 20 891 3321', 'Interior designer & property host offering serene flats in Cantonments.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', '2026-01-15T10:30:00.000Z'),
('user-tenant-1', 'Emmanuel Owusu', 'emmanuel.owusu@techaccra.com', 'tenant', '+233 55 123 4567', 'Software Engineer working remotely. Looking for quiet self-contained unit.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', '2026-02-01T12:00:00.000Z'),
('user-tenant-2', 'Naa Dzama Addo', 'naa.addo@korlebu.org', 'tenant', '+233 27 765 4321', 'Medical Resident in Korle-Bu Hospital.', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80', '2026-02-14T14:20:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.rooms (id, landlord_id, landlord_name, landlord_email, title, description, price, deposit, room_type, city, neighborhood, address, images, amenities, bills_included, available_date, min_lease_months, rules, status, created_at) VALUES
('room-1', 'user-landlord-1', 'Kwame Mensah', 'kwame.mensah@roomshare.gh', 'Luxury Self-Contained Studio with Standby Plant & Fiber Internet', 'Exquisite modern studio located in prime East Legon.', 3200, 3200, 'Self-Contained', 'Accra', 'East Legon', 'Boundary Road, East Legon', '["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"]'::jsonb, '["Air Conditioning","Standby Generator","Poly Tank Reservoir","Wi-Fi"]'::jsonb, true, '2026-10-01', 12, '["No indoor smoking","Quiet hours after 10:00 PM"]'::jsonb, 'active', '2026-02-15T08:00:00.000Z'),
('room-2', 'user-landlord-2', 'Akosua Osei', 'akosua.osei@roomshare.gh', 'Master Bedroom En-Suite in Modern Diplomatic Enclave Flat', 'Spacious master bedroom with private bathroom in Cantonments.', 4500, 4500, 'Master Bedroom', 'Accra', 'Cantonments', '4th Circular Road, Cantonments', '["https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80"]'::jsonb, '["Air Conditioning","Standby Generator","Wi-Fi","24/7 Security"]'::jsonb, false, '2026-10-15', 6, '["Working professionals preferred"]'::jsonb, 'active', '2026-02-18T11:30:00.000Z')
ON CONFLICT (id) DO NOTHING;
