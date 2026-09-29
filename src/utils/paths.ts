export function ensureSafeRelativePath(path: string): string {
  const cleaned = path.trim().replace(/^\.\//, '')
  if (!cleaned || cleaned.startsWith('/') || cleaned.includes('\\') || cleaned.split('/').includes('..')) {
    throw new Error('内容包包含不安全的资源路径。')
  }
  return cleaned
}

export function contentBaseUrl(): string {
  const configured = import.meta.env.VITE_CONTENT_BASE_URL?.trim()
  const base = configured || '/books/huangdi-neijing-selected/'
  return base.endsWith('/') ? base : `${base}/`
}

export function contentUrl(path: string): string {
  const safePath = ensureSafeRelativePath(path)
  const base = contentBaseUrl()
  if (/^https?:\/\//i.test(base)) return new URL(safePath, base).toString()
  return `${base}${safePath}`
}
