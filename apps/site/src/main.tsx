import { ViteReactSSG } from 'vite-react-ssg'
import routes from './routes'
import './globals.css'

export const createApp = ViteReactSSG(
  // @ts-expect-error - Vite types mismatch
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  { routes, base: import.meta.env.BASE_URL }
)
