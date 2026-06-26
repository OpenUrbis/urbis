// apps/site/src/main.tsx (ou main.ts)
import { setUrbisConfig } from '@open-urbis/map-ui'
import { ViteReactSSG } from 'vite-react-ssg'
import routes from './routes'
import './globals.css'

setUrbisConfig({
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
})

export const createRoot = ViteReactSSG({
  routes,
})
