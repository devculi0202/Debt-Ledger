import { supabase } from '../lib/supabase'
import logger from '../lib/logger'

const CTX = 'auth'

export async function signInWithGithub() {
  logger.info('Initiating GitHub OAuth sign-in', CTX)
  const result = await supabase.auth.signInWithOAuth({ provider: 'github' })
  if (result.error) logger.error('Sign-in failed', CTX, result.error)
  return result
}

export async function signOut() {
  logger.info('Signing out', CTX)
  const result = await supabase.auth.signOut()
  if (result.error) logger.error('Sign-out failed', CTX, result.error)
  return result
}
