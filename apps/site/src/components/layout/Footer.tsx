import { Link } from 'react-router-dom'
import { Button } from '@open-urbis/map-ui/ui/button'
import { UrbisFooter } from '@open-urbis/map-ui'

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground pt-10 pb-10 font-sans">
      <div className="container mx-auto px-4">
        <h1 className="text-transparent text-[9vw] font-black leading-none m-0 px-3 h-auto" style={{ WebkitTextStroke: '2px hsl(var(--primary-foreground))', fontVariationSettings: '"wght" 1000, "wdth" 125' }}>URBIS'SP</h1>

        {/* INICIO */}
        <div className="flex justify-start mt-12 mb-6">
          <div className="text-left">
            <h2 className="text-primary-foreground font-black text-4xl tracking-widest mb-4">
              <a href="https://urbis.sampa.br/pt/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">INÍCIO</a>
            </h2>
            <div className="flex gap-3 flex-wrap justify-start">
              <Link to="/">
                <Button variant="secondary" size="sm" className="rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary border-none font-bold h-8 px-4">Home</Button>
              </Link>
              <Link to="/sobre">
                <Button variant="secondary" size="sm" className="rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary border-none font-bold h-8 px-4">Sobre</Button>
              </Link>
              <a href="https://viabiliza.urbis.sampa.br/sign-up" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary border-none font-bold h-8 px-4">Cadastro</Button>
              </a>
              <a href="mailto:codata@prefeitura.sp.gov.br" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary border-none font-bold h-8 px-4">Contato</Button>
              </a>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-primary-foreground/20 my-2.5 mx-auto"></div>

        {/* MAPA.URBIS */}
        <div className="flex justify-start mt-3 mb-6">
          <div className="text-left">
             <h2 className="text-primary-foreground font-black text-4xl tracking-widest mb-2">
              <a href="https://mapa.urbis.sampa.br" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">MAPA.URBIS</a>
            </h2>
            <div className="h-1 w-16 bg-primary-foreground rounded-full"></div>
          </div>
        </div>
        <div className="px-1 mb-6">
          <p className="text-primary-foreground/90 text-base font-normal leading-6 tracking-wide mt-1">
            Mapa online para uma base de dados espaciais integrada com foco em dados urbanos, destinada a subsidiar o planejamento e a avaliação de políticas públicas pelos órgãos e entes governamentais, e que utiliza tecnologias de manutenção inteligente, com diversas ferramentas de consulta e prospecção, incluindo buscas por geometrias personalizadas, e personalização da exibição.
          </p>
        </div>

        <div className="w-full h-px bg-primary-foreground/20 my-8 mx-auto"></div>

        {/* VIABILIZA.URBIS */}
        <div className="flex justify-start mt-3 mb-6">
           <div className="text-left">
             <h2 className="text-primary-foreground font-black text-4xl tracking-widest mb-2">
              <a href="https://viabiliza.urbis.sampa.br/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">VIABILIZA.URBIS</a>
            </h2>
            <div className="h-1 w-16 bg-primary-foreground rounded-full"></div>
          </div>
        </div>
        <div className="px-1 mb-8">
          <p className="text-primary-foreground/90 text-base font-normal leading-6 tracking-wide mt-1">
            Totalmente integrado com as pesquisas do Mapa.Urbi, o Viabiliza.Urbis informa para uma determinada área, um conjunto de informações relevantes para o planejamento e acompanhamento de atividades urbanísticas, como a situação de tombamento, contaminação do solo, preservação ambiental, zoneamento, áreas de risco, alagamentos, faixas não edificáveis entre outras.
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-6">
          <div>
            <ul className="list-none pl-0">
              <li className="mb-2.5">
                <a href="https://legislacao.prefeitura.sp.gov.br/leis/lei-16402-de-22-de-marco-de-2016/consolidado" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/90 px-3 py-1.5 rounded-md hover:bg-primary-foreground hover:text-primary transition-all font-medium inline-block">
                  Lei de Parcelamento, Uso e Ocupação do Solo - LPUOS
                </a>
              </li>
            </ul>
          </div>
          <div>
            <ul className="list-none pl-0">
              <li className="mb-2.5">
                 <a href="https://legislacao.prefeitura.sp.gov.br/leis/lei-16642-de-09-de-maio-de-2017/consolidado" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/90 px-3 py-1.5 rounded-md hover:bg-primary-foreground hover:text-primary transition-all font-medium inline-block">
                  Código de Obras e Edificações - COE
                </a>
              </li>
            </ul>
          </div>
          <div>
             <ul className="list-none pl-0">
              <li className="mb-2.5">
                 <a href="https://urbis.sampa.br/info.urbis" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/90 px-3 py-1.5 rounded-md hover:bg-primary-foreground hover:text-primary transition-all font-medium inline-block">
                  +informações sobre legislação urbanística
                </a>
              </li>
            </ul>
          </div>
          <div>
             <ul className="list-none pl-0">
              <li className="mb-2.5">
                 <Link to="/carta-servicos" className="text-primary-foreground/90 px-3 py-1.5 rounded-md hover:bg-primary-foreground hover:text-primary transition-all font-medium inline-block">
                  Carta de Serviços Urbanísticos, ambientais e culturais
                </Link>
              </li>
              <li className="mb-2.5">
                 <Link to="/licencas" className="text-primary-foreground/90 px-3 py-1.5 rounded-md hover:bg-primary-foreground hover:text-primary transition-all font-medium inline-block">
                  Informações sobre licenças emitidas e denúncias
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="w-full h-px bg-primary-foreground/20 my-8 mx-auto"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
           {/* DADOS ABERTOS */}
           <div>
              <h2 className="text-primary-foreground font-black text-2xl tracking-widest mb-2 text-left">
                <a href="https://dadosabertos.urbis.sampa.br/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">DADOS ABERTOS</a>
              </h2>
              <div className="h-1 w-16 bg-primary-foreground rounded-full mb-4"></div>
              <p className="text-primary-foreground/90 text-sm leading-relaxed">
                Através da interface amigável do CKAN, os usuários poderão buscar, visualizar, encontrar explicações técnicas, de maneira acessível e transparente, assim como baixar dados em formatos abertos, permitindo uma integração direta com outras ferramentas e promovendo a reutilização das informações por diversos setores da sociedade, incluindo pesquisadores, desenvolvedores e gestores públicos.
              </p>
           </div>

           {/* DOCS URBIS */}
           <div>
              <h2 className="text-primary-foreground font-black text-2xl tracking-widest mb-2 text-left">
                <a href="https://docs.urbis.sampa.br/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">DOCS URBIS</a>
              </h2>
              <div className="h-1 w-16 bg-primary-foreground rounded-full mb-4"></div>
              <p className="text-primary-foreground/90 text-sm leading-relaxed">
                O sistema possui documentação detalhada e é de código aberto, promovendo a colaboração e melhoria contínua.
              </p>
           </div>

           {/* OPEN URBIS */}
           <div>
              <h2 className="text-primary-foreground font-black text-2xl tracking-widest mb-2 text-left">
                <a href="https://github.com/OpenUrbis" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">OPEN URBIS</a>
              </h2>
              <div className="h-1 w-16 bg-primary-foreground rounded-full mb-4"></div>
              <p className="text-primary-foreground/90 text-sm leading-relaxed">
                Publicação do projeto no GitHub.
              </p>
           </div>
        </div>

        {/* Prefeitura Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 border-t border-primary-foreground/30 pt-8 pb-6 text-primary-foreground/90 text-sm">
          <div>
            <h6 className="font-bold mb-2.5 text-xl text-primary-foreground">Prefeitura de São Paulo</h6>
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
             <h6 className="font-bold mb-2.5 text-xl text-primary-foreground">Serviços para o Cidadão</h6>
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
            <h6 className="font-bold mb-2.5 text-xl text-primary-foreground">Serviços para Empresas</h6>
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
            <h6 className="font-bold mb-2.5 text-xl text-primary-foreground">Serviços para o Servidor</h6>
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
            <h6 className="font-bold mb-2.5 text-xl text-primary-foreground">Acontece na cidade</h6>
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

        {/* Partners Section */}
        <div className="border-t border-primary-foreground/10 py-12 mt-12">
           <div className="flex flex-col items-center gap-8">
              <span className="text-primary-foreground/60 text-xs font-bold uppercase tracking-[0.2em]">Parceiros e Colaboradores</span>
              <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
                  <a href="https://github.com/atlas-cli" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
                    <img src="https://github.com/FernandoDorstSilva/imagens-publicas/blob/main/Property%201=branca.png?raw=true" alt="Atlas CLI" className="h-8 md:h-10 w-auto object-contain brightness-0 invert" />
                  </a>
                  <a href="https://www.primata.design/" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
                    <img src="https://raw.githubusercontent.com/FernandoDorstSilva/imagens-publicas/5087ba000a96aba045e6adcc4a73275cd81d682c/PMT-Logo.svg" alt="Primata Design" className="h-8 md:h-10 w-auto object-contain brightness-0 invert" />
                  </a>
                  <a href="https://basedosdados.org/" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
                    <img src="https://raw.githubusercontent.com/FernandoDorstSilva/imagens-publicas/9a2f0801588c2debec94e690ff12cc4f9fc85888/bd_logo_v2.svg" alt="Base dos Dados" className="h-8 md:h-10 w-auto object-contain" />
                  </a>
              </div>
           </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-primary-foreground/10 pt-8 mt-4 flex flex-col md:flex-row justify-between items-end gap-8">
            {/* Left: Official Logos */}
            <div className="flex items-center gap-6 self-center md:self-start">
               <a href="https://prefeitura.sp.gov.br" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                 <img src="https://github.com/FernandoDorstSilva/imagens-publicas/blob/main/67ed4d18b423c93557cb4b9b_logo-prefeitura.png?raw=true" alt="Prefeitura SP" className="h-24 w-auto object-contain brightness-0 invert" />
               </a>
               <div className="h-12 w-px bg-primary-foreground/20"></div>
               <a href="https://codata.prefeitura.sp.gov.br" target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                 <img src="https://raw.githubusercontent.com/FernandoDorstSilva/imagens-publicas/25e3fad688128822ab408216cab33a8eb7d255ff/logo%20codata%20negativo.svg" alt="Codata" className="h-14 w-auto object-contain brightness-0 invert" />
               </a>
            </div>

            {/* Right: Info & Action */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right gap-4">
               <div className="text-primary-foreground/60 text-xs leading-relaxed font-light">
                  <p>Prefeitura Municipal de São Paulo - Viaduto do Chá, 15 - Centro - CEP: 01002-020</p>
                  <div className="mt-1 opacity-80">
                    <UrbisFooter />
                  </div>
               </div>
               <a 
                 href="mailto:codata@prefeitura.sp.gov.br" 
                 className="group flex items-center gap-2 text-xs font-medium text-primary-foreground/80 hover:text-white transition-colors bg-primary-foreground/5 hover:bg-primary-foreground/10 px-4 py-2 rounded-full border border-primary-foreground/10"
               >
                  <span>Encontrou um erro?</span>
                  <span className="underline decoration-primary-foreground/30 group-hover:decoration-white underline-offset-2">Entre em contato</span>
               </a>
            </div>
        </div>

      </div>
    </footer>
  )
}
