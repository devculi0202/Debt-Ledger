import { isSettled } from '@/shared/lib/format'

export function computeAccountSummary(account, debts) {
  const linked = debts.filter(
    (d) => String(d.account_id) === String(account.id),
  )
  const settled = linked.filter((d) => isSettled(d.paid))
  const amountPaid = settled.reduce((sum, t) => sum + Number(t.amount), 0)
  const remaining = Math.max(0, account.principal_amount - amountPaid)
  const progressPercent =
    account.principal_amount > 0
      ? Math.min(100, (amountPaid / account.principal_amount) * 100)
      : 0

  return {
    linked,
    settled,
    amountPaid,
    remaining,
    progressPercent,
  }
}
