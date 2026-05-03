import { createClient } from '@supabase/supabase-js';

// These should be set in AI Studio -> Settings -> Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined): url is string => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const isSupabaseConfigured = isValidUrl(supabaseUrl) && Boolean(supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (null as any); // The app should check isSupabaseConfigured before using it
