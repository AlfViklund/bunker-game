import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://psxtjturnobyhtnfzrlx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_GGGK1k18PIF3aNmeJlzy0g_j0rKANrF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
