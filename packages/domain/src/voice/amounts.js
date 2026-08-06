/**
 * Scale / correct VND amounts from model output using Vietnamese unit hints in text.
 */
export function normalizeVndAmount(amount, text) {
  let n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) return n

  const tyMatch = text.match(/(\d+(?:[.,]\d+)?)\s*t[yỷ]/i)
  if (tyMatch) {
    return Math.round(parseFloat(tyMatch[1].replace(',', '.')) * 1_000_000_000)
  }

  const trieuMatch = text.match(/(\d+(?:[.,]\d+)?)\s*tri[eệ]u/i)
  if (trieuMatch) {
    return Math.round(parseFloat(trieuMatch[1].replace(',', '.')) * 1_000_000)
  }

  const nghinMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:ngh[iì]n|ng[aà]n)/i)
  if (nghinMatch) {
    return Math.round(parseFloat(nghinMatch[1].replace(',', '.')) * 1_000)
  }

  // Model returned bare millions count without scaling (e.g. 200 for "200 triệu")
  if (n < 1_000_000 && /tri[eệ]u/i.test(text)) {
    return Math.round(n * 1_000_000)
  }

  return Math.round(n)
}
