import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getReaderBook } from '../content/contentProvider'
import { readProgress } from '../stores/readerStore'
import type { ReaderBook, ReadingProgress } from '../types/reader'
import { ErrorScreen, LoadingScreen } from './HomePage'

export function BookPage() {
  const { bookId } = useParams()
  const [book, setBook] = useState<ReaderBook | null>(null)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!bookId) return
    getReaderBook(bookId).then((loadedBook) => { setBook(loadedBook); setProgress(readProgress(loadedBook.id)) }).catch((reason: unknown) => {
      console.error(reason)
      setError(reason instanceof Error ? reason.message : '内容包无法加载。')
    })
  }, [bookId])
  useEffect(() => {
    const update = () => { if (book) setProgress(readProgress(book.id)) }
    window.addEventListener('focus', update)
    return () => window.removeEventListener('focus', update)
  }, [book])
  if (error) return <ErrorScreen message={error} />
  if (!book) return <LoadingScreen />
  const currentChapter = book.chapters.find((chapter) => chapter.id === progress?.chapterId)
  const currentSegment = currentChapter?.segments.find((segment) => segment.id === progress?.segmentId)
  return <main className="book-page page-shell">
    <Link to="/" className="back-link">‹ 返回书库</Link>
    <header className="book-page-header"><p className="eyebrow">{book.subtitle ?? '古籍篇章'}</p><h1>{book.title}</h1>{book.description && <p className="intro">{book.description}</p>}</header>
    {currentChapter && currentSegment && <section className="continue-reading"><p className="section-label">继续阅读</p><h2>{currentChapter.title}</h2><p>“{currentSegment.text.slice(0, 18)}{currentSegment.text.length > 18 ? '…' : ''}”</p><Link to={`/book/${bookId}/chapter/${currentChapter.id}`} state={{ restoreProgress: true }} className="continue-link">继续阅读</Link></section>}
    <section className="chapter-index"><div className="section-title"><p className="section-label">篇章目录</p><Link to={`/book/${bookId}/about`}>内容说明</Link></div><ol>{book.chapters.map((chapter) => <li key={chapter.id}><Link to={`/book/${bookId}/chapter/${chapter.id}`}><span className="chapter-number">{String(chapter.order).padStart(2, '0')}</span><span><strong>{chapter.title}</strong>{chapter.subtitle && <small>{chapter.subtitle}</small>}</span><b aria-hidden="true">›</b></Link></li>)}</ol></section>
  </main>
}
