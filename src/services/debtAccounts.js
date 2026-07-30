import { supabase } from '../lib/supabase'
import logger from '../lib/logger'

const CTX = 'debtAccounts'

export const fetchAll = async () => {
  logger.debug('Fetching all accounts', CTX)
  const result = await supabase
    .from('debt_accounts')
    .select('*')
    .order('principal_amount', { ascending: false })
  if (result.error) logger.error('fetchAll failed', CTX, result.error)
  else logger.debug(`Fetched ${result.data?.length ?? 0} accounts`, CTX)
  return result
}

export const create = async (payload, userId) => {
  logger.info('Creating account', CTX, payload)
  const result = await supabase.from('debt_accounts').insert([{ ...payload, user_id: userId }])
  if (result.error) logger.error('Create failed', CTX, result.error)
  return result
}

export const update = async (id, payload) => {
  logger.info(`Updating account ${id}`, CTX, payload)
  const result = await supabase.from('debt_accounts').update(payload).eq('id', id)
  if (result.error) logger.error(`Update failed for ${id}`, CTX, result.error)
  return result
}

export const remove = async (id) => {
  logger.warn(`Deleting account ${id}`, CTX)
  const result = await supabase.from('debt_accounts').delete().eq('id', id)
  if (result.error) logger.error(`Delete failed for ${id}`, CTX, result.error)
  return result
}

export const unlinkTransactions = async (accountId) => {
  logger.info(`Unlinking transactions from account ${accountId}`, CTX)
  const result = await supabase.from('debts').update({ account_id: null }).eq('account_id', accountId)
  if (result.error) logger.error(`Unlink failed for account ${accountId}`, CTX, result.error)
  return result
}
