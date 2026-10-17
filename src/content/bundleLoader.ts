import { appAssetUrl, contentBaseUrl, contentUrl, ensureSafeRelativePath, DEFAULT_BOOK_ROOT } from '../utils/paths'

export interface RawManifest { format: string; format_version: string; book: string | { src?: string; path?: string }; chapters?: Array<{ id?: string; order?: number; src?: string; path?: string; content?: string; audio?: string }> }
export interface RawBookChapterEntry { id: string; order?: number; collection?: string; title?: string; subtitle?: string; src?: string; path?: string; content?: string; audio?: string }
export interface RawBook { id: string; title: string; subtitle?: string; description?: string; sources?: Array<{ label?: string; value?: string; name?: string; text?: string }>; chapters?: RawBookChapterEntry[] }
export interface RawCatalogEntry { id: string; path: string; title: string; subtitle?: string; description?: string }
export interface RawCatalog { version: string; books: RawCatalogEntry[] }
export interface RawChapter {
  id: string; order?: number; collection?: string; title: string; subtitle?: string
  audio?: { src?: string; duration_ms?: number; durationMs?: number }
  segments: Array<{ id: string; order?: number; text: string; speakable?: boolean; speak_enabled?: boolean; start_ms?: number | null; end_ms?: number | null; startMs?: number | null; endMs?: number | null; translation?: string | null; pronunciation?: { tokens?: Array<{ text: string; pinyin?: string | null; confirmed_pinyin?: string | null; reference_pinyin?: string | null }>; tts_actual?: Array<{ text: string; pinyin?: string | null; begin_ms: number; end_ms: number }> } | Array<{ text: string; pinyin?: string | null }>; pronunciation_tokens?: Array<{ text: string; pinyin: string }> }>
}
export interface RawBundle { manifest: RawManifest; book: RawBook; chapters: RawChapter[]; baseUrl?: string }

async function fetchJson<T>(resourcePath: string, baseUrl?: string): Promise<T> {
  const safePath = ensureSafeRelativePath(resourcePath)
  const response = await fetch(baseUrl ? contentUrl(safePath, baseUrl) : appAssetUrl(safePath))
  if (!response.ok) throw new Error(`无法读取内容包资源：${resourcePath}`)
  return response.json() as Promise<T>
}
function resourcePath(value: string | { src?: string; path?: string }): string {
  if (typeof value === 'string') return value
  const path = value.src ?? value.path
  if (!path) throw new Error('内容包缺少资源路径。')
  return path
}
export async function loadBookCatalog(): Promise<RawCatalog> {
  const catalog = await fetchJson<RawCatalog>('books/catalog.json')
  if (catalog.version !== '1' || !Array.isArray(catalog.books) || catalog.books.length === 0) throw new Error('书库目录格式不正确。')
  const books = catalog.books.map((entry) => {
    if (!entry || typeof entry.id !== 'string' || typeof entry.path !== 'string' || typeof entry.title !== 'string') throw new Error('书库目录包含无效的书籍信息。')
    return { ...entry, path: ensureSafeRelativePath(entry.path) }
  })
  return { version: catalog.version, books }
}

export async function loadRawBundle(root = DEFAULT_BOOK_ROOT): Promise<RawBundle> {
  const baseUrl = contentBaseUrl(root)
  const manifest = await fetchJson<RawManifest>('manifest.json', baseUrl)
  if (manifest.format !== 'ancient-medical-publication-bundle') throw new Error('当前内容包格式暂不支持。')
  if (manifest.format_version !== '1.0') throw new Error(`当前内容包版本暂不支持：${manifest.format_version || '未知版本'}。`)
  if (!manifest.book) throw new Error('内容包缺少 book 信息。')
  const book = await fetchJson<RawBook>(resourcePath(manifest.book), baseUrl)
  const entries = book.chapters ?? manifest.chapters
  if (!entries?.length) throw new Error('内容包没有可阅读的篇章。')
  const chapters = await Promise.all(entries.map(async (entry) => {
    const chapter = await fetchJson<RawChapter>(resourcePath(entry.content ?? entry.src ?? entry.path ?? ''), baseUrl)
    if (entry.id && chapter.id !== entry.id) throw new Error(`章节标识不一致：${entry.id}。`)
    if (entry.order !== undefined && chapter.order !== undefined && entry.order !== chapter.order) throw new Error(`章节顺序不一致：${entry.id}。`)
    if (entry.audio && (!chapter.audio?.src || ensureSafeRelativePath(entry.audio) !== ensureSafeRelativePath(chapter.audio.src))) throw new Error(`章节音频路径不一致：${entry.id}。`)
    return chapter
  }))
  return { manifest, book, chapters, baseUrl }
}
