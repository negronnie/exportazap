// Splits the rows of the range into screenshots (ADR 0003): whole rows only, so no message is cut
// between two images, and a date chip never ends a page apart from the messages of its day.

export interface MeasuredRow {
  height: number
  /** A date chip: it goes with the row after it. */
  sticky?: boolean
}

/**
 * Groups row indexes into pages of at most `firstHeight` (the first page) and `height` (the others).
 * A row taller than a page gets a page of its own, taller than the rest.
 */
export function paginate(rows: MeasuredRow[], height: number, firstHeight = height): number[][] {
  const pages: number[][] = []
  let page: number[] = []
  let used = 0
  const limit = () => (pages.length === 0 ? firstHeight : height)

  rows.forEach((row, index) => {
    if (page.length > 0 && used + row.height > limit()) {
      // Carry a trailing date chip over to the next page with its messages.
      const carried: number[] = []
      while (page.length > 1 && rows[page[page.length - 1]].sticky) carried.unshift(page.pop()!)
      pages.push(page)
      page = carried
      used = carried.reduce((sum, i) => sum + rows[i].height, 0)
    }
    page.push(index)
    used += row.height
  })
  if (page.length > 0) pages.push(page)
  return pages
}
