import { formatVND } from '@/shared/lib/format'
import NeuCard from '@/shared/ui/NeuCard'
import { useLocale } from '@/shared/i18n'

export default function SummaryCards({
  net,
  totalReceivables,
  totalLiabilities,
  periodText,
}) {
  const { t } = useLocale()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Dark net position card */}
      <div className="rounded-neu-lg bg-ink text-white p-6 flex flex-col justify-center shadow-neu-drop">
        <p className="text-sm font-medium text-white/70 mb-2">
          {t('transactions.netPosition')}{' '}
          <span className="font-normal text-xs ml-1 opacity-70">{periodText}</span>
        </p>
        <h2
          className={`text-2xl md:text-3xl font-extrabold tracking-tight ${
            net > 0 ? 'text-accent' : net < 0 ? 'text-[#FF8A80]' : 'text-white'
          }`}
        >
          {formatVND(net)}
        </h2>
      </div>

      <NeuCard className="p-6 flex flex-col justify-center">
        <p className="text-sm font-medium text-neu-textMuted mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-positive" />
          {t('transactions.receivables')}
          <span className="font-normal text-xs opacity-70">{periodText}</span>
        </p>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-positive">
          {formatVND(totalReceivables)}
        </h2>
      </NeuCard>

      <NeuCard className="p-6 flex flex-col justify-center">
        <p className="text-sm font-medium text-neu-textMuted mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-negative" />
          {t('transactions.liabilities')}
          <span className="font-normal text-xs opacity-70">{periodText}</span>
        </p>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-negative">
          {formatVND(totalLiabilities)}
        </h2>
      </NeuCard>
    </div>
  )
}
