import VoiceDebtInput from './VoiceDebtInput'
import { useTransactionsData } from '../contexts/DataContext'

export default function VoiceDebtInputConnected() {
  const { createFromVoice } = useTransactionsData()

  return (
    <VoiceDebtInput
      onSuccess={async (response) => {
        await createFromVoice(response)
      }}
    />
  )
}
