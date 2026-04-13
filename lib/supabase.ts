import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("Supabase environment variables are missing. Some features may not work locally.");
  } else {
    // In production (or build time on Netlify), we want to be aware if they are missing
    console.warn("WARNING: Supabase variables missing in Production/Build environment!");
  }
}

// Fallback to a safe-to-initialize state even if keys are missing
export const supabase = createClient(
  supabaseUrl || "https://missing-keys.supabase.co", 
  supabaseAnonKey || "missing-key"
);
