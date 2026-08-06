import { supabase } from '@/shared/api/supabase'
import logger from '@/shared/lib/logger'
import {
  DEFAULT_REMINDER_TEMPLATE,
  DEFAULT_REMINDER_TIMEZONE,
} from '@debt-ledger/domain'

const CTX = 'reminders'

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
    message_template: payload.message_template || DEFAULT_REMINDER_TEMPLATE,
    days_before: Number(payload.days_before ?? 3),
    enabled: Boolean(payload.enabled),
    timezone: payload.timezone || DEFAULT_REMINDER_TIMEZONE,
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

export { DEFAULT_REMINDER_TEMPLATE as DEFAULT_TEMPLATE }
