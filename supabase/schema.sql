-- Supabase Database DDL Schema for Bunker 2077

-- 1. Bunker Rooms
CREATE TABLE IF NOT EXISTS public.bunker_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'lobby', -- lobby, reveal_round, debate, voting, fake_guess, epilogue
  catastrophe_title TEXT,
  catastrophe_desc TEXT,
  catastrophe_image_url TEXT,
  bunker_size INT NOT NULL DEFAULT 3,
  max_players INT NOT NULL DEFAULT 6,
  current_round INT NOT NULL DEFAULT 1,
  current_turn_user_id UUID,
  turn_order JSONB DEFAULT '[]'::jsonb,
  turn_index INT DEFAULT 0,
  winner VARCHAR(20),
  epilogue_log TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Bunker Players (Humans & AI Bots)
CREATE TABLE IF NOT EXISTS public.bunker_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.bunker_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#10b981',
  is_bot BOOLEAN NOT NULL DEFAULT false,
  bot_personality VARCHAR(20), -- panic, cynic, strategist
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_ready BOOLEAN NOT NULL DEFAULT false,
  is_eliminated BOOLEAN NOT NULL DEFAULT false,
  score INT NOT NULL DEFAULT 0,
  
  -- Survivor Cards
  profession TEXT NOT NULL,
  health TEXT NOT NULL,
  hobby TEXT NOT NULL,
  phobia TEXT NOT NULL,
  luggage TEXT NOT NULL,
  extra_info TEXT NOT NULL,
  special_card TEXT NOT NULL,
  backstory TEXT,
  temperament TEXT,
  
  -- Array of revealed fields e.g. ["profession", "health"]
  revealed_fields JSONB DEFAULT '[]'::jsonb,
  joined_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Bunker Messages & Chat
CREATE TABLE IF NOT EXISTS public.bunker_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.bunker_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_name VARCHAR(50) NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  bot_personality VARCHAR(20),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bunker Votes
CREATE TABLE IF NOT EXISTS public.bunker_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.bunker_rooms(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  suspect_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT bunker_votes_room_voter_unique UNIQUE(room_id, voter_id)
);

-- 5. Bunker Friends & Invites
CREATE TABLE IF NOT EXISTS public.bunker_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_user_id UUID NOT NULL,
  friend_nickname VARCHAR(50) NOT NULL,
  friend_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT bunker_friends_unique UNIQUE(user_id, friend_user_id)
);

CREATE TABLE IF NOT EXISTS public.bunker_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  sender_name VARCHAR(50) NOT NULL,
  recipient_id UUID NOT NULL,
  room_code VARCHAR(6) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies & Publications
ALTER TABLE public.bunker_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bunker_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bunker_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bunker_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bunker_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bunker_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Rooms Access" ON public.bunker_rooms;
CREATE POLICY "Public Rooms Access" ON public.bunker_rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Players Access" ON public.bunker_players;
CREATE POLICY "Public Players Access" ON public.bunker_players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Messages Access" ON public.bunker_messages;
CREATE POLICY "Public Messages Access" ON public.bunker_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Votes Access" ON public.bunker_votes;
CREATE POLICY "Public Votes Access" ON public.bunker_votes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Friends Access" ON public.bunker_friends;
CREATE POLICY "Public Friends Access" ON public.bunker_friends FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Invites Access" ON public.bunker_invites;
CREATE POLICY "Public Invites Access" ON public.bunker_invites FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
