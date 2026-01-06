import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const links = [
    { label: 'Início', href: '/', external: false },
    { label: 'Mapa', href: 'https://mapa.urbis.sampa.br', external: true },
    { label: 'Viabiliza', href: 'https://viabiliza.urbis.sampa.br', external: true },
    { label: 'Dados Abertos', href: 'https://dadosabertos.urbis.sampa.br', external: true },
    { label: 'Doc. técnica', href: '/doc-tecnica', external: false },
    { label: '+Info', href: '/info-urbis', external: false },
    { label: 'Data Lake', href: 'https://datalake.urbis.sampa.br/', external: true },
    { label: 'Ajuda', href: '/ajuda', external: false },
  ]

  return (
    <div className="sticky top-0 z-50 bg-white shadow-md font-sans">
      <nav className="container mx-auto px-4 py-2 flex items-center justify-between">
        <a href="https://www.prefeitura.sp.gov.br/" target="_blank" rel="noopener noreferrer" className="mr-4">
          <img 
            src="https://cdn.prod.website-files.com/67865f11fa887f4b5ad6611a/67939d8b8a93192ceb8c26d0_LOGOTIPO_PREFEITURA_HORIZONTAL_FUNDO_CLARO-p-1080.png" 
            alt="Prefeitura de São Paulo" 
            className="h-9 w-auto"
          />
        </a>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-6 flex-grow ml-8">
           {links.map((link) => (
             link.external ? (
               <a 
                 key={link.label}
                 href={link.href}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
               >
                 {link.label}
               </a>
             ) : (
               <Link
                 key={link.label}
                 to={link.href}
                 className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
               >
                 {link.label}
               </Link>
             )
           ))}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-2 text-gray-700"
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white shadow-lg lg:hidden flex flex-col p-4 space-y-4">
            {links.map((link) => (
             link.external ? (
               <a 
                 key={link.label}
                 href={link.href}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="text-gray-700 hover:text-blue-600 font-medium block"
                 onClick={() => setIsMenuOpen(false)}
               >
                 {link.label}
               </a>
             ) : (
               <Link
                 key={link.label}
                 to={link.href}
                 className="text-gray-700 hover:text-blue-600 font-medium block"
                 onClick={() => setIsMenuOpen(false)}
               >
                 {link.label}
               </Link>
             )
           ))}
          </div>
        )}
      </nav>
    </div>
  )
}
