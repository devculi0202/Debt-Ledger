export const PAGE_SIZE = 10

export function paginate(items, page, pageSize = PAGE_SIZE) {
  const totalCount = items.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalCount,
    totalPages,
  }
}
