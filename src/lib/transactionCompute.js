import { isSettled } from './format'

function getMonth(debt) {
  return (debt.transaction_date || debt.created_at.split('T')[0]).substring(0, 7)
}

export function getUniqueMonths(debts) {
  return [...new Set(debts.map(getMonth))].sort().reverse()
}

export function filterTransactions(debts, masterDebts, filters) {
  const { accountId, time: monthFilter, status: statusFilter, q: searchQuery } = filters

  return debts.filter((debt) => {
    const dMonth = getMonth(debt)
    if (monthFilter !== 'all' && dMonth !== monthFilter) return false

    if (accountId && String(debt.account_id) !== String(accountId)) return false

    if (statusFilter === 'active' && isSettled(debt.paid)) return false
    if (statusFilter === 'settled' && !isSettled(debt.paid)) return false

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const noteText = debt.notes ? debt.notes.toLowerCase() : ''
      const personText = debt.person ? debt.person.toLowerCase() : ''
      let accountNameText = ''
      if (debt.account_id) {
        const linkedAcc = masterDebts.find(
          (md) => String(md.id) === String(debt.account_id),
        )
        if (linkedAcc) accountNameText = linkedAcc.name.toLowerCase()
      }
      if (
        !personText.includes(q) &&
        !noteText.includes(q) &&
        !accountNameText.includes(q)
      )
        return false
    }

    return true
  })
}

export function computeTotals(filteredDebts) {
  let totalReceivables = 0
  let totalLiabilities = 0

  filteredDebts.forEach((debt) => {
    if (!isSettled(debt.paid)) {
      if (debt.type === 'owed') totalReceivables += Number(debt.amount)
      if (debt.type === 'owe') totalLiabilities += Number(debt.amount)
    }
  })

  return { totalReceivables, totalLiabilities, net: totalReceivables - totalLiabilities }
}
