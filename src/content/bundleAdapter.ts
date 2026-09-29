import type { RawBook, RawBundle, RawChapter } from './bundleLoader'
import { isValidTimeline } from '../audio/timeline'
import type { ReaderBook, ReaderChapter, ReaderSegment, SourceMetadata } from '../types/reader'
import { contentUrl } from '../utils/paths'
function adaptSources(sources: RawBook['sources']): SourceMetadata[] { return (sources ?? []).flatMap((source) => { const label = source.label ?? source.name; const value = source.value ?? source.text; return label && value ? [{ label, value }] : [] }) }
function adaptChapter(raw: RawChapter): ReaderChapter {
  const segments: ReaderSegment[] = raw.segments.map((segment, index) => ({ id: segment.id, order: segment.order ?? index + 1, text: segment.text, speakable: segment.speakable ?? true, startMs: segment.start_ms ?? segment.startMs ?? null, endMs: segment.end_ms ?? segment.endMs ?? null, translation: segment.translation ?? undefined, pronunciationTokens: segment.pronunciation ?? segment.pronunciation_tokens }))
  const audioPath = raw.audio?.src
  return { id: raw.id, order: raw.order ?? 0, collection: raw.collection, title: raw.title, subtitle: raw.subtitle, audioUrl: audioPath ? contentUrl(audioPath) : undefined, audioDurationMs: raw.audio?.duration_ms ?? raw.audio?.durationMs, timelineValid: isValidTimeline(segments), segments }
}
export function adaptBundle(bundle: RawBundle): ReaderBook {
  const byId = new Map(bundle.chapters.map((chapter) => [chapter.id, chapter]))
  const ordered = bundle.book.chapters?.length ? bundle.book.chapters.map((entry) => byId.get(entry.id)).filter((chapter): chapter is RawChapter => Boolean(chapter)) : bundle.chapters
  return { id: bundle.book.id, title: bundle.book.title, subtitle: bundle.book.subtitle, description: bundle.book.description, sources: adaptSources(bundle.book.sources), chapters: ordered.map(adaptChapter).sort((a, b) => a.order - b.order) }
}
