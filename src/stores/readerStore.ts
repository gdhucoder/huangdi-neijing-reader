import type { ReadingProgress } from '../types/reader'

const progressKey = 'huangdi-neijing-reader-progress-v2'
const legacyProgressKey = 'huangdi-neijing-reader-progress'

function isProgress(value: unknown): value is ReadingProgress {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<ReadingProgress>
  return typeof item.bookId === 'string' && typeof item.chapterId === 'string' && typeof item.segmentId === 'string' && typeof item.audioPositionMs === 'number' && Number.isFinite(item.audioPositionMs)
}

function readStoredMap(): Record<string, ReadingProgress> {
  try {
    const current = JSON.parse(localStorage.getItem(progressKey) ?? 'null') as unknown
    if (current && typeof current === 'object' && !isProgress(current)) {
      return Object.fromEntries(Object.entries(current).filter(([, value]) => isProgress(value)).map(([key, value]) => [key, { ...(value as ReadingProgress), updatedAt: Number((value as ReadingProgress).updatedAt) || 0 }]))
    }
    const legacy = JSON.parse(localStorage.getItem(legacyProgressKey) ?? 'null') as unknown
    return isProgress(legacy) ? { [legacy.bookId]: { ...legacy, updatedAt: Number(legacy.updatedAt) || 0 } } : {}
  } catch {
    return {}
  }
}

export function readAllProgress(): Record<string, ReadingProgress> { return readStoredMap() }

export function readProgress(bookId?: string): ReadingProgress | null {
  const progress = readStoredMap()
  if (bookId) return progress[bookId] ?? null
  return Object.values(progress).sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null
}

export function saveProgress(progress: Omit<ReadingProgress, 'updatedAt'>): void {
  const next = { ...readStoredMap(), [progress.bookId]: { ...progress, updatedAt: Date.now() } }
  localStorage.setItem(progressKey, JSON.stringify(next))
}
