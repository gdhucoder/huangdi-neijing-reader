import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'

export default function App() {
  useEffect(() => { document.title = '经典诵读' }, [])
  return <RouterProvider router={router} />
}
