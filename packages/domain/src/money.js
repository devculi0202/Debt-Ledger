/** Format amount as Vietnamese đồng. */
export function formatVND(amount) {
  try {
    return Number(amount).toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
    })
  } catch {
    return String(amount)
  }
}
