import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://fceifsdytukqhesnkyyq.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_nsMMasjawPFo_fe9hGgjWQ_3lP0DxA7'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
