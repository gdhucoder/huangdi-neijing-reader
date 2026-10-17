import { createBrowserRouter } from 'react-router-dom'
import { AboutPage } from '../pages/AboutPage'
import { ChapterPage } from '../pages/ChapterPage'
import { HomePage } from '../pages/HomePage'
import { BookPage } from '../pages/BookPage'
export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/book/:bookId', element: <BookPage /> },
  { path: '/book/:bookId/chapter/:chapterId', element: <ChapterPage /> },
  { path: '/book/:bookId/about', element: <AboutPage /> },
  { path: '/chapter/:chapterId', element: <ChapterPage /> },
  { path: '/about', element: <AboutPage /> },
], { basename: import.meta.env.BASE_URL })
