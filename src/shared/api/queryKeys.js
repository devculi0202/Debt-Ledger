export const queryKeys = {
  transactions: (userId) => ['transactions', userId ?? 'anon'],
  masterDebts: (userId) => ['masterDebts', userId ?? 'anon'],
}
