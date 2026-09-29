import type { RawBook, RawBundle, RawChapter } from './bundleLoader'
import { isValidTimeline } from '../audio/timeline'
import type { ReaderBook, ReaderChapter, ReaderSegment, SourceMetadata } from '../types/reader'
import { contentUrl } from '../utils/paths'
function adaptSources(sources: RawBook['sources']): SourceMetadata[] { return (sources ?? []).flatMap((source) => { const label = source.label ?? source.name; const value = source.value ?? source.text; return label && value ? [{ label, value }] : [] }) }
function adaptChapter(raw: RawChapter): ReaderChapter {
  const segments: ReaderSegment[] = raw.segments.map((segment, index) => {
    const pronunciationRecord = !Array.isArray(segment.pronunciation) ? segment.pronunciation : undefined
    const pronunciation = pronunciationRecord?.tokens ?? (Array.isArray(segment.pronunciation) ? segment.pronunciation : segment.pronunciation_tokens)
    const pronunciationTokens = pronunciation?.map((token) => { const record = token as { text: string; pinyin?: string | null; confirmed_pinyin?: string | null; reference_pinyin?: string | null }; return { text: record.text, pinyin: record.confirmed_pinyin ?? record.reference_pinyin ?? record.pinyin ?? '' } })
    const pronunciationTimings = pronunciationRecord?.tts_actual?.filter((timing) => timing.text.length > 0 && Number.isFinite(timing.begin_ms) && Number.isFinite(timing.end_ms) && timing.end_ms > timing.begin_ms).map((timing) => ({ text: timing.text, startMs: timing.begin_ms, endMs: timing.end_ms }))
    return { id: segment.id, order: segment.order ?? index + 1, text: segment.text, speakable: segment.speakable ?? segment.speak_enabled ?? true, startMs: segment.start_ms ?? segment.startMs ?? null, endMs: segment.end_ms ?? segment.endMs ?? null, translation: segment.translation ?? undefined, pronunciationTokens, pronunciationTimings }
  })
  const audioPath = raw.audio?.src
  return { id: raw.id, order: raw.order ?? 0, collection: raw.collection, title: raw.title, subtitle: raw.subtitle, audioUrl: audioPath ? contentUrl(audioPath) : undefined, audioDurationMs: raw.audio?.duration_ms ?? raw.audio?.durationMs, timelineValid: isValidTimeline(segments), segments }
}
export function adaptBundle(bundle: RawBundle): ReaderBook {
  const byId = new Map(bundle.chapters.map((chapter) => [chapter.id, chapter]))
  const ordered = bundle.book.chapters?.length ? bundle.book.chapters.map((entry) => byId.get(entry.id)).filter((chapter): chapter is RawChapter => Boolean(chapter)) : bundle.chapters
  return { id: bundle.book.id, title: bundle.book.title, subtitle: bundle.book.subtitle, description: bundle.book.description, sources: adaptSources(bundle.book.sources), chapters: ordered.map(adaptChapter).sort((a, b) => a.order - b.order) }
}
