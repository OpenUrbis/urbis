// apps/site/src/main.tsx (ou main.ts)
import { ViteReactSSG } from 'vite-react-ssg'
import routes from './routes'
import './globals.css'

export const createApp = ViteReactSSG(
  {
    routes,
  }
)

export default createApp
