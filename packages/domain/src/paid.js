/** @param {unknown} paid */
export function isSettled(paid) {
  return paid === true || paid === 'true'
}

/** @param {unknown} paid */
export function isUnpaid(paid) {
  return !isSettled(paid)
}
