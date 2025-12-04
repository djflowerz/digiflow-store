import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// Initialize Supabase client
// Ensure we have valid keys before initializing
const isValidConfig = SUPABASE_URL && SUPABASE_URL.startsWith('https') && SUPABASE_ANON_KEY;

export const supabase = isValidConfig 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase;
