
import { createClient } from '@supabase/supabase-js';

// Helper to safely access global objects
const getGlobal = () => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window;
  if (typeof self !== 'undefined') return self;
  return {};
};

const getEnv = (key: string) => {
  // 1. Try import.meta.env (Vite standard)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore
  }
  
  // 2. Try process.env (Node/Compat) safely
  try {
    const globalScope = getGlobal() as any;
    // Only access process if it exists to avoid ReferenceError in strict mode
    const process = globalScope && globalScope.process ? globalScope.process : {};
    const env = process.env || {};
    
    if (env[key]) return env[key];
    if (env[key.replace('VITE_', '')]) return env[key.replace('VITE_', '')];
    
  } catch (e) {
    // Ignore
  }
  
  return undefined;
};

// Hardcoded keys provided by user
const DEFAULT_URL = 'https://ukmzaqnoawwqacliujzv.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbXphcW5vYXd3cWFjbGl1anp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NTczNjEsImV4cCI6MjA3OTIzMzM2MX0.56m551nBR-y0zf3vVUkxDlmPjS_QVEc5QQDxman8kJ0';

// Get keys from environment variables OR use hardcoded defaults
const SUPABASE_URL = getEnv('VITE_SUPABASE_URL') || DEFAULT_URL;
const SUPABASE_ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || DEFAULT_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check if supabase is configured
export const isSupabaseConfigured = () => {
  return SUPABASE_URL.includes('supabase.co') && 
         SUPABASE_URL !== 'https://placeholder-project.supabase.co';
};
