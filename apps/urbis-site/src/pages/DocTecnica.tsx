import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'

export default function DocTecnica() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#f4f4f4]">
      {/* Fixed Header */}
      <header className="flex items-center justify-center fixed top-0 left-0 w-full h-[60px] bg-[#f5f5f5] z-[1000] border-b border-gray-200">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute left-[10px] bg-none border-none text-[16px] cursor-pointer hover:bg-[#bdbdbd] p-2 rounded transition-colors"
        >
          Voltar
        </button>
        <h1 className="m-0 text-[18px] font-bold">Documentação Técnica</h1>
      </header>

      {/* Main Content */}
      <main className="flex flex-col justify-center items-center min-h-[calc(100vh-60px)] mt-[60px] text-center p-4">
        <p className="mb-[20px] text-[18px] text-[#333] max-w-[80%]">
          O projeto Urbis possui documentação técnica completa e é Open Source. Conheça mais em:
        </p>
        <div className="flex gap-[20px]">
          <a 
            href="https://docs.urbis.sampa.br" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-[30px] py-[15px] text-[16px] no-underline text-white bg-[#28a745] rounded-[5px] transition-colors hover:bg-[#218838]"
          >
            Docs.Urbis
          </a>
          <a 
            href="https://github.com/OpenUrbis" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-[30px] py-[15px] text-[16px] no-underline text-white bg-[#28a745] rounded-[5px] transition-colors hover:bg-[#218838]"
          >
             OpenUrbis (GitHub)
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
