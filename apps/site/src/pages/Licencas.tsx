export default function Licencas() {
  return (
    <div className="flex flex-col font-sans bg-muted/30">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 py-6 px-4 max-w-[900px] mx-auto w-full border-b border-border">
        <h1 className="text-2xl font-bold m-0 text-foreground">
          Informações sobre licenças emitidas e denúncias
        </h1>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-[900px] mx-auto w-full space-y-8 pb-12">
        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <p className="mb-0 text-card-foreground">
            Abaixo, estão disponíveis fontes de consulta sobre documentos de controle urbanístico e cadastros
            auxiliares:
          </p>
        </section>

        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <ul className="list-disc pl-6 space-y-4 text-muted-foreground">
            <li>
              <strong className="text-foreground">Geral</strong>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  <a
                    href="https://diariooficial.prefeitura.sp.gov.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Diário Oficial
                  </a>{' '}
                  Busca em Matérias, ou Baixar Edição (para edição paginada)
                </li>
                <li>
                  <a
                    href="https://www.imprensaoficial.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Diário Oficial (antigo)
                  </a>{' '}
                  {'>'} Busca Avançada {'>'} Diário Oficial da Cidade de SP
                </li>
                <li>
                  <a
                    href="https://geosampa.prefeitura.sp.gov.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    GeoSampa
                  </a>{' '}
                  (nas camadas Licenciamento e Licenciamento Ambiental, e também em Pesquisar {'>'} Licenciamento)
                </li>
                <li>
                  <a
                    href="https://capital.sp.gov.br/web/licenciamento/w/servicos/156417"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Relatórios de Aprovação (SMUL)
                  </a>
                </li>
                <li>
                  <a
                    href="https://www3.prefeitura.sp.gov.br/deolhonaobra/Forms/frmConsultaSlc.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    De Olho na Obra
                  </a>
                </li>
                <li>
                  <a
                    href="https://processos.prefeitura.sp.gov.br/Forms/consultarProcessos.aspx#!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Consulta de Processos
                  </a>
                </li>
                <li>
                  <a
                    href="https://capital.sp.gov.br/web/licenciamento/w/servicos/5513"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Relação de aparelho de transporte mecânico
                  </a>{' '}
                  {'>'} Relação de aparelho de transporte mecânico por endereço
                </li>
                <li>
                  <a
                    href="https://capital.sp.gov.br/web/licenciamento/w/servicos/5513"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Relação das Empresas Conservadoras de aparelhos de transporte mecânico
                  </a>{' '}
                  {'>'} Relação das Empresas Conservadoras
                </li>
              </ul>
            </li>

            <li>
              <strong className="text-foreground">Específicos</strong>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  <a
                    href="https://www.portaldolicenciamentosp.com.br/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Documentos emitidos pelo Aprova Digital
                  </a>
                </li>
                <li>
                  <a
                    href="http://www3.prefeitura.sp.gov.br/sd0241_slc_web_atcd/ConfirmarAutenticidade.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Documentos emitidos pelo SISACOE, SLC (SLC2/SLCII) e SLCe
                  </a>
                </li>
                <li>
                  <a
                    href="https://portaldelicenciamento.prefeitura.sp.gov.br/prodam/ConsultaLicenca/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Documentos emitidos pela Plataforma de Regularização de Edificações (“Portal de Licenciamento”)
                  </a>
                </li>
                <li>
                  <a
                    href="https://sei.prefeitura.sp.gov.br/sei/controlador_externo.php?acao=documento_conferir&id_orgao_acesso_externo=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Documentos do Sistema Eletrônico de Informações - SEI
                  </a>
                </li>
                <li>
                  <a
                    href="https://tolegal.prefeitura.sp.gov.br/AutenticidadeDocumento"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Documentos do Tô Legal
                  </a>
                </li>
                <li>
                  <a
                    href="http://www3.prefeitura.sp.gov.br/sd0219_emissaodocumento/PaginasPublicas/frm09ConsultaPedido.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Histórico da Edificação
                  </a>
                </li>
                <li>
                  <a
                    href="http://www3.prefeitura.sp.gov.br/sd0219_emissaodocumento/PaginasPublicas/frm09ConsultaPedido.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Certificado de Regularidade da Edificação
                  </a>
                </li>
                <li>
                  <a
                    href="http://www3.prefeitura.sp.gov.br/sd0219_emissaodocumento/PaginasPublicas/frm09ConsultaPedido.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Notificação de Irregularidade da Edificação
                  </a>
                </li>
                <li>
                  <a
                    href="http://www3.prefeitura.sp.gov.br/sd0219_emissaodocumento/PaginasPublicas/frm09ConsultaPedido.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Certidão de Logradouro
                  </a>
                </li>
                <li>
                  <a
                    href="http://www3.prefeitura.sp.gov.br/sd0219_emissaodocumento/PaginasPublicas/frm09ConsultaPedido.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Certidão de Numeração
                  </a>
                </li>
                <li>
                  <a
                    href="https://consultadiretrizes.prefeitura.sp.gov.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Certidão de Diretrizes para Pólo Gerador de Tráfego - PGT
                  </a>
                </li>
                <li>
                  <a
                    href="https://e-licenca.prefeitura.sp.gov.br/LicenciamentoInternet/ConsultaLicenca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Auto de Licença de Funcionamento - ALF (consultar)
                  </a>
                </li>
                <li>
                  <a
                    href="https://e-licenca.prefeitura.sp.gov.br/LicenciamentoInternet/EmitirALF/emitir"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Auto de Licença de Funcionamento - ALF (autenticidade)
                  </a>
                </li>
                <li>
                  <a
                    href="https://sivisa.saude.sp.gov.br/sivisa/cidadao/cidadaoLicenca.consultaEstabelecimento.logic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Licença de Funcionamento Sanitária (consultar)
                  </a>
                </li>
                <li>
                  <a
                    href="https://sivisa.saude.sp.gov.br/sivisa/cidadao/cidadaoLicenca.consulta.logic"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Licença de Funcionamento Sanitária (autenticidade)
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.jucesp.sp.gov.br/IntegradorPaulista/ConsultaPublica"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Certificado de Licenciamento Integrado
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.google.com/maps/d/viewer?mid=15_gph2WVkC5C_vejsOE5qd55eYZKFWCq&femb=1&ll=-23.553423435757097%2C-46.56867589999999&z=12"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Cadastro no Projeto Ruas SP
                  </a>
                </li>
              </ul>
            </li>
          </ul>

          <h2 className="text-xl font-bold mb-4 mt-8 text-primary">
            <strong>Denúncias - Canais disponíveis</strong>
          </h2>
          <ul className="list-disc pl-6 space-y-4 text-muted-foreground">
            <li>
              <strong className="text-foreground">Geral</strong>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  <a
                    href="https://sp156.prefeitura.sp.gov.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Portal 156
                  </a>
                </li>
                <li>Central Telefônica 156</li>
                <li>
                  Praças de Atendimento das Subprefeituras (
                  <a
                    href="https://sp156.prefeitura.sp.gov.br/portal/outros-canais-de-atendimento#praca-atendimento"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    Endereços
                  </a>
                  )
                </li>
                <li>
                  Descomplica SP (
                  <a
                    href="https://sp156.prefeitura.sp.gov.br/portal/descomplica"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    endereços
                  </a>
                  )
                </li>
              </ul>
            </li>

            <li>
              <strong className="text-foreground">Segurança</strong>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  <a
                    href="mailto:denuncias.contru@prefeitura.sp.gov.br"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    denuncias.contru@prefeitura.sp.gov.br
                  </a>
                </li>
              </ul>
            </li>

            <li>
              <strong className="text-foreground">Ambiental</strong>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  Guarda Civil Metropolitana - Inspetoria de Defesa Ambiental - IDAM (
                  <a
                    href="https://capital.sp.gov.br/web/guarda_civil/w/enderecos/8604"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    maiores informações
                  </a>
                  )
                </li>
              </ul>
            </li>

            <li>
              <strong className="text-foreground">Direitos do consumidor</strong>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  <strong className="text-foreground">PROCON Paulistano</strong> (Largo Páteo do Colégio, nº 5, Sé{' '}
                  <a
                    href="https://capital.sp.gov.br/web/procon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    maiores informações
                  </a>
                  )
                </li>
              </ul>
            </li>
          </ul>

          <h2 className="text-xl font-bold mb-4 mt-8 text-primary">
            <strong>Dicas de Pesquisa</strong>
          </h2>
          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>
              <strong className="text-foreground">
                Os processos municipais possuem vários padrões de numeração diferentes:
              </strong>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  1. antes de 1978, os processos eram numerados em uma sequência numérica seguida do ano (ex.:
                  99.999/51, para um processo de 1951);
                </li>
                <li>
                  2. entre 1978 e 1997, o padrão 99-999.999-78*99 (número de etiqueta, para um processo de 1978);
                </li>
                <li>
                  3. entre 1997 até hoje (sendo progressivamente substituído pelo SEI desde 2015), o padrão
                  1997-9.999.999-9 (Sistema Municipal de Processos - SIMPROC, para um processo de 1997); a depender da
                  fonte pesquisada, pode aparecer como 1997-9999999-9, 0000/1997-9.999.999-9 ou 0000-1997-9.999.999-9;
                </li>
                <li>
                  4. após 2015, o padrão 9999/2015-9.999.999-9 (Sistema Eletrônico de Informações - SEI, para um
                  processo de 2015); a depender da fonte pesquisada, pode aparecer como 9999/2015-9999999-9.
                </li>
              </ul>
            </li>

            <li>
              Além dos números de processo, sistemas como o SLC, SLCe, Portal de Regularização e Aprova Digital se
              utilizam de números de protocolo para diferenciar os pedidos iniciais dos pedidos recursais, no padrão
              9999-12 (para um processo de 2012); alguns pedidos possuem apenas esse número para busca (ex.: as
              Comunicações de Obra Emergencial, no SLCe); o Aprova Digital possui um número interno (às vezes também
              chamado de nº de protocolo) que contém números e letras (ex.: 99999-20-SP-ABC, para um processo de 2020).
            </li>

            <li>
              Os números de documento também variam com o tempo e com o sistema. Os mais recentes utilizam uma
              numeração sequencial finalizada em um dígito para a versão (ex.: 2012/1234-00 para o documento inicial de
              2012, e 2012/1234-01 para um primeiro apostilamento - mesmo que não em 2012). No Aprova Digital, o número
              do documento é o seu número interno, e suas versões são informadas dentro do documento.
            </li>

            <li>
              O Diário Oficial da Cidade - DOC (antes do Decreto nº 46.195, de 10 de Agosto de 2005, chamado Diário
              Oficial do Município - DOM) está disponível online:
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>
                  1. entre 02.12.1975 e 31.08.2001, na versão escaneada e com reconhecimento óptico de caracteres (OCR),
                  no Diário Oficial antigo;
                </li>
                <li>
                  2. entre 01.09.2001 e 28.02.2023, na versão digital, no Diário Oficial antigo;
                </li>
                <li>3. a partir de 01.03.2023, na versão digital, no Diário Oficial novo.</li>
              </ul>
            </li>

            <li>
              É possível solicitar uma pesquisa sobre a existência de processos e desarquivamento (planta/alvarás) de
              processos físicos arquivados pelo{' '}
              <a
                href="https://processos.prefeitura.sp.gov.br/Forms/PedidoEletronico1.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal de Processos (Sistema Eletrônico de Informações - SEI)
              </a>{' '}
              {'>'} Processo físico arquivado - Pesquisa de existência de processos e desarquivamento (Planta/Alvarás).
            </li>

            <li>
              Na página Consulta de Processos, podem estar disponíveis mais informações sobre comunicações (Comunique-ses)
              ou decisões (Despachos).
            </li>

            <li>
              No SEI, caso a pessoa se configure como interessada em documentos que estejam com aceso restrito, tem o
              direito a vistas, que podem ser solicitadas pelo{' '}
              <a
                href="https://processos.prefeitura.sp.gov.br/Forms/PedidoEletronico1.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                Portal de Processos (Sistema Eletrônico de Informações - SEI)
              </a>
              .
            </li>
          </ul>
        </section>
      </main>
    </div>
  )
}
