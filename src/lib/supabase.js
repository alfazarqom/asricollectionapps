import { createClient } from "@supabase/supabase-js";

/**
 * Hardcoded Supabase Configuration for Asri Collection
 * Direct PostgREST Database & Edge Functions access WITHOUT Supabase Auth.
 */
export const supabaseUrl = "https://mvwflakurihhakdrlteg.supabase.co";
export const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12d2ZsYWt1cmloaGFrZHJsdGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjIwMDksImV4cCI6MjEwNDc5ODAwOX0.E09Vufp77NOkpGjJZMH6sbWYInKu_sMzV7eqHX6xQ0A";

/**
 * Supabase Client configured explicitly WITHOUT Supabase Auth.
 * Auth session persistence and auto-refresh are disabled to adhere to the custom users architecture.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export default supabase;
