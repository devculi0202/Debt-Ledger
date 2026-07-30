import { supabase } from '../lib/supabase'
import logger from '../lib/logger'

const CTX = 'transactions'

export const fetchAll = async () => {
  logger.debug('Fetching all debts', CTX)
  const result = await supabase.from('debts').select('*').order('created_at', { ascending: false })
  if (result.error) logger.error('fetchAll failed', CTX, result.error)
  else logger.debug(`Fetched ${result.data?.length ?? 0} debts`, CTX)
  return result
}

export const create = async (payload) => {
  const { paid = false, ...rest } = payload
  logger.info('Creating debt', CTX, { ...rest, paid })
  const result = await supabase.from('debts').insert([{ ...rest, paid }])
  if (result.error) logger.error('Create failed', CTX, result.error)
  return result
}

export const update = async (id, payload) => {
  logger.info(`Updating debt ${id}`, CTX, payload)
  const result = await supabase.from('debts').update(payload).eq('id', id)
  if (result.error) logger.error(`Update failed for ${id}`, CTX, result.error)
  return result
}

export const togglePaid = async (id, newStatus) => {
  logger.info(`Toggling paid for ${id} to ${newStatus}`, CTX)
  const result = await supabase.from('debts').update({ paid: newStatus }).eq('id', id)
  if (result.error) logger.error(`togglePaid failed for ${id}`, CTX, result.error)
  return result
}

export const remove = async (id) => {
  logger.warn(`Deleting debt ${id}`, CTX)
  const result = await supabase.from('debts').delete().eq('id', id)
  if (result.error) logger.error(`Delete failed for ${id}`, CTX, result.error)
  return result
}
