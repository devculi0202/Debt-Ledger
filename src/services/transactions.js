import { supabase } from '../lib/supabase'

export const fetchAll = () =>
  supabase.from('debts').select('*').order('created_at', { ascending: false })

export const create = (payload) =>
  supabase.from('debts').insert([{ ...payload, paid: false }])

export const update = (id, payload) =>
  supabase.from('debts').update(payload).eq('id', id)

export const togglePaid = (id, newStatus) =>
  supabase.from('debts').update({ paid: newStatus }).eq('id', id)

export const remove = (id) =>
  supabase.from('debts').delete().eq('id', id)
