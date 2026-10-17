import { adaptBundle } from './bundleAdapter'
import { loadBookCatalog, loadRawBundle } from './bundleLoader'
import type { ReaderBook, ReaderBookSummary } from '../types/reader'
import { DEFAULT_BOOK_ID } from '../utils/paths'

let cachedCatalog: Promise<ReaderBookSummary[]> | undefined
const cachedBooks = new Map<string, Promise<ReaderBook>>()

export function getBookCatalog(): Promise<ReaderBookSummary[]> {
  cachedCatalog ??= loadBookCatalog().then((catalog) => catalog.books)
  return cachedCatalog
}

export function getReaderBook(bookId = DEFAULT_BOOK_ID): Promise<ReaderBook> {
  const cached = cachedBooks.get(bookId)
  if (cached) return cached
  const book = getBookCatalog().then((catalog) => {
    const entry = catalog.find((candidate) => candidate.id === bookId)
    if (!entry) throw new Error('未找到这本书。')
    return loadRawBundle(entry.path).then(adaptBundle)
  })
  cachedBooks.set(bookId, book)
  return book
}

export function clearReaderBookCache(): void {
  cachedCatalog = undefined
  cachedBooks.clear()
}
