import { Outlet } from 'react-router-dom'
import { UrbisHeader } from '@open-urbis/map-ui/urbis-header'
import { Footer } from './components/layout/Footer'
import { ScrollToTop } from './components/ScrollToTop'

function Layout() {
  const menuItems = [
    { label: 'Início', href: '/' },
    { label: 'Mapa', href: 'https://mapa.urbis.sampa.br' },
    { label: 'Viabiliza', href: 'https://viabiliza.urbis.sampa.br' },
    { label: 'Dados Abertos', href: 'https://dadosabertos.urbis.sampa.br' },
    { label: 'Doc. técnica', href: '/doc-tecnica' },
    { label: '+Info', href: '/info-urbis' },
    { label: 'Data Lake', href: 'https://datalake.urbis.sampa.br/' },
    { label: 'Ajuda', href: '/ajuda' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground">
      <ScrollToTop />
      <UrbisHeader 
        logoSrc="https://cdn.prod.website-files.com/67865f11fa887f4b5ad6611a/67939d8b8a93192ceb8c26d0_LOGOTIPO_PREFEITURA_HORIZONTAL_FUNDO_CLARO-p-1080.png"
        logoAlt="Prefeitura de São Paulo"
        logoHref="https://www.prefeitura.sp.gov.br/"
        badgeText={null}
        menuItems={menuItems}
        showLogin={false}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
