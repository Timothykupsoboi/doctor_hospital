// =============================================================
// FILE: supabase.js
// PURPOSE: Initializes and exports the single Supabase client
//          instance used by all components in the app.
//          Uses VITE_ environment variables (set in frontend/.env)
// =============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing environment variables! Check frontend/.env');
} else {
  console.log('[Supabase] Initializing with URL:', supabaseUrl);
}

// Create a single shared Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
