export function ensureSafeRelativePath(path: string): string {
  const cleaned = path.trim().replace(/^\.\//, '')
  if (!cleaned || cleaned.startsWith('/') || cleaned.includes('\\') || cleaned.split('/').includes('..')) {
    throw new Error('内容包包含不安全的资源路径。')
  }
  return cleaned
}

export const DEFAULT_BOOK_ID = 'huangdi-neijing-selected-v01'
export const DEFAULT_BOOK_ROOT = DEFAULT_BOOK_ID

function appBaseUrl(): string {
  return import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`
}

export function appAssetUrl(path: string): string {
  return `${appBaseUrl()}${ensureSafeRelativePath(path)}`
}

export function contentBaseUrl(root = DEFAULT_BOOK_ROOT): string {
  const configured = import.meta.env.VITE_CONTENT_BASE_URL?.trim()
  const base = configured && root === DEFAULT_BOOK_ROOT ? configured : `${appBaseUrl()}books/${ensureSafeRelativePath(root)}/`
  return base.endsWith('/') ? base : `${base}/`
}

export function contentUrl(path: string, base = contentBaseUrl()): string {
  const safePath = ensureSafeRelativePath(path)
  if (/^https?:\/\//i.test(base)) return new URL(safePath, base).toString()
  return `${base}${safePath}`
}
