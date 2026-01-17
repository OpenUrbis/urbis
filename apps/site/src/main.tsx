import { ViteReactSSG } from 'vite-react-ssg'
import routes from './routes'
import './globals.css'

// eslint-disable-next-line turbo/no-undeclared-env-vars
export const createRoot = ViteReactSSG(
  { routes, basename: import.meta.env.BASE_URL }
)
