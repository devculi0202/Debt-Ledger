import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY

if (!url || !serviceKey) {
  console.warn(
    '[whatsapp-worker] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the reminder job.',
  )
}

export const admin = url && serviceKey
  ? createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

export const anon = url && anonKey
  ? createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null

export async function verifyUserJwt(accessToken) {
  if (!accessToken) return null
  if (!anon && !admin) return null
  const client = anon || admin
  const { data, error } = await client.auth.getUser(accessToken)
  if (error || !data?.user) return null
  return data.user
}
