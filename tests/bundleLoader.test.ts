import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadRawBundle } from '../src/content/bundleLoader'
describe('bundle loader validation', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('explains an unsupported publication version', async () => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ format: 'ancient-medical-publication-bundle', format_version: '2.0', book: 'book.json' }) })); await expect(loadRawBundle()).rejects.toThrow('当前内容包版本暂不支持') })
  it('rejects format values other than publication bundle', async () => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ format: 'unknown', format_version: '1.0', book: 'book.json' }) })); await expect(loadRawBundle()).rejects.toThrow('当前内容包格式暂不支持') })
  it('uses a new cache key for the Dao De Jing continuous audio metadata', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ format: 'ancient-medical-publication-bundle', format_version: '1.0', book: 'book.json' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'daodejing-v01', title: '道德经', chapters: [{ id: 'chapter', content: 'chapters/chapter.json' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'chapter', title: '篇', segments: [] }) })
    vi.stubGlobal('fetch', fetch)
    await loadRawBundle('daodejing-v01')
    expect(fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/books/daodejing-v01/book.json?v=continuous-audio-1'))
    expect(fetch).toHaveBeenNthCalledWith(3, expect.stringContaining('/books/daodejing-v01/chapters/chapter.json?v=continuous-audio-1'))
  })
  it('rejects a chapter when its audio path disagrees with book.json', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ format: 'ancient-medical-publication-bundle', format_version: '1.0', book: 'book.json' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'book', title: '书', chapters: [{ id: 'chapter', content: 'chapters/chapter.json', audio: 'audio/chapter-002.mp3' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'chapter', title: '篇', audio: { src: 'audio/chapter-001.mp3' }, segments: [] }) }))
    await expect(loadRawBundle('book')).rejects.toThrow('章节音频路径不一致')
  })
  it('rejects a chapter when its order disagrees with book.json', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ format: 'ancient-medical-publication-bundle', format_version: '1.0', book: 'book.json' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'book', title: '书', chapters: [{ id: 'chapter', order: 2, content: 'chapters/chapter.json' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'chapter', order: 1, title: '篇', segments: [] }) }))
    await expect(loadRawBundle('book')).rejects.toThrow('章节顺序不一致')
  })
})
