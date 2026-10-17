import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBookCatalog } from '../content/contentProvider'
import type { ReaderBookSummary } from '../types/reader'

export function HomePage() {
  const [books, setBooks] = useState<ReaderBookSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    getBookCatalog().then(setBooks).catch((reason: unknown) => {
      console.error(reason)
      setError(reason instanceof Error ? reason.message : '书库目录无法加载。')
    })
  }, [])
  if (error) return <ErrorScreen message={error} />
  if (!books) return <LoadingScreen />
  return <main className="home page-shell">
    <header className="home-header">
      <p className="eyebrow">Ancient Classics Reader</p>
      <h1>古籍阅读器<em>原文 · 注音 · 朗读</em></h1>
      <p className="intro">选择一本书，进入篇章目录，再开始阅读、听读与跟随朗读。</p>
    </header>
    <section className="book-index" aria-labelledby="book-index-title">
      <div className="section-title"><p id="book-index-title" className="section-label">我的书籍</p><Link to="/about">关于</Link></div>
      <ol>{books.map((book) => <li key={book.id}><Link className="book-card" to={`/book/${book.id}`}><span className="book-card-mark" aria-hidden="true">卷</span><span className="book-card-copy"><strong>{book.title}</strong>{book.subtitle && <small>{book.subtitle}</small>}{book.description && <span>{book.description}</span>}</span><b aria-hidden="true">›</b></Link></li>)}</ol>
    </section>
  </main>
}

export function LoadingScreen() { return <main className="center-state"><p className="eyebrow">古籍阅读器</p><p>正在准备书库…</p></main> }
export function ErrorScreen({ message }: { message: string }) { return <main className="center-state"><p className="eyebrow">古籍阅读器</p><h1>暂时无法打开</h1><p>{message}</p><button onClick={() => window.location.reload()}>重新尝试</button></main> }
