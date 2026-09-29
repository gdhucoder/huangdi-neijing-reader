import { createBrowserRouter } from 'react-router-dom'
import { AboutPage } from '../pages/AboutPage'
import { ChapterPage } from '../pages/ChapterPage'
import { HomePage } from '../pages/HomePage'
export const router = createBrowserRouter([{ path: '/', element: <HomePage /> }, { path: '/chapter/:chapterId', element: <ChapterPage /> }, { path: '/about', element: <AboutPage /> }])
