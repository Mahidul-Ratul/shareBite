import { createClient } from "@supabase/supabase-js";

// Replace with your Supabase project details
const SUPABASE_URL = "https://opumjgimrzdtywxavguj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdW1qZ2ltcnpkdHl3eGF2Z3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MTIxMDUsImV4cCI6MjA1NTM4ODEwNX0.C-tvtwHE5tw_vdU6_53pGsysBsEZt82MNXwl3Ha96Qo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);