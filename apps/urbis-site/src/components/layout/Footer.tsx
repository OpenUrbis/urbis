import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-[#273ff0] text-[#f0f0f0] pt-[42px] pb-[40px] font-sans">
      <div className="container mx-auto px-4">
        <h1 className="text-[#273ff0] text-[9vw] font-[1000] leading-none m-0 px-3 h-auto" style={{ WebkitTextStroke: '2px #fff', fontVariationSettings: '"wght" 1000, "wdth" 125' }}>URBIS'SP</h1>

        {/* INICIO */}
        <div className="flex justify-end mt-12 mb-6">
          <div className="text-right">
            <h2 className="text-white font-black text-[2.5em] tracking-[0.2em] mb-4">
              <a href="https://urbis.sampa.br/pt/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline hover:text-[#cbdcff]">INÍCIO</a>
            </h2>
            <ul className="flex gap-5 list-none justify-end">
              <li><Link to="/" className="text-[#eee] font-semibold text-shadow-sm transition-colors px-3 py-1.5 rounded-md hover:text-[#0022bb] hover:bg-white hover:border hover:border-white hover:font-bold hover:no-underline">Home</Link></li>
              <li><Link to="/sobre" className="text-[#eee] font-semibold text-shadow-sm transition-colors px-3 py-1.5 rounded-md hover:text-[#0022bb] hover:bg-white hover:border hover:border-white hover:font-bold hover:no-underline">Sobre</Link></li>
              <li><a href="https://viabiliza.urbis.sampa.br/sign-up" target="_blank" rel="noopener noreferrer" className="text-[#eee] font-semibold text-shadow-sm transition-colors px-3 py-1.5 rounded-md hover:text-[#0022bb] hover:bg-white hover:border hover:border-white hover:font-bold hover:no-underline">Cadastro</a></li>
              <li><a href="mailto:codata@prefeitura.sp.gov.br" target="_blank" rel="noopener noreferrer" className="text-[#eee] font-semibold text-shadow-sm transition-colors px-3 py-1.5 rounded-md hover:text-[#0022bb] hover:bg-white hover:border hover:border-white hover:font-bold hover:no-underline">Contato</a></li>
            </ul>
          </div>
        </div>

        <div className="w-full h-px bg-white my-2.5 mx-auto"></div>

        {/* MAPA.URBIS */}
        <div className="flex justify-end mt-3 mb-6">
          <div className="text-right">
             <h2 className="text-white font-black text-[2.5em] tracking-[0.2em] mb-1">
              <a href="https://mapa.urbis.sampa.br" target="_blank" rel="noopener noreferrer" className="text-white hover:underline hover:text-[#cbdcff]">MAPA.URBIS</a>
            </h2>
          </div>
        </div>
        <div className="px-1 mb-6">
          <p className="text-white text-base font-normal leading-6 tracking-[0.25px] mt-1">
            Mapa online para uma base de dados espaciais integrada com foco em dados urbanos, destinada a subsidiar o planejamento e a avaliação de políticas públicas pelos órgãos e entes governamentais, e que utiliza tecnologias de manutenção inteligente, com diversas ferramentas de consulta e prospecção, incluindo buscas por geometrias personalizadas, e personalização da exibição.
          </p>
        </div>

        <div className="w-full h-px bg-white my-2.5 mx-auto"></div>

        {/* VIABILIZA.URBIS */}
        <div className="flex justify-end mt-3 mb-6">
           <div className="text-right">
             <h2 className="text-white font-black text-[2.5em] tracking-[0.2em] mb-1">
              <a href="https://viabiliza.urbis.sampa.br/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline hover:text-[#cbdcff]">VIABILIZA.URBIS</a>
            </h2>
          </div>
        </div>
        <div className="px-1 mb-8">
          <p className="text-white text-base font-normal leading-6 tracking-[0.25px] mt-1">
            Totalmente integrado com as pesquisas do Mapa.Urbi, o Viabiliza.Urbis informa para uma determinada área, um conjunto de informações relevantes para o planejamento e acompanhamento de atividades urbanísticas, como a situação de tombamento, contaminação do solo, preservação ambiental, zoneamento, áreas de risco, alagamentos, faixas não edificáveis entre outras.
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-6">
          <div>
            <ul className="list-none pl-0">
              <li className="mb-2.5">
                <a href="https://legislacao.prefeitura.sp.gov.br/leis/lei-16402-de-22-de-marco-de-2016/consolidado" target="_blank" rel="noopener noreferrer" className="text-white text-[15px] leading-[22px] px-3 py-1.5 rounded-md hover:text-[#0022bb] hover:bg-white transition-all font-medium inline-block">
                  Lei de Parcelamento, Uso e Ocupação do Solo - LPUOS
                </a>
              </li>
            </ul>
          </div>
          <div>
            <ul className="list-none pl-0">
              <li className="mb-2.5">
                 <a href="https://legislacao.prefeitura.sp.gov.br/leis/lei-16642-de-09-de-maio-de-2017/consolidado" target="_blank" rel="noopener noreferrer" className="text-white text-[15px] leading-[22px] px-3 py-1.5 rounded-md hover:text-[#0022bb] hover:bg-white transition-all font-medium inline-block">
                  Código de Obras e Edificações - COE
                </a>
              </li>
            </ul>
          </div>
          <div>
             <ul className="list-none pl-0">
              <li className="mb-2.5">
                 <a href="https://urbis.sampa.br/info.urbis" target="_blank" rel="noopener noreferrer" className="text-white text-[15px] leading-[22px] px-3 py-1.5 rounded-md hover:text-[#0022bb] hover:bg-white transition-all font-medium inline-block">
                  +informações sobre legislação urbanística
                </a>
              </li>
            </ul>
          </div>
          <div>
             <ul className="list-none pl-0">
              <li className="mb-2.5">
                 <Link to="/carta-servicos" className="text-white text-[15px] leading-[22px] px-3 py-1.5 rounded-md hover:text-[#0022bb] hover:bg-white transition-all font-medium inline-block">
                  Carta de Serviços Urbanísticos, ambientais e culturais
                </Link>
              </li>
              <li className="mb-2.5">
                 <Link to="/licencas" className="text-white text-[15px] leading-[22px] px-3 py-1.5 rounded-md hover:text-[#0022bb] hover:bg-white transition-all font-medium inline-block">
                  Informações sobre licenças emitidas e denúncias
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="w-full h-px bg-white my-2.5 mx-auto"></div>

        {/* DADOS ABERTOS */}
        <div className="flex justify-end mt-3 mb-6">
           <div className="text-right">
             <h2 className="text-white font-black text-[2.5em] tracking-[0.2em] mb-1">
              <a href="https://dadosabertos.urbis.sampa.br/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline hover:text-[#cbdcff]">DADOS ABERTOS</a>
            </h2>
          </div>
        </div>
        <div className="px-1 mb-6">
          <p className="text-white text-base font-normal leading-6 tracking-[0.25px] mt-1">
            Através da interface amigável do CKAN, os usuários poderão buscar, visualizar, encontrar explicações técnicas, de maneira acessível e transparente, assim como baixar dados em formatos abertos, permitindo uma integração direta com outras ferramentas e promovendo a reutilização das informações por diversos setores da sociedade, incluindo pesquisadores, desenvolvedores e gestores públicos.
          </p>
        </div>

        <div className="w-full h-px bg-white my-2.5 mx-auto"></div>

        {/* DOCS URBIS */}
        <div className="flex justify-end mt-3 mb-6">
           <div className="text-right">
             <h2 className="text-white font-black text-[2.5em] tracking-[0.2em] mb-1">
              <a href="https://docs.urbis.sampa.br/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline hover:text-[#cbdcff]">DOCS URBIS</a>
            </h2>
          </div>
        </div>
        <div className="px-1 mb-6">
           <p className="text-white text-base font-normal leading-6 tracking-[0.25px] mt-1">
            O sistema possui documentação detalhada e é de código aberto, promovendo a colaboração e melhoria contínua.
          </p>
        </div>

        <div className="w-full h-px bg-white my-2.5 mx-auto"></div>

        {/* OPEN URBIS */}
        <div className="flex justify-end mt-3 mb-6">
           <div className="text-right">
             <h2 className="text-white font-black text-[2.5em] tracking-[0.2em] mb-1">
              <a href="https://github.com/OpenUrbis" target="_blank" rel="noopener noreferrer" className="text-white hover:underline hover:text-[#cbdcff]">OPEN URBIS</a>
            </h2>
          </div>
        </div>
        <div className="px-1 mb-8">
           <p className="text-white text-base font-normal leading-6 tracking-[0.25px] mt-1">
            Publicação do projeto no GitHub.
          </p>
        </div>

        {/* Prefeitura Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 border-t border-white/30 pt-8 pb-6 text-white text-sm">
          <div>
            <h6 className="font-bold mb-2.5 text-xl">Prefeitura de São Paulo</h6>
            <ul className="space-y-1.5">
              <li><a href="https://capital.sp.gov.br/agenda-do-prefeito" className="hover:underline">Agenda do prefeito</a></li>
              <li><a href="https://capital.sp.gov.br/dia-do-prefeito" className="hover:underline">Dia do Prefeito</a></li>
              <li><a href="https://www.prefeitura.sp.gov.br/cidade/secretarias/comunicacao/organizacao/index.php?p=192554" className="hover:underline">Conheça a equipe de governo</a></li>
              <li><a href="https://capital.sp.gov.br/subprefeitura" className="hover:underline">Subprefeituras</a></li>
              <li><a href="https://capital.sp.gov.br/secretarias" className="hover:underline">Secretarias</a></li>
              <li><a href="https://capital.sp.gov.br/outros-%C3%B3rg%C3%A3os" className="hover:underline">Outros órgãos</a></li>
              <li><a href="https://sp156.prefeitura.sp.gov.br/portal" className="hover:underline">156</a></li>
            </ul>
          </div>
          <div>
             <h6 className="font-bold mb-2.5 text-xl">Serviços para o Cidadão</h6>
            <ul className="space-y-1.5">
               <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=195534" className="hover:underline">Animais</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=182553" className="hover:underline">Casa e Moradia</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=193794" className="hover:underline">Cultura e Economia Criativa</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=193398" className="hover:underline">Educação</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=194817" className="hover:underline">Esportes e Lazer</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=185692" className="hover:underline">Família e Assistência Social</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=190770" className="hover:underline">Fazenda</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=188442" className="hover:underline">Mobilidade Urbana e Transporte</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=183339" className="hover:underline">Rua e Bairro</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=190857" className="hover:underline">Saúde e Bem-estar</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=196305" className="hover:underline">Segurança</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=190800" className="hover:underline">Trabalho</a></li>
            </ul>
          </div>
          <div>
            <h6 className="font-bold mb-2.5 text-xl">Serviços para Empresas</h6>
            <ul className="space-y-1.5">
               <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=197736" className="hover:underline">Abertura de Empresas</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=197907" className="hover:underline">Alvarás, Certidões e Licenças</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=199983" className="hover:underline">Cadastros</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=201153" className="hover:underline">Consultas, Declarações e Normas</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=201903" className="hover:underline">Cursos</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=201594" className="hover:underline">Empreendedorismo</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=199248" className="hover:underline">Impostos e Taxas</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=201429" className="hover:underline">Legislação</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=200490" className="hover:underline">Licitações e Fornecedores</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645" className="hover:underline">Nota do Milhão</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=201813" className="hover:underline">Oportunidades</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=197769" className="hover:underline">Programas e Benefícios</a></li>
            </ul>
          </div>
          <div>
            <h6 className="font-bold mb-2.5 text-xl">Serviços para o Servidor</h6>
             <ul className="space-y-1.5">
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=212939" className="hover:underline">Atendimento</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=203617" className="hover:underline">Benefícios</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=206445" className="hover:underline">Carreira</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=213140" className="hover:underline">Comunicados e Publicações</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=213638" className="hover:underline">Eventos para o Servidor</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=207796" className="hover:underline">Gestão de Pessoas</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=203260" className="hover:underline">Minhas informações</a></li>
              <li><a href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=209051" className="hover:underline">Normas e procedimentos</a></li>
            </ul>
          </div>
           <div>
            <h6 className="font-bold mb-2.5 text-xl">Acontece na cidade</h6>
             <ul className="space-y-1.5">
              <li><a href="https://capital.sp.gov.br/noticias" className="hover:underline">Notícias</a></li>
              <li><a href="https://geosampa.prefeitura.sp.gov.br/PaginasPublicas/_SBC.aspx" className="hover:underline">Mapa de Serviços</a></li>
              <li><a href="https://legislacao.prefeitura.sp.gov.br/" className="hover:underline">Portal da Legislação</a></li>
              <li><a href="https://processos.prefeitura.sp.gov.br/Forms/Principal.aspx" className="hover:underline">Pesquisas de Processos</a></li>
              <li><a href="http://e-negocioscidadesp.prefeitura.sp.gov.br/" className="hover:underline">Licitações</a></li>
              <li><a href="https://www.prefeitura.sp.gov.br/cidade/secretarias/gestao/coordenadoria_de_bens_e_servicos__cobes/atas_de_registro_de_preco/index.php?p=24208" className="hover:underline">Ata de Registro de Preços</a></li>
              <li><a href="https://www.sptrans.com.br/busca-de-itinerarios/" className="hover:underline">Itinerários de ônibus</a></li>
            </ul>
          </div>
        </div>

        {/* Partners and Bottom Section */}
        <div className="bg-[#2c2c2c] text-white py-8 px-4 text-center mt-8 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_auto] items-start gap-10 max-w-[1400px] mx-auto p-6">
            
            {/* Column 1: Prefeitura + Codata */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-8 mb-6">
                <a href="https://prefeitura.sp.gov.br/" target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://github.com/FernandoDorstSilva/imagens-publicas/blob/main/67ed4d18b423c93557cb4b9b_logo-prefeitura.png?raw=true"
                    alt="Prefeitura de São Paulo"
                    className="h-[200px] w-auto object-contain"
                  />
                </a>
                <div className="w-0.5 h-[200px] bg-white"></div>
                <a href="https://codata.prefeitura.sp.gov.br/" target="_blank" rel="noopener noreferrer">
                  <img
                    src="https://raw.githubusercontent.com/FernandoDorstSilva/imagens-publicas/25e3fad688128822ab408216cab33a8eb7d255ff/logo%20codata%20negativo.svg"
                    alt="Parceiro Codata"
                    className="h-[200px] max-w-[300px] w-auto object-contain"
                  />
                </a>
              </div>
               <p className="m-0 text-[1.1em]">
                Prefeitura Municipal de São Paulo - Viaduto do Chá, 15 - Centro - CEP: 01002-020
                <br />
                © 2025 - Projeto de Código Aberto
              </p>
               <div className="mt-3">
                <a
                  href="mailto:codata@prefeitura.sp.gov.br"
                  className="bg-white text-[#0056b3] border-2 border-[#0056b3] text-[20px] no-underline px-4 py-2 inline-block rounded hover:bg-[#0056b3] hover:text-white transition-colors"
                >
                  Viu algo de errado? Entre em contato
                </a>
              </div>
            </div>

             {/* Column 2: Vertical Line (Desktop only) */}
             <div className="hidden md:block w-px bg-white h-full"></div>

             {/* Column 3: Partners */}
             <div className="w-full md:w-auto md:text-left px-0 md:pr-[5%]">
               <h3 className="text-white text-[1.5em] mb-4 text-left md:text-left">Parceiros</h3>
               <div className="flex flex-wrap gap-6 items-center justify-start">
                  <a href="https://github.com/atlas-cli" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-[100px]">
                    <img
                      src="https://github.com/FernandoDorstSilva/imagens-publicas/blob/main/Property%201=branca.png?raw=true"
                      alt="Parceiro 1"
                      className="max-h-[60px] object-contain"
                    />
                  </a>
                  <div className="w-px h-[100px] bg-white hidden md:block"></div>
                   <a href="https://www.primata.design/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-[100px]">
                    <img
                      src="https://raw.githubusercontent.com/FernandoDorstSilva/imagens-publicas/5087ba000a96aba045e6adcc4a73275cd81d682c/PMT-Logo.svg"
                      alt="Parceiro 2"
                       className="max-h-[60px] object-contain"
                    />
                  </a>
                   <div className="w-px h-[100px] bg-white hidden md:block"></div>
                    <a href="https://basedosdados.org/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-[100px]">
                    <img
                        src="https://raw.githubusercontent.com/FernandoDorstSilva/imagens-publicas/9a2f0801588c2debec94e690ff12cc4f9fc85888/bd_logo_v2.svg"
                        alt="Parceiro 3"
                        className="max-h-[60px] object-contain translate-y-1.5"
                      />
                  </a>
               </div>
             </div>

          </div>
        </div>

      </div>
    </footer>
  )
}
