import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadRawBundle } from '../src/content/bundleLoader'
describe('bundle loader validation', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('explains an unsupported publication version', async () => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ format: 'ancient-medical-publication-bundle', format_version: '2.0', book: 'book.json' }) })); await expect(loadRawBundle()).rejects.toThrow('当前内容包版本暂不支持') })
  it('rejects format values other than publication bundle', async () => { vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ format: 'unknown', format_version: '1.0', book: 'book.json' }) })); await expect(loadRawBundle()).rejects.toThrow('当前内容包格式暂不支持') })
})
