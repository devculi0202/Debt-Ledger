import { supabase } from '../lib/supabase'

export async function signInWithGithub() {
  return supabase.auth.signInWithOAuth({ provider: 'github' })
}

export async function signOut() {
  return supabase.auth.signOut()
}
