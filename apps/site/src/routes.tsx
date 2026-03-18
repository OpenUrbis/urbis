import Layout from './Layout'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Ajuda from './pages/Ajuda'
import DocTecnica from './pages/DocTecnica'
import InfoUrbis from './pages/InfoUrbis'
import CartaServicos from './pages/CartaServicos'
import Licencas from './pages/Licencas'
import { RouteObject } from 'react-router-dom'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'ajuda', element: <Ajuda /> },
      { path: 'sobre', element: <About /> },
      { path: 'contato', element: <Contact /> },
      { path: 'doc-tecnica', element: <DocTecnica /> },
      { path: 'info-urbis', element: <InfoUrbis /> },
      { path: 'carta-servicos', element: <CartaServicos /> },
      { path: 'licencas', element: <Licencas /> },
    ],
  },
]

export default routes
