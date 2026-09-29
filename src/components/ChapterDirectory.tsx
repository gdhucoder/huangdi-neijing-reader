import { BottomSheet } from './BottomSheet'
import type { ReaderChapter } from '../types/reader'

interface ChapterDirectoryProps {
  open: boolean
  chapters: ReaderChapter[]
  currentChapterId: string
  onClose: () => void
  onSelect: (chapterId: string) => void
}

export function ChapterDirectory({ open, chapters, currentChapterId, onClose, onSelect }: ChapterDirectoryProps) {
  return <BottomSheet open={open} title="章节目录" onClose={onClose}><nav className="chapter-directory" aria-label="章节目录"><ol>{chapters.map((chapter) => <li key={chapter.id}><button className={chapter.id === currentChapterId ? 'selected' : ''} onClick={() => onSelect(chapter.id)} aria-current={chapter.id === currentChapterId ? 'page' : undefined}><span className="chapter-directory-number">{String(chapter.order).padStart(2, '0')}</span><span className="chapter-directory-copy"><strong>{chapter.title}</strong>{chapter.subtitle && <small>{chapter.subtitle}</small>}</span><span className="chapter-directory-mark" aria-hidden="true">{chapter.id === currentChapterId ? '●' : '›'}</span></button></li>)}</ol></nav></BottomSheet>
}
