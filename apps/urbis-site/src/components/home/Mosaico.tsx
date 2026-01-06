import { Search, Rss, ChevronDown } from 'lucide-react'
import * as Accordion from '@radix-ui/react-accordion'
import { useState } from 'react'

export function Mosaico() {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Search:', searchTerm)
    // Implement search logic or redirection
  }

  return (
    <div className="container mx-auto px-4 xl:px-8 py-8 font-sans">
      <div className="relative mb-4 pb-2 w-full">
        <h1 className="font-sans text-[3em] font-[900] text-[#273FF0] tracking-[0.1px] m-0 leading-tight">
          Urbis
        </h1>
        <div className="absolute bottom-0 left-0 h-2 bg-[#273FF0] w-[80%] rounded-[4px]"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
        {/* Coluna 1: 7/12 (approx 58%) */}
        <div className="md:col-span-7 flex flex-col gap-6">
          
          {/* Busca Card */}
          <div className="bg-white rounded shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-transparent">
            <div className="p-3 flex flex-col gap-3">
              <form onSubmit={handleSearch} className="flex flex-col gap-2">
                <label className="font-semibold text-[1.1em] mb-2 block text-gray-900">
                  Busca Direta:
                </label>
                
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     {/* Placeholder for icon if needed inside input, using button outside typically */}
                  </div>
                  <div className="flex items-center border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-[#273FF0] focus-within:border-transparent bg-white">
                     <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Ex: Paulista"
                      className="w-full py-3 px-4 outline-none bg-transparent text-gray-900 placeholder-gray-500"
                      required
                    />
                    <button type="submit" className="p-3 text-gray-500 hover:text-[#273FF0]">
                      <Search size={24} />
                    </button>
                  </div>
                   <div className="absolute top-[-10px] left-3 bg-white px-1 text-xs text-gray-500">
                     Av. Paulista, 1578 (exemplo)
                   </div>
                </div>

                <div className="mt-2 text-[0.9em] text-[#555]">
                  Pesquise por endereço, código tributário do imóvel (SQL, IPTU), coordenadas
                  (latitude e longitude) ou nº de documento emitido pelo Viabiliza.Urbis. <br />
                  <strong>Observação:</strong> para buscas a partir de arquivo georreferenciado, acesse o{' '}
                  <a href="https://mapa.urbis.sampa.br/" target="_blank" rel="noopener noreferrer" className="text-[#273FF0] underline">
                    Mapa.Urbis
                  </a>.
                </div>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Left Column of Inner Grid */}
            <div className="flex flex-col gap-6">
               {/* Viabiliza */}
              <a href="https://viabiliza.urbis.sampa.br" className="group block bg-white rounded shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden border-l-[10px] border-l-[#273FF0] p-4 flex gap-3 text-gray-900 no-underline">
                 <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-[1.5rem] font-bold mb-1 group-hover:text-[#273FF0] transition-colors">Viabiliza</h3>
                    <p className="text-[0.9em] text-gray-600">
                      Principal canal para solicitação ou análise de documentos relacionados aos <strong>licenciamentos edilícios</strong>, de <strong>atividades</strong> e <strong>ambientais</strong> na cidade.
                    </p>
                 </div>
              </a>

              {/* Dados Abertos */}
              <a href="https://dadosabertos.urbis.sampa.br" className="group block bg-white rounded shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden border-l-[10px] border-l-[#273FF0] p-4 flex gap-3 text-gray-900 no-underline">
                 <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-[1.5rem] font-bold mb-1 group-hover:text-[#273FF0] transition-colors">Dados Abertos</h3>
                    <p className="text-[0.9em] text-gray-600">
                      Acesse uma vasta gama de dados urbanos abertos, incluindo informações sobre zoneamento, licenças e muito mais.
                    </p>
                 </div>
              </a>

              {/* OpenUrbis */}
               <a href="https://github.com/OpenUrbis" target="_blank" rel="noopener noreferrer" className="group block bg-white rounded shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden border-l-[10px] border-l-[#273FF0] p-4 flex gap-3 text-gray-900 no-underline relative">
                 <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-[1.5rem] font-bold mb-1 group-hover:text-[#273FF0] transition-colors">OpenUrbis</h3>
                    <p className="text-[0.9em] text-gray-600">
                      Contribua com nosso open-source.
                    </p>
                 </div>
                 <div className="absolute bottom-2 right-2 bg-white text-[#273FF0] text-[15px] px-2 py-1 rounded-full font-bold shadow-sm border border-gray-100">
                   GitHub
                 </div>
              </a>

              {/* Docs Urbis */}
              <a href="https://docs.urbis.sampa.br/" target="_blank" rel="noopener noreferrer" className="group block bg-white rounded shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden border-l-[10px] border-l-[#273FF0] p-4 flex gap-3 text-gray-900 no-underline">
                 <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-[1.5rem] font-bold mb-1 group-hover:text-[#273FF0] transition-colors">Docs.Urbis</h3>
                    <p className="text-[0.9em] text-gray-600">
                      Acesse a documentação técnica do Urbis para desenvolvedores e usuários.
                    </p>
                 </div>
              </a>
            </div>

            {/* Right Column of Inner Grid */}
            <div className="flex flex-col gap-6">
              
              {/* Carta de Serviços */}
              <a href="https://urbis.sampa.br/carta-servicos" className="group block bg-white rounded-md shadow-sm hover:shadow-lg transition-shadow duration-200 border border-gray-200 border-l-[10px] border-l-[#273FF0] p-4 flex items-center gap-3 text-[#273FF0] no-underline">
                 <div className="flex items-center gap-1.5 min-w-max">
                   <svg xmlns="http://www.w3.org/2000/svg" height="48px" width="48px" viewBox="0 -960 960 960" fill="#273FF0">
                      <path d="M300-286q12 0 21-9t9-21q0-12-9-21t-21-9q-12 0-21 9t-9 21q0 12 9 21t21 9Zm0-164q12 0 21-9t9-21q0-12-9-21t-21-9q-12 0-21 9t-9 21q0 12 9 21t21 9Zm0-164q12 0 21-9t9-21q0-12-9-21t-21-9q-12 0-21 9t-9 21q0 12 9 21t21 9Zm132 328h244v-60H432v60Zm0-164h244v-60H432v60Zm0-164h244v-60H432v60ZM180-120q-24 0-42-18t-18-42v-600q0-24 18-42t42-18h600q24 0 42 18t18 42v600q0 24-18 42t-42 18H180Zm0-60h600v-600H180v600Zm0-600v600-600Z" />
                   </svg>
                 </div>
                 <div className="flex flex-col justify-center text-black">
                   <h3 className="m-0 mb-1 text-[1.2em] font-bold leading-tight group-hover:text-[#273FF0] transition-colors">Carta de Serviços urbanísticos, ambientais e culturais</h3>
                   <p className="m-0 text-[0.9em]">Veja onde solicitar autorizações, licenças, certidões etc.</p>
                 </div>
              </a>

              {/* Legislação */}
              <a href="https://urbis.sampa.br/info.urbis" className="group block bg-white rounded-md shadow-sm hover:shadow-lg transition-shadow duration-200 border border-gray-200 border-l-[10px] border-l-[#273FF0] p-4 flex items-center gap-3 text-[#273FF0] no-underline">
                 <div className="flex items-center gap-1.5 min-w-max">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 960 960" fill="#273FF0">
                      <path d="M120 840v-558h247v-92l113-110 113 110v258h247v392H120Zm60-60h106v-106H180v106Zm0-166h106v-106H180v106Zm0-166h106v-106H180v106Zm247 332h106v-106H427v106Zm0-166h106v-106H427v106Zm0-166h106v-106H427v106Zm0-166h106v-106H427v106Zm247 498h106v-106H674v106Zm0-166h106v-106H674v106Z" />
                    </svg>
                 </div>
                 <div className="flex flex-col justify-center text-black">
                   <h3 className="m-0 mb-1 text-[1.2em] font-bold leading-tight group-hover:text-[#273FF0] transition-colors">Legislação urbanística:</h3>
                   <ul className="m-0 text-[0.9em] pl-5 list-disc">
                     <li>Lei de Parcelamento, Uso e Ocupação do Solo - LPUOS</li>
                     <li>Código de Obras e Edificações - COE</li>
                     <li>+informações sobre legislação urbanística - +info.Urbis</li>
                   </ul>
                 </div>
              </a>

               {/* Licenças */}
              <a href="https://urbis.sampa.br/pt/licencas" className="group block bg-white rounded-md shadow-sm hover:shadow-lg transition-shadow duration-200 border border-gray-200 border-l-[10px] border-l-[#273FF0] p-4 flex items-center gap-3 text-[#273FF0] no-underline">
                 <div className="flex items-center gap-1.5 min-w-max">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 960 960" fill="#273FF0">
                      <path d="M120 879v-798l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v798l-60-60-60 60-60-60-60 60-60-60-60 60-60-59.85L360 879l-60-59.85L240 879l-60-59.85L120 879Zm117-215h490v-60H237v60Zm0-154h490v-60H237v60Zm0-155h490v-60H237v60Zm-57 423h600v-596H180v596Zm0-596v596-596Z" />
                    </svg>
                 </div>
                 <div className="flex flex-col justify-center text-black">
                   <h3 className="m-0 mb-1 text-[1.2em] font-bold leading-tight group-hover:text-[#273FF0] transition-colors">Informações sobre licenças emitidas e denúncias</h3>
                   <p className="m-0 text-[0.9em]">Veja onde encontrar informações sobre autorizações, licenças etc. e denunciar irregularidades.</p>
                 </div>
              </a>

            </div>
          </div>
        </div>

         {/* Coluna 2: 5/12 (approx 42%) */}
        <div className="md:col-span-5 flex flex-col gap-6">
           {/* Mapa Urbis */}
           <a href="https://mapa.urbis.sampa.br" className="block relative border border-[#273FF0] rounded overflow-hidden group">
             <div className="relative">
                <div className="absolute bottom-2 right-2 bg-white text-[#273FF0] text-[15px] px-2 py-1 rounded-full font-bold shadow-sm z-10">
                   Mapa.urbis
                 </div>
                 <img src="/images/sp-here-map.webp" alt="Mapa Urbano" className="w-full h-auto block object-cover group-hover:scale-105 transition-transform duration-500" />
                 {/* Fallback color if image missing */}
                 <div className="absolute inset-0 bg-gray-200 -z-10 flex items-center justify-center text-gray-400">Mapa Image</div>
             </div>
           </a>

           {/* Data Lake */}
           <a href="https://datalake.urbis.sampa.br/" target="_blank" rel="noopener noreferrer" className="group block bg-white rounded shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden border-l-[10px] border-l-[#273FF0] p-4 flex gap-3 text-gray-900 no-underline">
                 <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-[1.5rem] font-bold mb-1 group-hover:text-[#273FF0] transition-colors">Data lake</h3>
                    <p className="text-[0.9em] text-gray-600">
                      Acesse o nosso datalake (apenas uso interno)
                    </p>
                 </div>
           </a>
        </div>
      </div>

       {/* FAQ + Novidades */}
       <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
         {/* FAQ (8/12) */}
         <div className="md:col-span-8">
            <div className="bg-white rounded shadow-sm p-5 border border-transparent hover:shadow-md transition-shadow">
               <h4 className="text-[1.2rem] font-bold mb-4 sticky top-0 bg-white z-10">Perguntas Frequentes:</h4>
               
               <Accordion.Root type="multiple" className="space-y-2">
                 <Accordion.Item value="item-1" className="border-b border-gray-200 last:border-0">
                   <Accordion.Header>
                     <Accordion.Trigger className="flex items-center justify-between w-full py-3 text-left font-medium text-gray-800 hover:text-[#273FF0] transition-colors group">
                       O que é o Data Urbs?
                       <ChevronDown className="group-data-[state=open]:rotate-180 transition-transform duration-200" size={18} />
                     </Accordion.Trigger>
                   </Accordion.Header>
                   <Accordion.Content className="text-gray-600 pb-3 text-sm leading-relaxed overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                     O Data Urbs é um projeto de software open source focado em urbanismo para a cidade de São Paulo.
                   </Accordion.Content>
                 </Accordion.Item>

                 <Accordion.Item value="item-2" className="border-b border-gray-200 last:border-0">
                   <Accordion.Header>
                     <Accordion.Trigger className="flex items-center justify-between w-full py-3 text-left font-medium text-gray-800 hover:text-[#273FF0] transition-colors group">
                       Como posso contribuir para o projeto?
                       <ChevronDown className="group-data-[state=open]:rotate-180 transition-transform duration-200" size={18} />
                     </Accordion.Trigger>
                   </Accordion.Header>
                   <Accordion.Content className="text-gray-600 pb-3 text-sm leading-relaxed overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                     Você pode contribuir reportando bugs, sugerindo funcionalidades ou desenvolvendo código no GitHub.
                   </Accordion.Content>
                 </Accordion.Item>

                 <Accordion.Item value="item-3" className="border-b border-gray-200 last:border-0">
                   <Accordion.Header>
                     <Accordion.Trigger className="flex items-center justify-between w-full py-3 text-left font-medium text-gray-800 hover:text-[#273FF0] transition-colors group">
                       Onde encontro mais dados sobre urbanismo?
                       <ChevronDown className="group-data-[state=open]:rotate-180 transition-transform duration-200" size={18} />
                     </Accordion.Trigger>
                   </Accordion.Header>
                   <Accordion.Content className="text-gray-600 pb-3 text-sm leading-relaxed overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                     Além do Data Urbs, consulte o Plano Diretor, o Código de Obras e o site da Prefeitura de São Paulo.
                   </Accordion.Content>
                 </Accordion.Item>
               </Accordion.Root>
            </div>
         </div>

         {/* Novidades (4/12) */}
         <div className="md:col-span-4">
            <div className="bg-white rounded shadow-sm p-4 sticky top-4 border border-transparent hover:shadow-md transition-shadow">
               <div className="flex items-center gap-2 bg-white sticky top-0 mb-4 pb-2 border-b border-gray-100">
                  <Rss className="text-[#273FF0]" size={24} />
                  <h4 className="text-[1.2rem] font-bold">Novidades</h4>
               </div>
               <div className="flex flex-col gap-4">
                  <div className="group block bg-white rounded shadow-sm hover:shadow hover:translate-y-[-2px] transition-all duration-200 border-l-[6px] border-l-gray-200 p-3 flex gap-3">
                     <div className="flex-1">
                        <h3 className="text-[0.9rem] font-bold mb-1 text-gray-900 group-hover:text-[#273FF0] transition-colors">Atualizações do Data Urbs</h3>
                        <p className="text-[0.8em] text-gray-600 leading-tight">
                          Fique por dentro das últimas novidades e melhorias no projeto Data Urbs.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
       </div>

    </div>
  )
}
