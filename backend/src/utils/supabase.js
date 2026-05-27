/**
 * Supabase Client Utility
 * Creates and exports Supabase clients for database operations
 */

const { createClient } = require('@supabase/supabase-js');

// Admin client for server-side operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Regular client factory for user-specific operations
const createSupabaseClient = (accessToken) => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      }
    }
  );
};

module.exports = { supabaseAdmin, createSupabaseClient };