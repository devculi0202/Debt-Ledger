import { formatVND } from '../../lib/format'
import NeuCard from '../ui/NeuCard'

export default function SummaryCards({
  net,
  totalReceivables,
  totalLiabilities,
  periodText,
}) {
  const netClass =
    net > 0
      ? 'text-brand-positive drop-shadow-sm'
      : net < 0
        ? 'text-brand-negative drop-shadow-sm'
        : 'text-neu-textMain dark:text-darkNeu-textMain'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      <NeuCard className="p-8 flex flex-col justify-center">
        <p className="text-sm font-semibold text-neu-textMuted mb-2">
          Net Position{' '}
          <span className="font-normal text-xs ml-1 opacity-70">
            {periodText}
          </span>
        </p>
        <h2 className={`text-3xl font-bold tracking-tight ${netClass}`}>
          {formatVND(net)}
        </h2>
      </NeuCard>

      <NeuCard className="p-8 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-2 h-full bg-brand-positive/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        <p className="text-sm font-semibold text-neu-textMuted mb-2">
          Receivables{' '}
          <span className="font-normal text-xs ml-1 opacity-70">
            {periodText}
          </span>
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-brand-positive drop-shadow-sm">
          {formatVND(totalReceivables)}
        </h2>
      </NeuCard>

      <NeuCard className="p-8 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-2 h-full bg-brand-negative/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
        <p className="text-sm font-semibold text-neu-textMuted mb-2">
          Liabilities{' '}
          <span className="font-normal text-xs ml-1 opacity-70">
            {periodText}
          </span>
        </p>
        <h2 className="text-3xl font-bold tracking-tight text-brand-negative drop-shadow-sm">
          {formatVND(totalLiabilities)}
        </h2>
      </NeuCard>
    </div>
  )
}
