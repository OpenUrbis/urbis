import { Outlet, Link } from 'react-router-dom'

function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans antialiased text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
            <Link to="/" className="mr-6 flex items-center space-x-2 font-bold">Urbis</Link>
            <nav className="flex items-center gap-4 text-sm lg:gap-6">
                <Link to="/sobre" className="transition-colors hover:text-foreground/80 text-foreground/60">Sobre</Link>
                <Link to="/contato" className="transition-colors hover:text-foreground/80 text-foreground/60">Contato</Link>
            </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                © 2024 Urbis. Todos os direitos reservados.
            </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
