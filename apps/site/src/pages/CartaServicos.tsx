export default function CartaServicos() {

  const scrollTo = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
     <div className="flex flex-col font-sans bg-muted/30">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 py-6 px-4 max-w-[900px] mx-auto w-full border-b border-border">
        <h1 className="text-2xl font-bold m-0 text-foreground">
          Carta de Serviços urbanísticos, ambientais e culturais
        </h1>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-[900px] mx-auto w-full space-y-8 pb-12">
        {/* ATENÇÃO */}
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-md">
          <strong className="text-destructive">ATENÇÃO:</strong>
          <span className="text-foreground ml-2">
            {' '}
            esta página é uma versão demonstrativa e pode conter erros. Contribuições e correções de links podem
            ser enviados para{' '}
            <a
              href="mailto:codata@prefeitura.sp.gov.br"
              className="text-blue-600 underline hover:text-blue-700 font-medium"
            >
              CODATA@prefeitura.sp.gov.br
            </a>
            .
          </span>
        </div>

        {/* Intro */}
        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <p className="text-card-foreground leading-relaxed">
            Abaixo estão os sistemas e outros canais para solicitar documentos de controle urbanístico como licenças,
            autorizações, permissões, termos etc. e documentos auxiliares, necessários para atividades como
            parcelamentos do solo, obras, construções, edificações, usos urbanísticos, assim como documentos de
            controle de segurança, acessibilidade, ambiental, cultural e sanitário.
          </p>
        </section>

        {/* Sumário */}
        <nav className="p-6 bg-accent/20 border-l-4 border-primary rounded-r-lg">
          <h2 className="text-xl font-bold mb-4 text-primary">Sumário</h2>
          <p className="mb-2 font-semibold text-foreground">
            Sistemas e outros canais de solicitação de documentos e outros pedidos relacionados
          </p>
          <ul className="list-none pl-0 space-y-2 text-foreground">
            <li>
              <strong>Controle urbanístico</strong>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  <button
                    className="text-primary hover:underline bg-transparent border-none p-0 text-left cursor-pointer font-medium"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollTo('cadastro')
                    }}
                  >
                    Cadastrais e de viabilidade
                  </button>
                </li>
                <li>
                  <button
                    className="text-primary hover:underline bg-transparent border-none p-0 text-left cursor-pointer font-medium"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollTo('geral')
                    }}
                  >
                    Geral
                  </button>
                </li>
                <li>
                  <button
                    className="text-primary hover:underline bg-transparent border-none p-0 text-left cursor-pointer font-medium"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollTo('seguranca')
                    }}
                  >
                    Segurança
                  </button>
                </li>
                <li>
                  <button
                    className="text-primary hover:underline bg-transparent border-none p-0 text-left cursor-pointer font-medium"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollTo('salubridade')
                    }}
                  >
                    Sanitário
                  </button>
                </li>
                <li>
                  <button
                    className="text-primary hover:underline bg-transparent border-none p-0 text-left cursor-pointer font-medium"
                    onClick={(e) => {
                      e.preventDefault()
                      scrollTo('acessibilidade')
                    }}
                  >
                    Acessibilidade
                  </button>
                </li>
              </ul>
            </li>
            <li className="mt-1">
              <button
                className="text-primary hover:underline bg-transparent border-none p-0 text-left cursor-pointer font-medium"
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo('ambiental')
                }}
              >
                Controle ambiental
              </button>
            </li>
            <li>
              <button
                className="text-primary hover:underline bg-transparent border-none p-0 text-left cursor-pointer font-medium"
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo('cultural')
                }}
              >
                Controle cultural
              </button>
            </li>
          </ul>
        </nav>

        {/* CADASTRAIS E DE VIABILIDADE */}
        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2
            id="cadastro"
            className="text-xl font-bold mb-4 text-primary"
          >
            Documentos de controle urbanístico (Cadastrais e de viabilidade) - Sistemas e outros canais de solicitação
          </h2>

          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>
              <a
                href="http://sp156.prefeitura.sp.gov.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal 156
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Certidão de Melhoramento Viário e/ou cópia digital da Planta de Melhoramento Viário</li>
                <li>Certidão de Desapropriação</li>
                <li>Cópia de planta expropriatória (desapropriação)</li>
                <li>Certidão de Diretrizes Hidráulicas e Faixas não Edificáveis</li>
                <li>Certidão sobre o histórico da numeração do imóvel</li>
                <li>Certidão sobre a oficialização e alteração de denominação de logradouro</li>
                <li>Certidão de Tombamento Definitivo</li>
                <li>Certidão de Tombamento Provisório (Abertura de Processo de Tombamento - APT)</li>
                <li>Certidão de Arquivamento da APT</li>
                <li>
                  Certidão de incidência de Legislação municipal e estadual de Patrimônio Cultural no Município de São
                  Paulo (indisponibilidade de emissão pelo GeoSampa)
                </li>
              </ul>
            </li>

            <li>
              <a
                href="https://processos.prefeitura.sp.gov.br/Forms/PedidoEletronico1.aspx"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal de Processos (Sistema Eletrônico de Informações - SEI)
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Pesquisa de existência de processos e desarquivamento (planta/alvarás) (de processos físicos
                  arquivados)
                </li>
              </ul>
            </li>

            <li>
              <span className="font-semibold text-foreground">Protocolo pelo e-mail </span>
              <a
                href="mailto:capdeprot@prefeitura.sp.gov.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                capdeprot@prefeitura.sp.gov.br
              </a>{' '}
              <span className="font-semibold text-foreground">
                (autuação no Sistema Eletrônico de Informações - SEI por SMUL/CAP/DEPROT)
              </span>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Diretrizes de Projeto</li>
                <li>Termo de Consulta de Funcionamento (para Alvará de Funcionamento para Local de Reunião)</li>
                <li>Certidão de Uso e Ocupação do Solo</li>
                <li>Certidão de Confrontação referente a Parcelamento do Solo</li>
              </ul>
            </li>

            <li>
              Protocolo nas Praças de Atendimento das Subprefeituras (
              <a
                href="https://sp156.prefeitura.sp.gov.br/portal/outros-canais-de-atendimento#praca-atendimento"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                endereços
              </a>
              )
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Termo de Consulta de Funcionamento (para Auto de Licença de Funcionamento)</li>
                <li>Certidão de alinhamento e nivelamento de imóveis</li>
                <li>
                  Orientações e autorização para execução de calçada em condições excepcionais (Decreto nº
                  59.671/2020 - art. 25)
                </li>
              </ul>
            </li>

            <li>
              <a
                href="https://portaldelicenciamento.prefeitura.sp.gov.br/prodam/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Plataforma de Regularização de Edificações (“Portal de Licenciamento”)
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Ficha Técnica</li>
              </ul>
            </li>

            <li>
              <a
                href="http://www3.prefeitura.sp.gov.br/sd0219_emissaodocumento/PaginasPublicas/Documentos.aspx"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Emissão de Documento via Web (SMUL/CASE/DLE)
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Histórico da Edificação</li>
                <li>Certificado de Regularidade da Edificação</li>
                <li>Notificação de Irregularidade da Edificação</li>
                <li>Certidão de Logradouro</li>
                <li>Certidão de Numeração</li>
              </ul>
            </li>

            <li>
              <a
                href="https://e-licenca.prefeitura.sp.gov.br/ConsultaPublica/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Empreenda Fácil
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Consulta de Viabilidade (informativa)</li>
              </ul>
            </li>

            <li>
              <a
                href="https://vreredesim.sp.gov.br/homec"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Via Rápida Empresa - VRE
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Consulta de Viabilidade</li>
              </ul>
            </li>

            <li>
              <a
                href="https://geosampa.prefeitura.sp.gov.br/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                GeoSampa
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Certidão de incidência de Legislação municipal e estadual de Patrimônio Cultural no Município de São
                  Paulo (Pesquisar {'>'} CIT {'>'} Visualizar Impressão)
                </li>
              </ul>
            </li>

            <li>
              <span className="font-semibold text-foreground">
                Protocolo na Rua do Paraíso, nº 387, Térreo, Paraíso, de segunda a sexta-feira, das 8h às 17h ou pelo
                e-mail{' '}
              </span>
              <a
                href="mailto:svmaprotocolo@prefeitura.sp.gov.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                svmaprotocolo@prefeitura.sp.gov.br
              </a>{' '}
              <span className="font-semibold text-foreground">
                (autuação no Sistema Eletrônico de Informações - SEI por SVMA/DIM)
              </span>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Consulta Prévia (para Licença Ambiental de empreendimentos geradores de impacto local ou Alvará
                  Ambiental em APRM)
                </li>
                <li>Pré análise</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* GERAL */}
        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2
            id="geral"
            className="text-xl font-bold mb-4 text-primary"
          >
            Documentos de controle urbanístico (Geral) - Sistemas e outros canais de solicitação
          </h2>

          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>
              <a
                href="https://www.portaldolicenciamentosp.com.br/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Aprova Digital-AD
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Alvará (incluindo de Projeto Modificativo)
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>
                      de Aprovação e/ou Execução de Edificação Nova / Reforma (exceto Unifamiliar; HIS/HMP ou não)
                    </li>
                  </ul>
                </li>
                <li>
                  Alvará
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>
                      de Execução de Demolição (total ou parcial da edificação, quando incluído no licenciamento
                      edilício dado por documento emitido pelo AD)
                    </li>
                    <li>
                      de Execução de Movimento de Terra (quando incluído no licenciamento edilício dado por documento
                      emitido pelo AD)
                    </li>
                    <li>
                      de Execução de Muro de Arrimo (quando incluído no licenciamento edilício dado por documento
                      emitido pelo AD)
                    </li>
                    <li>
                      de Desmembramento (exceto se vinculado a pedido edilício do SLCe; seccionado por ZEIS ou não)
                    </li>
                    <li>de Remembramento (exceto se vinculado a pedido edilício do SLCe)</li>
                    <li>de Reparcelamento (exceto se vinculado a pedido edilício do SLCe)</li>
                    <li>de Instalação de Heliponto</li>
                    <li>de Implantação de Estação Rádio-Base - ERB</li>
                  </ul>
                </li>
                <li>
                  Autorização
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>
                      Avanço de Grua sobre o Espaço Público (relacionado a obra licenciada por documento emitido pelo
                      AD)
                    </li>
                    <li>
                      Avanço do Tapume sobre Parte do Passeio Público (relacionado a obra dispensada de licença ou
                      licenciada por documento emitido pelo AD)
                    </li>
                    <li>
                      Implantação e/ou Utilização de Estande de Vendas (relacionado a obra licenciada por documento
                      emitido pelo AD)
                    </li>
                  </ul>
                </li>
                <li>Certificado de Conclusão (de edificação licenciada por documento emitido pelo AD)</li>
                <li>Isenção da Taxa para Exame e Verificação (de documentos emitidos pelo AD)</li>
                <li>Apostilamento (de documentos emitidos pelo AD)</li>
                <li>Revalidação (de documentos emitidos pelo AD)</li>
                <li>
                  Documentos auxiliares
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Certidão de Conformidade (emitida nos processos de Desmembramento / Loteamento)</li>
                    <li>Certidão de Diretrizes Urbanísticas</li>
                  </ul>
                </li>
                <li>
                  Procedimentos específicos
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>
                      Plano Integrado
                      <ul className="list-disc pl-6 mt-1 space-y-1">
                        <li>
                          Alvará de Desmembramento / Loteamento + Alvará de Aprovação e/ou Execução de Edificação Nova
                        </li>
                      </ul>
                    </li>
                    <li>
                      Programa Pode Entrar
                      <ul className="list-disc pl-6 mt-1 space-y-1">
                        <li>Alvará de Aprovação e/ou Execução de Edificação Nova (HIS/HMP)</li>
                      </ul>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <a
                href="http://slce.prefeitura.sp.gov.br/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                SLCe
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Alvará (incluindo de Projeto Modificativo / Apostilamento / Revalidação)
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>de Aprovação e Execução para Residência Unifamiliar (de Edificação Nova / Reforma)</li>
                  </ul>
                </li>
                <li>
                  Alvará (incluindo Apostilamento / Revalidação)
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>
                      de Execução de Demolição (total ou parcial da edificação, quando incluído no licenciamento edilício
                      dado por documento emitido pelo SLCe, ou total da edificação, quando desvinculado de licenciamento
                      edilício)
                    </li>
                    <li>
                      de Execução de Movimento de Terra (quando incluído no licenciamento edilício dado por documento
                      emitido pelo SLCe)
                    </li>
                    <li>
                      de Execução de Muro de Arrimo (quando incluído no licenciamento edilício dado por documento
                      emitido pelo SLCe)
                    </li>
                    <li>de Desmembramento (vinculado a pedido edilício do SLCe)</li>
                    <li>de Remembramento (vinculado a pedido edilício do SLCe)</li>
                    <li>de Reparcelamento (vinculado a pedido edilício do SLCe)</li>
                  </ul>
                </li>
                <li>
                  Autorização
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>
                      Avanço de Grua sobre o Espaço Público (relacionado a obra licenciada por documento emitido pelo
                      SLCe)
                    </li>
                    <li>
                      Avanço do Tapume sobre Parte do Passeio Público (relacionado a obra licenciada por documento
                      emitido pelo SLCe)
                    </li>
                    <li>
                      Implantação e/ou Utilização de Estande de Vendas (relacionado a obra licenciada por documento
                      emitido pelo SLCe ou pelo SISACOE, exceto pelo procedimento Aprova Rápido)
                    </li>
                  </ul>
                </li>
                <li>
                  Certificado de Conclusão
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>edilício (de edificação licenciada por documento emitido pelo SLCe, exceto demolição)</li>
                    <li>de Demolição (relacionado a demolição licenciada por documento emitido pelo SLCe)</li>
                  </ul>
                </li>
                <li>
                  Comunicações
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>de Execução de Obras Emergenciais</li>
                    <li>de Transferência de Responsabilidade Técnica (de documentos emitidos pelo SLCe)</li>
                    <li>de Substituição de Responsabilidade Técnica (de documentos emitidos pelo SLCe)</li>
                    <li>de Baixa de Responsabilidade Técnica (de documentos emitidos pelo SLCe)</li>
                    <li>de Assunção de Responsabilidade Técnica (de documentos emitidos pelo SLCe)</li>
                    <li>de Início de Obra (licenciada por documento emitido pelo SLCe)</li>
                    <li>de Paralização de Obra (licenciada por documento emitido pelo SLCe)</li>
                    <li>de Reinício de Obra Paralisada (licenciada por documento emitido pelo SLCe)</li>
                  </ul>
                </li>
                <li>Projeto Modificativo (de documentos emitidos pelo SLCe)</li>
                <li>Apostilamento (de documentos emitidos pelo SLCe)</li>
                <li>Revalidação (de documentos emitidos pelo SLCe)</li>
                <li>
                  pedidos auxiliares
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Vistas (de processo do SLCe)</li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <span className="font-semibold text-foreground">
                Requerimento Web (Sistema de Administração do Código de Obras e Edificações - SISACOE)
              </span>{' '}
              (
              <a
                href="https://www3.prefeitura.sp.gov.br/sd2110/Forms/sisacoePH.aspx"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                link
              </a>
              ) e{' '}
              <a
                href="https://processos.prefeitura.sp.gov.br/Forms/PedidoEletronico1.aspx"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal de Processos (Sistema Eletrônico de Informações - SEI)
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Procedimentos específicos
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>
                      Aprova Rápido
                      <ul className="list-disc pl-6 mt-1 space-y-1">
                        <li>
                          Alvará (incluindo de Projeto Modificativo)
                          <ul className="list-disc pl-6 mt-1 space-y-1">
                            <li>de Aprovação e/ou Execução de Edificação Nova (HIS/HMP ou não)</li>
                          </ul>
                        </li>
                        <li>
                          Autorização de Implantação e/ou Utilização de Estande de Vendas (emitida nos processos de
                          Alvará / Projeto Modificativo de Aprovação e/ou Execução de Edificação Nova - HIS/HMP ou
                          não, no procedimento Aprova Rápido)
                        </li>
                      </ul>
                    </li>
                    <li>
                      Requalifica Rápido
                      <ul className="list-disc pl-6 mt-1 space-y-1">
                        <li>
                          Alvará / Projeto Modificativo
                          <ul className="list-disc pl-6 mt-1 space-y-1">
                            <li>de Requalificação</li>
                          </ul>
                        </li>
                        <li>
                          Autorização de Implantação e/ou Utilização de Estande de Vendas (emitida nos processos de
                          Alvará / Projeto Modificativo de Requalificação, no procedimento Requalifica Rápido)
                        </li>
                      </ul>
                    </li>
                  </ul>
                </li>
                <li>
                  Apostilamento (de documentos emitidos através dos procedimentos Aprova Rápido / Requalifica Rápido)
                </li>
              </ul>
            </li>

            <li>
              <span className="font-semibold text-foreground">
                Requerimento Web (SISACOE) e autuação pelo e-mail{' '}
              </span>
              <a
                href="mailto:capdeprot@prefeitura.sp.gov.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                capdeprot@prefeitura.sp.gov.br
              </a>{' '}
              <span className="font-semibold text-foreground">
                (no Sistema Eletrônico de Informações - SEI por SMUL/CAP/DEPROT)
              </span>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Alvará de Execução de Reconstrução</li>
                <li>
                  Alvará / Renovação
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>de Autorização para eventos públicos e temporários</li>
                  </ul>
                </li>
                <li>Certificado de Regularização (exceto pela Lei nº 17.202/2019)</li>
                <li>
                  Notificação de Exigências Complementares - NEC (emitida nos processos de Certificado de Regularização
                  - exceto pela Lei nº 17.202/2019)
                </li>
                <li>Termo de Consentimento para Atividade Edilícia Pública - TCAEP</li>
                <li>
                  Apostilamento (de documentos emitidos pelo SISACOE, incluindo Transferência, Substituição, Baixa e
                  Assunção de Responsabilidade Técnica)
                </li>
              </ul>
            </li>

            <li>
              <a
                href="https://slce.prefeitura.sp.gov.br/PaginasPublicas/ValidacaoInicial.aspx"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                SLC (SLC2, SLCII)
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Certificado de Conclusão
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>edilício (de edificação licenciada por documento emitido pelo SISACOE, exceto demolição)</li>
                    <li>de Demolição (de demolição licenciada por documento emitido pelo SISACOE)</li>
                  </ul>
                </li>
                <li>
                  Autorização
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>
                      Avanço de Grua sobre o Espaço Público (relacionado a obra licenciada por documento emitido pelo
                      SISACOE, exceto TCAEP ou pelo procedimento Aprova Rápido ou Requalifica Rápido)
                    </li>
                    <li>
                      Avanço do Tapume sobre Parte do Passeio Público (relacionado a obra licenciada por documento
                      emitido pelo SISACOE, exceto TCAEP ou pelo procedimento Aprova Rápido ou Requalifica Rápido)
                    </li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <a
                href="https://portaldelicenciamento.prefeitura.sp.gov.br/prodam/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Plataforma de Regularização de Edificações (“Portal de Licenciamento”)
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Certificado de Regularização (Lei nº 17.202/2019)</li>
                <li>
                  Notificação de Exigências Complementares - NEC (emitida nos processos de Certificado de
                  Regularização - Lei nº 17.202/2019)
                </li>
              </ul>
            </li>

            <li>
              <a
                href="https://www.geoinfra.prefeitura.sp.gov.br/login"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Sistema de Gestão de Infraestrutura Urbana - GEOINFRA
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Autorização para Execução de Obras de Infraestrutura Urbana (execução de serviço ou obra nas vias e
                  espaços públicos municipais)
                </li>
                <li>
                  Documentos auxiliares:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>
                      Termo de Permissão de Uso - TPU (emitido nos processos de Autorização para Execução de Obras de
                      Infraestrutura Urbana)
                    </li>
                    <li>
                      Alvará de Instalação (emitido nos processos de Autorização para Execução de Obras de
                      Infraestrutura Urbana)
                    </li>
                    <li>
                      Alvará de Manutenção (emitido nos processos de Autorização para Execução de Obras de
                      Infraestrutura Urbana)
                    </li>
                    <li>
                      Termo de Permissão para Ocupação de Vias - TPOV (emitido nos processos de Autorização para
                      Execução de Obras de Infraestrutura Urbana)
                    </li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <a
                href="https://processos.prefeitura.sp.gov.br/Forms/PedidoEletronico1.aspx"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal de Processos (Sistema Eletrônico de Informações - SEI)
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Cadastro de Estação Rádio-Base - ERB móvel</li>
                <li>
                  Apostilamentos (de documentos emitidos pelo SLC, também conhecido como SLC2 ou SLCII - Portaria SMSP
                  nº 8/2013)
                </li>
                <li>
                  Pedidos auxiliares:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Vistas (de processo SEI)</li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <span className="font-semibold text-foreground">
                Protocolo pelo e-mail{' '}
                <a
                  href="mailto:capdeprot@prefeitura.sp.gov.br"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline hover:text-blue-700 font-semibold"
                >
                  capdeprot@prefeitura.sp.gov.br
                </a>{' '}
                (autuação no Sistema Eletrônico de Informações - SEI por SMUL/CAP/DEPROT)
              </span>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Alvará (incluindo de Projeto Modificativo)
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>de Aprovação e/ou Execução de Movimento de Terra (exceto se incluído no licenciamento edilício)</li>
                  </ul>
                </li>
                <li>
                  Alvará
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>de Execução de Muro de Arrimo (exceto se incluído no licenciamento edilício)</li>
                    <li>
                      de Execução de Demolição de Bloco Isolado (exceto se incluído no licenciamento edilício - Lei nº
                      16.642/2017 - art. 23 - V)
                    </li>
                  </ul>
                </li>
                <li>
                  Autorização
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>
                      Avanço de Grua sobre o Espaço Público (relacionado a obra licenciada por TCAEP ou pelo
                      procedimento Aprova Rápido ou Requalifica Rápido)
                    </li>
                    <li>
                      Avanço do Tapume sobre Parte do Passeio Público (relacionado a obra licenciada por TCAEP ou pelo
                      procedimento Aprova Rápido ou Requalifica Rápido)
                    </li>
                    <li>Instalação de Canteiro de Obras em Imóvel Distinto daquele em que a Obra será Executada</li>
                  </ul>
                </li>
                <li>Auto de Licença de Funcionamento de Heliponto</li>
                <li>
                  Comunicar término de fundações e/ou andamento da obra (Decreto nº 57.776/2017 - art. 22 - § 1º - I e
                  III)
                </li>
                <li>
                  Documentos auxiliares:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Oficialização e desoficialização de logradouros</li>
                    <li>Declaração de Potencial Construtivo Passível de Transferência</li>
                    <li>Certidão de Transferência do Direito de Construir</li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <span className="font-semibold text-foreground">
                Protocolo na Rua Boa Vista, 128, Térreo, Centro Histórico, de segunda a sexta-feira, das 10h às 15h
              </span>{' '}
              (autuação no Sistema Eletrônico de Informações - SEI por SMT/Protocolo -{' '}
              <a
                href="mailto:smtprotocolo@prefeitura.sp.gov.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                smtprotocolo@prefeitura.sp.gov.br
              </a>
              )
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Documentos auxiliares:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Certidão de Diretrizes para Pólo Gerador de Tráfego - PGT</li>
                    <li>Termo de Recebimento e Aceitação Parcial - TRAP</li>
                    <li>Termo de Recebimento e Aceitação Definitivo - TRAD</li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <a
                href="https://eventos.cetsp.com.br/View/EvInicio.aspx"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                e-Eventos
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Autorização para Ocupação ou Interferência em Via Pública - TPOV (para desvio do trânsito de
                  pedestres para o leito carroçável)
                </li>
              </ul>
            </li>

            <li>
              Protocolo pelo e-mail{' '}
              <a
                href="mailto:dao@cetsp.com.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                dao@cetsp.com.br
              </a>{' '}
              (autuação no Sistema Eletrônico de Informações - SEI por CET/DAF/SGT/GOB/DAO)
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Termo de Permissão para Ocupação de Vias – TPOV (não sujeito ao licenciamento pelo GEOINFRA)</li>
              </ul>
            </li>

            <li>
              <a
                href="https://vreredesim.sp.gov.br/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Via Rápida Empresa - VRE
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Certificado de Licenciamento Integrado</li>
                <li>Auto de Licença de Funcionamento - ALF (apto à emissão automática)</li>
              </ul>
            </li>

            <li>
              Protocolo nas Praças de Atendimento das Subprefeituras (
              <a
                href="https://sp156.prefeitura.sp.gov.br/portal/outros-canais-de-atendimento#praca-atendimento"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                endereços
              </a>
              )
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Auto de Licença de Funcionamento - ALF (não apto à emissão automática pelo VRE)</li>
                <li>Termo de cooperação para instalação, manutenção e remoção do parklet</li>
                <li>Rebaixamento e chanframento de guias para acesso de veículos (Decreto nº 52.903/2012 - art. 25 e 27)</li>
                <li>
                  Abertura de gárgulas sob o passeio público para escoamento das águas pluviais (Decreto nº
                  52.903/2012 - art. 25 e 27)
                </li>
              </ul>
            </li>

            <li>
              <a
                href="https://tolegal.prefeitura.sp.gov.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal Tô Legal
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Portaria de Autorização
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>para Comércio e Prestação de Serviços</li>
                    <li>para Comércio Porta a Porta</li>
                  </ul>
                </li>
                <li>
                  Termos de Permissão de Uso - TPUs
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Valet</li>
                    <li>Mesas, Cadeiras e Toldos</li>
                    <li>Compartilhamento de bicicletas</li>
                    <li>Compartilhamento de Patinetes Elétricas</li>
                    <li>Comida de rua</li>
                    <li>Banca de jornais e revistas</li>
                    <li>Banca de flores</li>
                    <li>Ambulante</li>
                    <li>Feira Livre</li>
                    <li>Mercados</li>
                    <li>Sacolões</li>
                    <li>Espaço Legal</li>
                  </ul>
                </li>
                <li>Licença de Anúncio Indicativo</li>
              </ul>
            </li>

            <li>
              Protocolo pelo e-mail{' '}
              <a
                href="mailto:convias.erb@smsub.prefeitura.sp.gov.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                convias.erb@smsub.prefeitura.sp.gov.br
              </a>{' '}
              (autuação no Sistema Eletrônico de Informações - SEI via SMSUB/CONVIAS)
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Termo de Cadastramento Eletrônico de Mini ERB</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* SEGURANÇA */}
        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2
            id="seguranca"
            className="text-xl font-bold mb-4 text-primary"
          >
            Documentos de controle urbanístico (Segurança) - Sistemas e outros canais de solicitação
          </h2>

          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>
              <a
                href="https://www.portaldolicenciamentosp.com.br/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Aprova Digital-AD
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Alvará de Funcionamento para Local de Reunião</li>
                <li>
                  Certificado
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>de Segurança</li>
                    <li>de Estanqueidade</li>
                  </ul>
                </li>
                <li>
                  Cadastros / Manutenção
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>de Tanque de armazenagem, bomba, filtro de combustível e equipamentos afins</li>
                    <li>de Sistema Especial de Segurança</li>
                  </ul>
                </li>
                <li>
                  Intimação para Execução de Obras e Serviços - IEOS (emitida nos processos de Alvará de Funcionamento
                  para Local de Reunião e Certificado de Segurança)
                </li>
              </ul>
            </li>

            <li>
              Protocolo pelo e-mail{' '}
              <a
                href="mailto:capdeprot@prefeitura.sp.gov.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                capdeprot@prefeitura.sp.gov.br
              </a>{' '}
              (autuação no Sistema Eletrônico de Informações - SEI por SMUL/CAP/DEPROT)
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Concessão de Registro das empresas conservadoras de elevadores</li>
                <li>Comunicação de modernização de Aparelho de Transporte Vertical e Horizontal</li>
                <li>Certificado de Manutenção (do Sistema de Segurança – emitido pelo Sistema SEL - SISSEL)</li>
                <li>
                  Pedidos auxiliares:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Baixa de aparelho de transporte</li>
                    <li>Baixa e Substituição de aparelho de transporte</li>
                    <li>Desativação de aparelho de transporte</li>
                    <li>Alteração do cadastro de equipamento mecânico de transporte permanente</li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <a
                href="https://processos.prefeitura.sp.gov.br/Forms/PedidoEletronico1.aspx"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal de Processos (Sistema Eletrônico de Informações - SEI)
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Ficha de Inscrição no Cadastro de Manutenção dos Sistemas de Segurança Contra Incêndios das
                  Edificações - FICAM (emitido pelo Sistema SEL - SISSEL)
                </li>
              </ul>
            </li>

            <li>
              <a
                href="http://www3.prefeitura.sp.gov.br/sd0244_taxa/cadastroEletronico"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Sistema ELEV
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Cadastro de Equipamento mecânico de transporte permanente</li>
                <li>
                  Pedidos auxiliares:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Assunção de Responsabilidade Técnica</li>
                    <li>Baixa de Responsabilidade Técnica</li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <a
                href="http://ria.prefeitura.sp.gov.br/sd0244/Welcome.do"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                RIA Online
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Relatório de Inspeção Anual</li>
              </ul>
            </li>

            <li>
              Protocolo nas Praças de Atendimento das Subprefeituras (
              <a
                href="http://ria.prefeitura.sp.gov.br/sd0244/Welcome.do"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                endereços
              </a>
              )
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Desembargo de Obra</li>
                <li>
                  Alvará de Licença para executar desmonte de rocha, matacões, resíduos de construção civil (Portaria
                  SMSUB nº 8/2015)
                </li>
              </ul>
            </li>
          </ul>
        </section>

        {/* SANITÁRIO */}
        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2
            id="salubridade"
            className="text-xl font-bold mb-4 text-primary"
          >
            Documentos de controle urbanístico (Sanitário) - Sistemas e outros canais de solicitação
          </h2>

          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>
              <a
                href="http://ria.prefeitura.sp.gov.br/sd0244/Welcome.do"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal 156
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Licença de Funcionamento Sanitária</li>
                <li>Renovação de Licença de Funcionamento Sanitária</li>
                <li>
                  Pedidos auxiliares:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>
                      Alteração
                      <ul className="list-disc pl-6 mt-1 space-y-1">
                        <li>de endereço</li>
                        <li>de razão social</li>
                        <li>de responsável legal</li>
                        <li>do número ou tipo de equipamentos isentos de licença</li>
                      </ul>
                    </li>
                    <li>Exclusão ou inclusão de responsável técnico</li>
                    <li>Ampliação ou redução de atividades, classe ou categoria de produtos</li>
                    <li>Inclusão ou exclusão de veículos</li>
                    <li>Retificação do Cadastro Municipal de Vigilância em Saúde – CMVS</li>
                    <li>Cancelamento</li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </section>

        {/* ACESSIBILIDADE */}
        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2
            id="acessibilidade"
            className="text-xl font-bold mb-4 text-primary"
          >
            Documentos de controle urbanístico (Acessibilidade) - Sistemas e outros canais de solicitação
          </h2>

          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>
              <a
                href="https://www.portaldolicenciamentosp.com.br/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Aprova Digital - AD
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Certificado de Acessibilidade</li>
                <li>
                  Intimação para Execução de Obras e Serviços - IEOS (emitida nos processos de Certificado de
                  Acessibilidade)
                </li>
              </ul>
            </li>

            <li>
              <a
                href="http://sp156.prefeitura.sp.gov.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal 156
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Selo de Acessibilidade Arquitetônica</li>
              </ul>
            </li>
          </ul>
        </section>

        {/* AMBIENTAL */}
        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2
            id="ambiental"
            className="text-xl font-bold mb-4 text-primary"
          >
            Documentos de controle ambiental - Sistemas e outros canais de solicitação
          </h2>

          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>
              <a
                href="https://licenciamentoambiental.prefeitura.sp.gov.br/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Plataforma de Licenciamento Ambiental Industrial
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Licença Ambiental (para empreendimentos industriais geradores de impacto local - exceto de grande
                  porte)
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Prévia - LAP</li>
                    <li>de Instalação - LAI</li>
                    <li>de Operação - LAO</li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <a
                href="http://sp156.prefeitura.sp.gov.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal 156
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Termo de Compromisso Ambiental - TCA para manejo arbóreo</li>
                <li>Certificado Ambiental (total ou parcial)</li>
                <li>Comunicação de poda de árvore em área interna</li>
                <li>Autorização para remoção de árvore em área interna</li>
                <li>Avaliação de árvore em calçadas e praças</li>
                <li>Termo de Ajustamento de Conduta - TAC Ambiental</li>
                <li>Manifestação de SVMA sobre Áreas Contaminadas</li>
                <li>Avaliação prévia de SVMA para implantação de Estação Rádio-Base</li>
                <li>
                  Pedidos auxiliares:
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Vistas (de processos do Grupo Técnico de Áreas Contaminadas - GTAC)</li>
                    <li>Envio de documentos e/ou alterações de TAC</li>
                  </ul>
                </li>
              </ul>
            </li>

            <li className="list-none mt-4 text-muted-foreground">
              <span className="font-semibold text-foreground">
                Protocolo na Rua do Paraíso, nº 387, Térreo, Paraíso, de segunda a sexta-feira, das 8h às 17h ou pelo
                e-mail{' '}
                <a
                  href="mailto:svmaprotocolo@prefeitura.sp.gov.br"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline hover:text-blue-700 font-semibold"
                >
                  svmaprotocolo@prefeitura.sp.gov.br
                </a>{' '}
                (autuação no Sistema Eletrônico de Informações - SEI por SVMA/DIM)
              </span>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  Certificado de Dispensa de Licença Ambiental - CDLA (para Licença Ambiental de empreendimentos
                  geradores de impacto local)
                </li>
                <li>Licenças Ambientais (LAP, LAI, LAO, APRM, etc.)</li>
                <li>
                  Licença Ambiental (para Licença Ambiental de empreendimentos geradores de impacto local de grande
                  porte, exceto subestação de energia elétrica e linha de transmissão)
                </li>
                <li>Licença Ambiental para subestação de energia elétrica e linha de transmissão</li>
                <li>
                  Licenças Ambientais Concomitantes (para Licença Ambiental de empreendimentos geradores de impacto
                  local, exceto de grande porte e subestação de energia elétrica e linha de transmissão)
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Prévia - LAP e de Instalação - LAI</li>
                    <li>Prévia - LAP, de Instalação - LAI e de Operação - LAO</li>
                  </ul>
                </li>
                <li>Licença Ambiental de Operação - LAO (para regularização ou não)</li>
                <li>Prorrogação de Licença Ambiental de Instalação - LAI</li>
                <li>Renovação de Licença Ambiental de Operação - LAO</li>
                <li>Alvará Ambiental em APRM (para APRM Billings e Alto Juquery)</li>
                <li>Termo de Compromisso Ambiental - TCA para intervenção em Área de Preservação Permanente - APP</li>
                <li>
                  Termo de Compromisso Ambiental - TCA (associados a Projeto de Recuperação de Áreas Degradadas - PRAD,
                  remediação ambiental de áreas contaminadas, outras intervenções - mesmo quando associadas a
                  licenciamento ambiental próprio, e transferência de potencial construtivo sem previsão de doação de
                  área, Portaria SVMA nº 105/2024)
                </li>
                <li>
                  Declaração de encerramento de empreendimento industrial (obrigado a apresentar Memorial de
                  Caracterização do Empreendimento - MCE)
                </li>
                <li>Manifestação técnica para licenciamento ambiental pela CETESB</li>
                <li>Acompanhamento das exigências de RIV para fins de obtenção de Certificado de Conclusão</li>
                <li>
                  pedidos auxiliares
                  <ul className="list-disc pl-6 mt-1 space-y-1">
                    <li>Alteração de dados cadastrados de Licença Ambiental (emitida pelo município)</li>
                    <li>Análise de Termo de Referência (para Licença Ambiental de empreendimentos geradores de impacto local)</li>
                    <li>Análise de Estudo de Impacto Ambiental e Relatório de Impacto Ambiental - EIA/RIMA</li>
                    <li>
                      Análise de Estudo de Impacto de Vizinhança e Relatório de Impacto de Vizinhança – EIV/RIV para
                      heliponto
                    </li>
                    <li>Análise de Estudo de Viabilidade Ambiental – EVA</li>
                    <li>Análise de Estudo Ambiental Simplificado – EAS</li>
                    <li>
                      Manifestação técnica ambiental sobre Memorial de Caracterização do Empreendimento - MCE
                      (atividades industriais)
                    </li>
                    <li>Análise de Plano de Recuperação de Áreas Degradadas – PRAD</li>
                  </ul>
                </li>
              </ul>
            </li>
          </ul>
        </section>

        {/* CULTURAL */}
        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2
            id="cultural"
            className="text-xl font-bold mb-4 text-primary"
          >
            Documentos de controle cultural - Sistemas e outros canais de solicitação
          </h2>

          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>
              <a
                href="http://sp156.prefeitura.sp.gov.br"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal 156
              </a>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Autorização para intervenção em um bem tombado ou em processo de tombamento (manutenção, obra
                  emergencial, conservação, remembramento/desmembramento, reforma, construção nova, demolição, restauro,
                  anúncios ou instalação de ERB, na esfera municipal)
                </li>
                <li>
                  Autorização para intervenção em área envoltória de bem tombado ou bairro ambiental (tombado ou em
                  processo de tombamento, manutenção, obra emergencial, conservação, remembramento/desmembramento,
                  reforma, construção nova, demolição, restauro, anúncios ou instalação de ERB, na esfera municipal)
                </li>
                <li>
                  Autorização para realização de eventos / instalação temporária em bens tombados e áreas envoltórias
                </li>
                <li>Autorização para intervenção em um bem arqueológico (na esfera municipal)</li>
                <li>
                  Declaração de atendimento aos requisitos para instalação de ERB em área envoltória ou bairro tombado
                </li>
                <li>
                  Regularização (recomposição da legalidade frente à tutela cultural na esfera municipal - Lei nº
                  10.032/1985 - art. 34, Decreto nº 47.493/2006 - art. 9º - §§ 4º e 5º, e Resolução CONPRESP nº
                  54/2018 - 8)
                </li>
              </ul>
            </li>

            <li>
              <span className="font-semibold text-foreground">
                Protocolo pelo e-mail{' '}
                <a
                  href="mailto:dphapoiosei@prefeitura.sp.gov.br"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline hover:text-blue-700 font-semibold"
                >
                  dphapoiosei@prefeitura.sp.gov.br
                </a>{' '}
                (autuação no Sistema Eletrônico de Informações - SEI por SMC/CPH - Equipe de Apoio)
              </span>
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  Termo de Ajustamento de Conduta - TAC Cultural (por infrações relativas a bem tombado na esfera
                  municipal - Lei federal 7.347/1985 - art. 5º - § 6º, e Leis municipais nº 16.050/2014 - arts. 68 e
                  173 e nº 10.032/1985 - arts. 34-A e 34-B)
                </li>
                <li>
                  Atestado de Conservação (para Transferência do Potencial Construtivo, Resolução CONPRESP nº 54/2018 -
                  9)
                </li>
                <li>
                  Termo de Compromisso (atesta a inexistência de condições financeiras para custear o projeto e/ou
                  obras de restauro ou conservação do imóvel, Resolução CONPRESP nº 54/2018 - 10)
                </li>
              </ul>
            </li>
          </ul>
        </section>
      </main>
    </div>
  )
}
