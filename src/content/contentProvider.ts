import { adaptBundle } from './bundleAdapter'
import { loadRawBundle } from './bundleLoader'
import type { ReaderBook } from '../types/reader'
let cachedBook: Promise<ReaderBook> | undefined
export function getReaderBook(): Promise<ReaderBook> { cachedBook ??= loadRawBundle().then(adaptBundle); return cachedBook }
export function clearReaderBookCache(): void { cachedBook = undefined }
