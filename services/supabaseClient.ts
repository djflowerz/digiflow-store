import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// Initialize Supabase client
// If keys are missing, we return null to allow fallback to mock mode
export const supabase = ((SUPABASE_URL as string) !== "https://your-project.supabase.co") 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase;