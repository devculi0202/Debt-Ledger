import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import * as transactionsService from '../api/transactions'
import { mapVoiceDebtToTransaction } from '@/features/voice-debt/lib/voiceDebtMapper'
import { isSettled } from '@/shared/lib/format'
import { queryKeys } from '@/shared/api/queryKeys'
import logger from '@/shared/lib/logger'

async function fetchTransactions() {
  const { data, error } = await transactionsService.fetchAll()
  if (error) {
    logger.error('Database connection failed', 'transactions', error)
    throw error
  }
  return data || []
}

/**
 * Transaction list query. Only fetches while mounted with enabled=true
 * (and a signed-in user).
 */
export function useTransactionsList(session, { enabled = true } = {}) {
  const userId = session?.user?.id
  const query = useQuery({
    queryKey: queryKeys.transactions(userId),
    queryFn: fetchTransactions,
    enabled: Boolean(userId) && enabled,
  })

  return {
    debts: query.data ?? [],
    loading: query.isLoading,
    refetch: query.refetch,
    isError: query.isError,
    error: query.error,
  }
}

/**
 * Mutations only — safe to use from the shell (voice input) without
 * subscribing to / fetching the full transactions list.
 */
export function useTransactionMutations(session) {
  const queryClient = useQueryClient()
  const userId = session?.user?.id
  const key = queryKeys.transactions(userId)

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: key })

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { error } = await transactionsService.create({
        ...payload,
        user_id: userId ?? null,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload, paid }) => {
      const { error } = await transactionsService.update(id, {
        ...payload,
        paid: paid ?? false,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const createManyMutation = useMutation({
    mutationFn: async (payloads) => {
      const rows = payloads.map((p) => ({ ...p, user_id: userId ?? null }))
      const { error } = await transactionsService.createMany(rows)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const togglePaidMutation = useMutation({
    mutationFn: async ({ id, newStatus }) => {
      const { error } = await transactionsService.togglePaid(id, newStatus)
      if (error) throw error
      return { id, newStatus }
    },
    onMutate: async ({ id, newStatus, previousPaid }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old) =>
        (old ?? []).map((d) => (d.id === id ? { ...d, paid: newStatus } : d)),
      )
      return { previous, previousPaid, id }
    },
    onError: (err, _vars, ctx) => {
      logger.error(`Toggle paid failed for ${ctx?.id}`, 'transactions', err)
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
    },
    onSettled: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await transactionsService.remove(id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      queryClient.setQueryData(key, (old) =>
        (old ?? []).filter((d) => d.id !== id),
      )
      return { previous, id }
    },
    onError: (err, id, ctx) => {
      logger.error(`Delete failed for ${id}`, 'transactions', err)
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
    },
    onSettled: invalidate,
  })

  async function create(payload) {
    await createMutation.mutateAsync(payload)
  }

  async function createFromVoice(apiResponse) {
    const payload = mapVoiceDebtToTransaction(apiResponse)
    await create(payload)
  }

  async function update(id, payload, { paid } = {}) {
    await updateMutation.mutateAsync({ id, payload, paid })
  }

  async function togglePaid(id, debts) {
    const debt = debts.find((d) => d.id === id)
    if (!debt) return
    const currentStatus = isSettled(debt.paid)
    const newStatus = !currentStatus
    await togglePaidMutation.mutateAsync({
      id,
      newStatus,
      previousPaid: currentStatus,
    })
  }

  async function createMany(payloads) {
    await createManyMutation.mutateAsync(payloads)
  }

  async function remove(id) {
    await removeMutation.mutateAsync(id)
  }

  return {
    create,
    createFromVoice,
    update,
    togglePaid,
    createMany,
    remove,
  }
}

/**
 * List + mutations for feature pages.
 */
export default function useTransactionsQuery(session, options) {
  const list = useTransactionsList(session, options)
  const mutations = useTransactionMutations(session)

  return {
    ...list,
    ...mutations,
    togglePaid: (id) => mutations.togglePaid(id, list.debts),
  }
}
