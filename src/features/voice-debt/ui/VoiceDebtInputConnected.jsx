import VoiceDebtInput from './VoiceDebtInput'
import { useSessionData } from '@/app/providers/DataProvider'
import { useTransactionMutations } from '@/features/transactions/hooks/useTransactionsQuery'

/**
 * Shell-level voice entry: mutations only — does not subscribe to the
 * transactions list (Reminders route stays free of debt fetches).
 */
export default function VoiceDebtInputConnected({ variant = 'fab' }) {
  const session = useSessionData()
  const { createFromVoice } = useTransactionMutations(session)

  return (
    <VoiceDebtInput
      variant={variant}
      onSuccess={async (response) => {
        await createFromVoice(response)
      }}
    />
  )
}
