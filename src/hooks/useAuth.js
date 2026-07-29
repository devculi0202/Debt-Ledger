import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import * as authService from '../services/auth'

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
      setSession(nextSession)
      if (event === 'SIGNED_IN' && nextSession) {
        navigate('/master-debts', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  async function signIn() {
    const { error } = await authService.signInWithGithub()
    if (error) alert(error.message)
  }

  async function signOut() {
    const { error } = await authService.signOut()
    if (error) {
      alert(error.message)
      return
    }
    navigate('/login', { replace: true })
  }

  const userName =
    session?.user?.user_metadata?.user_name || session?.user?.email || 'User'

  return { session, userName, signIn, signOut }
}
