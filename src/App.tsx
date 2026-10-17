import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'

export default function App() {
  useEffect(() => { document.title = '古籍阅读器' }, [])
  return <RouterProvider router={router} />
}
