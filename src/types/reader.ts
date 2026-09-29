export interface PronunciationToken {
  text: string
  pinyin: string
}

export interface PronunciationTiming {
  text: string
  startMs: number
  endMs: number
}

export interface ReaderSegment {
  id: string
  order: number
  text: string
  speakable: boolean
  startMs: number | null
  endMs: number | null
  translation?: string
  pronunciationTokens?: PronunciationToken[]
  pronunciationTimings?: PronunciationTiming[]
}

export interface ReaderChapter {
  id: string
  order: number
  collection?: string
  title: string
  subtitle?: string
  audioUrl?: string
  audioDurationMs?: number
  timelineValid: boolean
  segments: ReaderSegment[]
}

export interface SourceMetadata {
  label: string
  value: string
}

export interface ReaderBook {
  id: string
  title: string
  subtitle?: string
  description?: string
  sources: SourceMetadata[]
  chapters: ReaderChapter[]
}

export interface ReadingProgress {
  bookId: string
  chapterId: string
  segmentId: string
  audioPositionMs: number
  updatedAt: number
}

export interface ReaderSettings {
  fontSize: number
  showPinyin: boolean
  autoFollow: boolean
  playbackRate: number
}
