import { supabase } from '../lib/supabase'

export const fetchAll = () =>
  supabase.from('debt_accounts').select('*').order('created_at', { ascending: false })

export const create = (payload, userId) =>
  supabase.from('debt_accounts').insert([{ ...payload, user_id: userId }])

export const update = (id, payload) =>
  supabase.from('debt_accounts').update(payload).eq('id', id)

export const remove = (id) =>
  supabase.from('debt_accounts').delete().eq('id', id)

export const unlinkTransactions = (accountId) =>
  supabase.from('debts').update({ account_id: null }).eq('account_id', accountId)
