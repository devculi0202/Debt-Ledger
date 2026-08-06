import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import * as debtAccountsService from '../api/debtAccounts'
import { queryKeys } from '@/shared/api/queryKeys'
import logger from '@/shared/lib/logger'

async function fetchMasterDebts() {
  const { data, error } = await debtAccountsService.fetchAll()
  if (error) {
    logger.error('Failed to fetch accounts', 'useMasterDebts', error)
    throw error
  }
  return data || []
}

/**
 * Master accounts list query. Fetches only while mounted + enabled.
 */
export function useMasterDebtsList(session, { enabled = true } = {}) {
  const userId = session?.user?.id
  const query = useQuery({
    queryKey: queryKeys.masterDebts(userId),
    queryFn: fetchMasterDebts,
    enabled: Boolean(userId) && enabled,
  })

  return {
    masterDebts: query.data ?? [],
    loading: query.isLoading,
    refetch: query.refetch,
    isError: query.isError,
    error: query.error,
  }
}

export function useMasterDebtMutations(session) {
  const queryClient = useQueryClient()
  const userId = session?.user?.id
  const accountsKey = queryKeys.masterDebts(userId)
  const transactionsKey = queryKeys.transactions(userId)

  const invalidateAccounts = () =>
    queryClient.invalidateQueries({ queryKey: accountsKey })

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { error } = await debtAccountsService.create(payload, userId)
      if (error) throw error
    },
    onSuccess: invalidateAccounts,
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { error } = await debtAccountsService.update(id, payload)
      if (error) throw error
    },
    onSuccess: invalidateAccounts,
  })

  const removeMutation = useMutation({
    mutationFn: async (id) => {
      await debtAccountsService.unlinkTransactions(id)
      const { error } = await debtAccountsService.remove(id)
      if (error) throw error
    },
    onSuccess: async () => {
      await invalidateAccounts()
      // Unlink may have changed account_id on debts
      await queryClient.invalidateQueries({ queryKey: transactionsKey })
    },
  })

  return {
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    remove: (id) => removeMutation.mutateAsync(id),
  }
}

export default function useMasterDebtsQuery(session, options) {
  const list = useMasterDebtsList(session, options)
  const mutations = useMasterDebtMutations(session)

  return {
    ...list,
    ...mutations,
  }
}
