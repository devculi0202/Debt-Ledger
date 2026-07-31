import { supabase } from '../lib/supabase'
import logger from '../lib/logger'

const CTX = 'reminders'

const DEFAULT_TEMPLATE = 'Reminder: {person} — {amount} due on {due_date}.'

export async function fetchSettings(userId) {
  logger.debug('Fetching reminder settings', CTX)
  const result = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (result.error) logger.error('fetchSettings failed', CTX, result.error)
  return result
}

export async function upsertSettings(userId, payload) {
  const row = {
    user_id: userId,
    phone: payload.phone ?? '',
    message_template: payload.message_template || DEFAULT_TEMPLATE,
    days_before: Number(payload.days_before ?? 3),
    enabled: Boolean(payload.enabled),
    timezone: payload.timezone || 'Asia/Ho_Chi_Minh',
    updated_at: new Date().toISOString(),
  }
  logger.info('Upserting reminder settings', CTX, {
    userId,
    days_before: row.days_before,
    enabled: row.enabled,
  })
  const result = await supabase
    .from('reminder_settings')
    .upsert(row, { onConflict: 'user_id' })
    .select()
    .single()
  if (result.error) logger.error('upsertSettings failed', CTX, result.error)
  return result
}

export { DEFAULT_TEMPLATE }
