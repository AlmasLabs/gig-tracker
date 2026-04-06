import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Det er ordet 'export' her som er viktig!
export const supabase = createClient(supabaseUrl, supabaseAnonKey);