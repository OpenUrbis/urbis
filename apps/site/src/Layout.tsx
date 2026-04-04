import { Outlet } from 'react-router-dom'
import { UrbisHeader } from '@open-urbis/map-ui/urbis-header'
import { Footer } from './components/layout/Footer'
import { ScrollToTop } from './components/ScrollToTop'

function Layout() {
  const menuItems = [
    { label: 'Mosaico', href: 'https://urbis.prefeitura.sp.gov.br', active: true },
    { label: 'Mapa', href: 'https://mapa.urbis.prefeitura.sp.gov.br' },
    { label: 'Dados Abertos', href: 'https://dadosabertos.urbis.prefeitura.sp.gov.br' },
    { label: 'Legis', href: 'https://docs.urbis.prefeitura.sp.gov.br/docs/legis' },
    { label: 'Viabiliza', href: 'https://viabiliza.urbis.prefeitura.sp.gov.br/docs/legis' },
    { label: 'Doc. técnica', href: 'https://docs.urbis.prefeitura.sp.gov.br/' },
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
