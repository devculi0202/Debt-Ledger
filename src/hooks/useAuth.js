import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import * as authService from '../services/auth'
import logger from '../lib/logger'

export default function useAuth() {
  const navigate = useNavigate()
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      logger.info(`Auth state changed: ${event}`, 'auth')
      setSession(nextSession)
      if (event === 'SIGNED_IN' && nextSession) {
        navigate('/master-debts', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  async function signIn() {
    const { error } = await authService.signInWithGithub()
    if (error) {
      logger.error('Sign-in failed', 'auth', error)
    }
  }

  async function signOut() {
    const { error } = await authService.signOut()
    if (error) {
      logger.error('Sign-out failed', 'auth', error)
      return
    }
    navigate('/login', { replace: true })
  }

  const userName =
    session?.user?.user_metadata?.user_name || session?.user?.email || 'User'

  return { session, userName, signIn, signOut }
}
