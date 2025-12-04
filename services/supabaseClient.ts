import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// Clean keys to prevent whitespace issues
const supabaseUrl = (SUPABASE_URL || "").trim();
const supabaseKey = (SUPABASE_ANON_KEY || "").trim();

// Initialize Supabase client
// Ensure we have valid keys before initializing
const isValidConfig = supabaseUrl.startsWith('http') && supabaseKey.length > 0;

if (!isValidConfig) {
  console.error("Digiflow Error: Supabase keys are missing or invalid in constants.ts", { 
    url: supabaseUrl, 
    hasKey: supabaseKey.length > 0 
  });
}

export const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase;
