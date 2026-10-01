// ============================================================
// GPDTS 2026 - Supabase DB Client
// ============================================================
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service key for server-side
);

module.exports = supabase;
