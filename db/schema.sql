-- ============================================================
-- GPDTS 2026 Poipet - Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Event metadata
CREATE TABLE IF NOT EXISTS event (
  id SERIAL PRIMARY KEY,
  brand TEXT NOT NULL DEFAULT 'GPDTS 2026',
  title TEXT NOT NULL DEFAULT 'GPDTS',
  kicker TEXT NOT NULL DEFAULT 'Poipet, Cambodia · 2026',
  lede TEXT NOT NULL DEFAULT 'Gon Preah Discipleship Training School. Six months of knowing God and knowing themselves.',
  pray_title TEXT NOT NULL DEFAULT '4 students don''t know Jesus yet',
  pray_text TEXT NOT NULL DEFAULT 'Our goal: 4 students come to know God during this school. Please pray for them.',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pillars (Identity, Purpose, Sharing)
CREATE TABLE IF NOT EXISTS pillars (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES event(id) ON DELETE CASCADE DEFAULT 1,
  heading TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Goals (outreach + classroom)
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES event(id) ON DELETE CASCADE DEFAULT 1,
  category TEXT NOT NULL CHECK (category IN ('outreach', 'classroom')),
  goal_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES event(id) ON DELETE CASCADE DEFAULT 1,
  name TEXT NOT NULL,
  nick TEXT,
  from_location TEXT,
  born DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female')),
  pray BOOLEAN DEFAULT FALSE,
  photo_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin users
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Seed Data
-- ============================================================

-- Insert event
INSERT INTO event (brand, title, kicker, lede, pray_title, pray_text)
VALUES (
  'GPDTS 2026',
  'GPDTS',
  'Poipet, Cambodia · 2026',
  'Gon Preah Discipleship Training School. Six months of knowing God and knowing themselves.',
  '4 students don''t know Jesus yet',
  'Our goal: 4 students come to know God during this school. Please pray for them.'
) ON CONFLICT DO NOTHING;

-- Insert pillars
INSERT INTO pillars (event_id, heading, description, sort_order) VALUES
(1, 'Identity',  'Knowing who they are, what they carry, and who God is for their own life.', 1),
(1, 'Purpose',   'Seeing their calling more clearly — what they love, and what God has for them.', 2),
(1, 'Sharing',   'Carrying it back out into Cambodia''s seven spheres of society.', 3);

-- Insert goals
INSERT INTO goals (event_id, category, goal_text, sort_order) VALUES
(1, 'outreach',  'Share the gospel with 2,500+ people', 1),
(1, 'outreach',  '200 people receive salvation', 2),
(1, 'outreach',  '100 testimonies or reports of healing', 3),
(1, 'outreach',  'Cultural activities during the trip', 4),
(1, 'classroom', '4 students come to know God', 1),
(1, 'classroom', '100% submit weekly assignments on time', 2),
(1, 'classroom', '100% complete a skills course', 3),
(1, 'classroom', '7 students take part in Discovery Bible Study', 4);

-- Insert students (photos stored as URLs or base64 placeholder)
INSERT INTO students (event_id, name, nick, from_location, born, gender, pray, sort_order) VALUES
(1, 'Josha Thoreson',   NULL,        'Canada',         '2008-02-29', 'Male',   FALSE, 1),
(1, 'Chea SreyPich',    'Srey Pich', 'Poipet',         '2008-11-09', 'Female', TRUE,  2),
(1, 'Sanh PeyPey',      NULL,        'Oddar Meanchey', '2005-03-26', 'Female', FALSE, 3),
(1, 'Ny Punleu',        NULL,        'Tbong Khmum',    '2008-12-12', 'Female', FALSE, 4),
(1, 'Soum Chanthy',     'Chanthy',   'Poipet',         '2007-07-16', 'Female', TRUE,  5),
(1, 'Leng Leehour',     'Leehour',   'Poipet',         '2007-06-08', 'Female', TRUE,  6),
(1, 'Sok Sokhom',       NULL,        'Phnom Penh',     '1997-08-21', 'Male',   FALSE, 7);
