export const formatVND = (amount) =>
  Number(amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })

export const isSettled = (paid) => paid === true || paid === 'true'
