import { ViteReactSSG } from 'vite-react-ssg'
import routes from './routes'
import './globals.css'

export const createApp = ViteReactSSG(
  // @ts-ignore
  { routes, base: import.meta.env.BASE_URL }
)
