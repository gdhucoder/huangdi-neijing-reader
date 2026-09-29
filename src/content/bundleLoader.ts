import { contentUrl, ensureSafeRelativePath } from '../utils/paths'

export interface RawManifest { format: string; format_version: string; book: string | { src?: string; path?: string }; chapters?: Array<{ id?: string; src?: string; path?: string; content?: string }> }
export interface RawBook { id: string; title: string; subtitle?: string; description?: string; sources?: Array<{ label?: string; value?: string; name?: string; text?: string }>; chapters?: Array<{ id: string; order?: number; collection?: string; title?: string; subtitle?: string; src?: string; path?: string; content?: string; audio?: string }> }
export interface RawChapter {
  id: string; order?: number; collection?: string; title: string; subtitle?: string
  audio?: { src?: string; duration_ms?: number; durationMs?: number }
  segments: Array<{ id: string; order?: number; text: string; speakable?: boolean; speak_enabled?: boolean; start_ms?: number | null; end_ms?: number | null; startMs?: number | null; endMs?: number | null; translation?: string | null; pronunciation?: { tokens?: Array<{ text: string; pinyin?: string | null; confirmed_pinyin?: string | null; reference_pinyin?: string | null }>; tts_actual?: Array<{ text: string; pinyin?: string | null; begin_ms: number; end_ms: number }> } | Array<{ text: string; pinyin?: string | null }>; pronunciation_tokens?: Array<{ text: string; pinyin: string }> }>
}
export interface RawBundle { manifest: RawManifest; book: RawBook; chapters: RawChapter[] }

async function fetchJson<T>(resourcePath: string): Promise<T> {
  const response = await fetch(contentUrl(ensureSafeRelativePath(resourcePath)))
  if (!response.ok) throw new Error(`无法读取内容包资源：${resourcePath}`)
  return response.json() as Promise<T>
}
function resourcePath(value: string | { src?: string; path?: string }): string {
  if (typeof value === 'string') return value
  const path = value.src ?? value.path
  if (!path) throw new Error('内容包缺少资源路径。')
  return path
}
export async function loadRawBundle(): Promise<RawBundle> {
  const manifest = await fetchJson<RawManifest>('manifest.json')
  if (manifest.format !== 'ancient-medical-publication-bundle') throw new Error('当前内容包格式暂不支持。')
  if (manifest.format_version !== '1.0') throw new Error(`当前内容包版本暂不支持：${manifest.format_version || '未知版本'}。`)
  if (!manifest.book) throw new Error('内容包缺少 book 信息。')
  const book = await fetchJson<RawBook>(resourcePath(manifest.book))
  const entries = book.chapters ?? manifest.chapters
  if (!entries?.length) throw new Error('内容包没有可阅读的篇章。')
  const chapters = await Promise.all(entries.map((chapter) => fetchJson<RawChapter>(resourcePath(chapter.content ?? chapter.src ?? chapter.path ?? ''))))
  return { manifest, book, chapters }
}
