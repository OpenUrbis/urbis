import { Button } from "@open-urbis/map-ui/ui/button";

export function UrbisFooter(_props: any) {
  return (
    <footer className="bg-primary text-primary-foreground pt-10 pb-10 font-sans">
      <div className="container mx-auto px-4">
        <h1
          className="text-transparent text-[9vw] font-black leading-none m-0 px-3 h-auto"
          style={{
            WebkitTextStroke: "2px hsl(var(--primary-foreground))",
            fontVariationSettings: '"wght" 1000, "wdth" 125',
          }}
        >
          URBIS&apos;SP
        </h1>

        {/* INICIO */}
        <div className="flex justify-start mt-12 mb-6">
  <div className="text-left max-w-4xl">
    <p className="text-primary-foreground text-base leading-relaxed">
      O <strong>Urbis</strong> é o sistema formado pelos componentes descritos nas
      seções a seguir, e consiste em uma base de dados geoespaciais integrada,
      com poderosas ferramentas de alimentação, gestão, apresentação,
      manipulação e extração de dados, com capacidade de geração de documentos. O sistema tem como objetivo melhorar a competitividade empresarial, com
      foco nas pequenas empresas, por meio sobretudo da redução de assimetrias de
      acesso à informação e da sua compreensão de maneira fácil, clara e
      padronizada. Por isso, o Urbis foca em dados urbanísticos úteis ao exercício de
      atividades econômicas da construção civil e à instalação de atividades,
      mas serve também para diversos outros propósitos.
    </p>

  </div>
</div>

<div className="w-full h-px bg-primary-foreground/20 my-2.5 mx-auto" />

        {/* MAPA.URBIS */}
        <div className="flex justify-start mt-3 mb-6">
          <div className="text-left">
            <h2 className="text-primary-foreground font-black text-4xl tracking-widest mb-2">
              <a
                href="https://mapa.urbis.prefeitura.sp.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                title="Acessar o Mapa.Urbis"
                aria-label="Acessar o Mapa.Urbis"
              >
                MAPA.URBIS
              </a>
            </h2>
            <div className="h-1 w-16 bg-primary-foreground rounded-full" />
          </div>
        </div>

        <div className="px-1 mb-6">
          <p className="text-primary-foreground/90 text-base font-normal leading-6 tracking-wide mt-1">
            Mapa online que suporta pesquisas complexas com concatenação de
            critérios, desenho, edição ou arquivos de geometria, em bases
            totalmente personalizáveis, alimentadas por orquestradores de dados,
            bases próprias QGis, ou subida de arquivos ou serviços online
            georreferenciados. Tanto as pesquisas quanto as configurações de
            exibição podem ser salvas e compartilhadas. Os resultados das
            pesquisas podem ser baixados ou exportados em formatos compatíveis
            com projetos georreferenciados.
          </p>
        </div>

        <div className="w-full h-px bg-primary-foreground/20 my-8 mx-auto" />

        {/* VIABILIZA.URBIS */}
        <div className="flex justify-start mt-3 mb-6">
          <div className="text-left">
            <h2 className="text-primary-foreground font-black text-4xl tracking-widest mb-2">
              <a
                href="https://viabiliza.urbis.prefeitura.sp.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                title="Acessar o Viabiliza.Urbis"
                aria-label="Acessar o Viabiliza.Urbis"
              >
                VIABILIZA.URBIS
              </a>
            </h2>
            <div className="h-1 w-16 bg-primary-foreground rounded-full" />
          </div>
        </div>

        <div className="px-1 mb-8">
          <p className="text-primary-foreground/90 text-base font-normal leading-6 tracking-wide mt-1">
            Ferramenta de formulário do Urbis, totalmente integrada às bases
            georreferenciadas e ao SEI, que permite formulários complexos e
            geração de documentos.
          </p>
        </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
  {/* DADOS ABERTOS — topo esquerdo */}
  <div>
    <h2 className="text-primary-foreground font-black text-2xl tracking-widest mb-2 text-left">
      <a
        href="https://dadosabertos.urbis.prefeitura.sp.gov.br/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
        title="Acessar Dados Abertos do Urbis"
        aria-label="Acessar Dados Abertos do Urbis"
      >
        DADOS ABERTOS
      </a>
    </h2>

    <div className="h-1 w-16 bg-primary-foreground rounded-full mb-4" />

    <p className="text-primary-foreground/90 text-sm leading-relaxed">
      Repositório de metadados das bases do Urbis, onde os usuários podem buscar,
      visualizar e encontrar explicações técnicas, de maneira acessível e
      transparente, assim como baixar dados em formatos abertos de arquivos ou
      consumir via serviço.
    </p>
  </div>

  {/* LEGIS — topo direito */}
  <div>
    <h2 className="text-primary-foreground font-black text-2xl tracking-widest mb-2 text-left">
      <a
        href="https://docs.urbis.prefeitura.sp.gov.br/docs/legis/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
        title="Acessar Legislação Urbanística do Urbis"
        aria-label="Acessar Legislação Urbanística do Urbis"
      >
        LEGIS
      </a>
    </h2>

    <div className="h-1 w-16 bg-primary-foreground rounded-full mb-4" />

    <p className="text-primary-foreground/90 text-sm leading-relaxed">
      Repositório de dados com explicações normativas sobre conceitos, exigências
      ou fontes de informação, com detalhamento e visualização personalizáveis,
      e vínculos entre seus conteúdos. É utilizado por todo o sistema para
      transformar o mero dado em informação compreendida pelos cidadãos.
    </p>
  </div>

  {/* DOCS URBIS — baixo esquerdo */}
  <div>
    <h2 className="text-primary-foreground font-black text-2xl tracking-widest mb-2 text-left">
      <a
        href="https://docs.urbis.prefeitura.sp.gov.br/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
        title="Acessar a documentação do Urbis"
        aria-label="Acessar a documentação do Urbis"
      >
        Documentação Técnica
      </a>
    </h2>

    <div className="h-1 w-16 bg-primary-foreground rounded-full mb-4" />

    <p className="text-primary-foreground/90 text-sm leading-relaxed">
      O Urbis se baseia e desenvolve todos os seus componentes em software livre, com código aberto e cláusula copyleft, contribuindo para um ambiente de  colaboração e melhoria contínua. Sua documentação técnica detalhada está disponível no Docs.Urbis, e o código-fonte está publicado no GitHub.
    </p>
  </div>

  {/* OPEN URBIS — baixo direito */}
  <div>
    <h2 className="text-primary-foreground font-black text-2xl tracking-widest mb-2 text-left">
      <a
        href="https://github.com/OpenUrbis"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
        title="Acessar o repositório OpenUrbis no GitHub"
        aria-label="Acessar o repositório OpenUrbis no GitHub"
      >
        GitHub
      </a>
    </h2>

    <div className="h-1 w-16 bg-primary-foreground rounded-full mb-4" />

    <p className="text-primary-foreground/90 text-sm leading-relaxed">
      Publicação do projeto no GitHub.
    </p>
  </div>
</div>


        {/* Prefeitura Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 border-t border-primary-foreground/30 pt-8 pb-6 text-primary-foreground/90 text-sm">
          <div>
            <h6 className="font-bold mb-2.5 text-xl text-primary-foreground">
              Prefeitura de São Paulo
            </h6>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://capital.sp.gov.br/agenda-do-prefeito"
                  className="hover:underline"
                  title="Agenda do Prefeito"
                  aria-label="Agenda do Prefeito"
                >
                  Agenda do prefeito
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/dia-do-prefeito"
                  className="hover:underline"
                  title="Dia do Prefeito"
                  aria-label="Dia do Prefeito"
                >
                  Dia do Prefeito
                </a>
              </li>
              <li>
                <a
                  href="https://www.prefeitura.sp.gov.br/cidade/secretarias/comunicacao/organizacao/index.php?p=192554"
                  className="hover:underline"
                  title="Conheça a equipe de governo"
                  aria-label="Conheça a equipe de governo"
                >
                  Conheça a equipe de governo
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/subprefeitura"
                  className="hover:underline"
                  title="Subprefeituras"
                  aria-label="Subprefeituras"
                >
                  Subprefeituras
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/secretarias"
                  className="hover:underline"
                  title="Secretarias"
                  aria-label="Secretarias"
                >
                  Secretarias
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/outros-%C3%B3rg%C3%A3os"
                  className="hover:underline"
                  title="Outros órgãos"
                  aria-label="Outros órgãos"
                >
                  Outros órgãos
                </a>
              </li>
              <li>
                <a
                  href="https://sp156.prefeitura.sp.gov.br/portal"
                  className="hover:underline"
                  title="SP 156"
                  aria-label="SP 156"
                >
                  156
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h6 className="font-bold mb-2.5 text-xl text-primary-foreground">
              Serviços para o Cidadão
            </h6>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=195534"
                  className="hover:underline"
                  title="Serviços: Animais"
                  aria-label="Serviços: Animais"
                >
                  Animais
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=182553"
                  className="hover:underline"
                  title="Serviços: Casa e Moradia"
                  aria-label="Serviços: Casa e Moradia"
                >
                  Casa e Moradia
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=193794"
                  className="hover:underline"
                  title="Serviços: Cultura e Economia Criativa"
                  aria-label="Serviços: Cultura e Economia Criativa"
                >
                  Cultura e Economia Criativa
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=193398"
                  className="hover:underline"
                  title="Serviços: Educação"
                  aria-label="Serviços: Educação"
                >
                  Educação
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=194817"
                  className="hover:underline"
                  title="Serviços: Esportes e Lazer"
                  aria-label="Serviços: Esportes e Lazer"
                >
                  Esportes e Lazer
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=185692"
                  className="hover:underline"
                  title="Serviços: Família e Assistência Social"
                  aria-label="Serviços: Família e Assistência Social"
                >
                  Família e Assistência Social
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=190770"
                  className="hover:underline"
                  title="Serviços: Fazenda"
                  aria-label="Serviços: Fazenda"
                >
                  Fazenda
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=188442"
                  className="hover:underline"
                  title="Serviços: Mobilidade Urbana e Transporte"
                  aria-label="Serviços: Mobilidade Urbana e Transporte"
                >
                  Mobilidade Urbana e Transporte
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=183339"
                  className="hover:underline"
                  title="Serviços: Rua e Bairro"
                  aria-label="Serviços: Rua e Bairro"
                >
                  Rua e Bairro
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=190857"
                  className="hover:underline"
                  title="Serviços: Saúde e Bem-estar"
                  aria-label="Serviços: Saúde e Bem-estar"
                >
                  Saúde e Bem-estar
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=196305"
                  className="hover:underline"
                  title="Serviços: Segurança"
                  aria-label="Serviços: Segurança"
                >
                  Segurança
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/cidadao?rootCategoryId=122642&categoryId=190800"
                  className="hover:underline"
                  title="Serviços: Trabalho"
                  aria-label="Serviços: Trabalho"
                >
                  Trabalho
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h6 className="font-bold mb-2.5 text-xl text-primary-foreground">
              Serviços para Empresas
            </h6>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=197736"
                  className="hover:underline"
                  title="Serviços para empresas: Abertura de Empresas"
                  aria-label="Serviços para empresas: Abertura de Empresas"
                >
                  Abertura de Empresas
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=197907"
                  className="hover:underline"
                  title="Serviços para empresas: Alvarás, Certidões e Licenças"
                  aria-label="Serviços para empresas: Alvarás, Certidões e Licenças"
                >
                  Alvarás, Certidões e Licenças
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=199983"
                  className="hover:underline"
                  title="Serviços para empresas: Cadastros"
                  aria-label="Serviços para empresas: Cadastros"
                >
                  Cadastros
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=201153"
                  className="hover:underline"
                  title="Serviços para empresas: Consultas, Declarações e Normas"
                  aria-label="Serviços para empresas: Consultas, Declarações e Normas"
                >
                  Consultas, Declarações e Normas
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=201903"
                  className="hover:underline"
                  title="Serviços para empresas: Cursos"
                  aria-label="Serviços para empresas: Cursos"
                >
                  Cursos
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=201594"
                  className="hover:underline"
                  title="Serviços para empresas: Empreendedorismo"
                  aria-label="Serviços para empresas: Empreendedorismo"
                >
                  Empreendedorismo
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=199248"
                  className="hover:underline"
                  title="Serviços para empresas: Impostos e Taxas"
                  aria-label="Serviços para empresas: Impostos e Taxas"
                >
                  Impostos e Taxas
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=201429"
                  className="hover:underline"
                  title="Serviços para empresas: Legislação"
                  aria-label="Serviços para empresas: Legislação"
                >
                  Legislação
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=200490"
                  className="hover:underline"
                  title="Serviços para empresas: Licitações e Fornecedores"
                  aria-label="Serviços para empresas: Licitações e Fornecedores"
                >
                  Licitações e Fornecedores
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645"
                  className="hover:underline"
                  title="Serviços para empresas: Nota do Milhão"
                  aria-label="Serviços para empresas: Nota do Milhão"
                >
                  Nota do Milhão
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=201813"
                  className="hover:underline"
                  title="Serviços para empresas: Oportunidades"
                  aria-label="Serviços para empresas: Oportunidades"
                >
                  Oportunidades
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servicos/empresa?rootCategoryId=122645&categoryId=197769"
                  className="hover:underline"
                  title="Serviços para empresas: Programas e Benefícios"
                  aria-label="Serviços para empresas: Programas e Benefícios"
                >
                  Programas e Benefícios
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h6 className="font-bold mb-2.5 text-xl text-primary-foreground">
              Serviços para o Servidor
            </h6>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=212939"
                  className="hover:underline"
                  title="Servidores: Atendimento"
                  aria-label="Servidores: Atendimento"
                >
                  Atendimento
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=203617"
                  className="hover:underline"
                  title="Servidores: Benefícios"
                  aria-label="Servidores: Benefícios"
                >
                  Benefícios
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=206445"
                  className="hover:underline"
                  title="Servidores: Carreira"
                  aria-label="Servidores: Carreira"
                >
                  Carreira
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=213140"
                  className="hover:underline"
                  title="Servidores: Comunicados e Publicações"
                  aria-label="Servidores: Comunicados e Publicações"
                >
                  Comunicados e Publicações
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=213638"
                  className="hover:underline"
                  title="Servidores: Eventos para o Servidor"
                  aria-label="Servidores: Eventos para o Servidor"
                >
                  Eventos para o Servidor
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=207796"
                  className="hover:underline"
                  title="Servidores: Gestão de Pessoas"
                  aria-label="Servidores: Gestão de Pessoas"
                >
                  Gestão de Pessoas
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=203260"
                  className="hover:underline"
                  title="Servidores: Minhas informações"
                  aria-label="Servidores: Minhas informações"
                >
                  Minhas informações
                </a>
              </li>
              <li>
                <a
                  href="https://capital.sp.gov.br/web/prefeitura-de-sao-paulo/servidores?rootCategoryId=234537&categoryId=209051"
                  className="hover:underline"
                  title="Servidores: Normas e procedimentos"
                  aria-label="Servidores: Normas e procedimentos"
                >
                  Normas e procedimentos
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h6 className="font-bold mb-2.5 text-xl text-primary-foreground">
              Acontece na cidade
            </h6>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://capital.sp.gov.br/noticias"
                  className="hover:underline"
                  title="Notícias"
                  aria-label="Notícias"
                >
                  Notícias
                </a>
              </li>
              <li>
                <a
                  href="https://geosampa.prefeitura.sp.gov.br/PaginasPublicas/_SBC.aspx"
                  className="hover:underline"
                  title="GeoSampa: Mapa de Serviços"
                  aria-label="GeoSampa: Mapa de Serviços"
                >
                  Mapa de Serviços
                </a>
              </li>
              <li>
                <a
                  href="https://legislacao.prefeitura.sp.gov.br/"
                  className="hover:underline"
                  title="Portal da Legislação"
                  aria-label="Portal da Legislação"
                >
                  Portal da Legislação
                </a>
              </li>
              <li>
                <a
                  href="https://processos.prefeitura.sp.gov.br/Forms/Principal.aspx"
                  className="hover:underline"
                  title="Pesquisa de Processos"
                  aria-label="Pesquisa de Processos"
                >
                  Pesquisas de Processos
                </a>
              </li>
              <li>
                <a
                  href="http://e-negocioscidadesp.prefeitura.sp.gov.br/"
                  className="hover:underline"
                  title="e-Negócios CidadeSP"
                  aria-label="e-Negócios CidadeSP"
                >
                  Licitações
                </a>
              </li>
              <li>
                <a
                  href="https://www.prefeitura.sp.gov.br/cidade/secretarias/gestao/coordenadoria_de_bens_e_servicos__cobes/atas_de_registro_de_preco/index.php?p=24208"
                  className="hover:underline"
                  title="Ata de Registro de Preços"
                  aria-label="Ata de Registro de Preços"
                >
                  Ata de Registro de Preços
                </a>
              </li>
              <li>
                <a
                  href="https://www.sptrans.com.br/busca-de-itinerarios/"
                  className="hover:underline"
                  title="SPTrans: Itinerários de ônibus"
                  aria-label="SPTrans: Itinerários de ônibus"
                >
                  Itinerários de ônibus
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Partners Section */}
        <div className="border-t border-primary-foreground/10 py-12 mt-12">
          <div className="flex flex-col items-center gap-8">
            <span className="text-primary-foreground/60 text-xs font-bold uppercase tracking-[0.2em]">
              Parceiros e Colaboradores
            </span>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
              <a
                href="https://github.com/atlas-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity"
                title="Atlas CLI"
                aria-label="Atlas CLI"
              >
                <img
                  src="https://github.com/FernandoDorstSilva/imagens-publicas/blob/main/Property%201=branca.png?raw=true"
                  alt="Atlas CLI"
                  className="h-8 md:h-10 w-auto object-contain scale-[0.8] dark:invert dark:brightness-110 transition-[filter]"
                />
              </a>

              <a
                href="https://www.primata.design/"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity"
                title="Primata Design"
                aria-label="Primata Design"
              >
                <img
                  src="https://raw.githubusercontent.com/FernandoDorstSilva/imagens-publicas/5087ba000a96aba045e6adcc4a73275cd81d682c/PMT-Logo.svg"
                  alt="Primata Design"
                  className="h-8 md:h-10 w-auto object-contain scale-[0.8] dark:invert dark:brightness-0"
                />
              </a>

              <a
                href="https://basedosdados.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity"
                title="Base dos Dados"
                aria-label="Base dos Dados"
              >
                <img
                  src="https://raw.githubusercontent.com/FernandoDorstSilva/imagens-publicas/9a2f0801588c2debec94e690ff12cc4f9fc85888/bd_logo_v2.svg"
                  alt="Base dos Dados"
                  className="h-8 md:h-10 w-auto object-contain scale-[0.8] dark:invert dark:brightness-110 transition-[filter]"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-primary-foreground/10 pt-8 mt-4 flex flex-col md:flex-row justify-between items-end gap-8">
          {/* Left: Official Logos */}
          <div className="flex items-center gap-6 self-center md:self-start">
            <a
              href="https://prefeitura.sp.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity"
              title="Prefeitura de São Paulo – site oficial"
              aria-label="Prefeitura de São Paulo – site oficial"
            >
              <img
                src="https://github.com/FernandoDorstSilva/imagens-publicas/blob/main/67ed4d18b423c93557cb4b9b_logo-prefeitura.png?raw=true"
                alt="Logotipo da Prefeitura de São Paulo"
                className="h-24 w-auto object-contain dark:invert dark:brightness-110 transition-[filter]"
              />
            </a>

            <div className="h-12 w-px bg-primary-foreground/20" />

            <a
              href="https://codata.prefeitura.sp.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity"
              title="CODATA – Tecnologia da Informação da Prefeitura de São Paulo"
              aria-label="CODATA – Tecnologia da Informação da Prefeitura de São Paulo"
            >
              <img
                src="https://raw.githubusercontent.com/FernandoDorstSilva/imagens-publicas/25e3fad688128822ab408216cab33a8eb7d255ff/logo%20codata%20negativo.svg"
                alt="Logotipo da CODATA São Paulo"
                className="h-14 w-auto object-contain dark:invert dark:brightness-110 transition-[filter]"
              />
            </a>
          </div>

          {/* Right: Info & Action */}
          <div className="flex flex-col items-center justify-center text-center gap-1">
            <div className="inline-flex flex-col items-center justify-center text-center gap-1">
              {/* Título */}
              <p className="text-[22px] md:text-[26px] font-bold leading-tight tracking-tight text-white dark:text-black whitespace-nowrap">
                Município de São Paulo © 2024
              </p>

              {/* Licenças */}
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[14px] md:text-[14px] font-medium whitespace-nowrap">
                {/* AGPL v3 */}
                <a
  href="https://web.archive.org/web/20230716103808/http://licencas.softwarelivre.org/agpl-3.0.pt-br.html"
  target="_blank"
  rel="noreferrer"
  className="inline-flex items-center gap-1 text-white dark:text-black hover:underline"
  title="Licença Pública Geral Affero GNU v3 (AGPLv3) — software"
  aria-label="Licença Pública Geral Affero GNU v3 (AGPLv3) — software"
>
  <img
    src="/sa.svg"
    className="w-4 h-4 opacity-80"
    alt="Ícone Compartilha Igual (SA)"
    title="Compartilha Igual (SA)"
  />
  <span>AGPL v3</span>
  <span className="font-normal opacity-70 text-[12px]">(software)</span>
</a>

                {/* CC BY-SA */}
                <a
                  href="https://creativecommons.org/licenses/by-sa/4.0/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-white dark:text-black hover:underline"
                  title="Licença Creative Commons BY-SA 4.0 – conteúdos e dados"
                  aria-label="Licença Creative Commons BY-SA 4.0 – conteúdos e dados"
                >
                  <img
                    src="/cc.svg"
                    className="w-4 h-4 opacity-90"
                    alt="Ícone Creative Commons"
                    title="Creative Commons"
                  />
                  <img
                    src="/by.svg"
                    className="w-4 h-4 opacity-80"
                    alt="Ícone Atribuição"
                    title="Atribuição (BY)"
                  />
                  <img
                    src="/sa.svg"
                    className="w-4 h-4 opacity-80"
                    alt="Ícone Compartilha Igual"
                    title="Compartilha Igual (SA)"
                  />

                  <span>CC BY-SA 4.0</span>
                  <span className="font-normal opacity-70 text-[12px]">
                    (outros)
                  </span>
                </a>
              </div>
            </div>

            {/* Botão "Encontrou um erro?" */}
            <a
              href="mailto:codata@prefeitura.sp.gov.br"
              className="group mt-1 inline-flex items-center gap-2 text-xs font-medium
               text-white dark:text-black transition-colors
               bg-white/10 dark:bg-black/10
               hover:bg-white/20 dark:hover:bg-black/20
               px-4 py-2 rounded-full border border-white/20 dark:border-black/20"
              title="Encontrou um erro? Envie um e-mail para codata@prefeitura.sp.gov.br"
              aria-label="Encontrou um erro? Envie um e-mail para codata@prefeitura.sp.gov.br"
            >
              <span>Encontrou um erro?</span>
              <span className="underline decoration-white/40 dark:decoration-black/40 underline-offset-2">
                Entre em contato
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
