import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'

export default function Licencas() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen font-sans bg-[#f4f4f4]">
      {/* Fixed Header */}
      <header className="flex items-center justify-center fixed top-0 left-0 w-full h-[60px] bg-[#f5f5f5] z-[1000] border-b border-gray-200 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute left-[10px] bg-none border-none text-[16px] cursor-pointer hover:bg-[#bdbdbd] p-2 rounded transition-colors"
        >
          Voltar
        </button>
        <h1 className="m-0 text-[18px] font-bold">Informações sobre licenças emitidas e denúncias</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-[60px] p-[20px] max-w-[900px] mx-auto w-full">
        <section className="mb-[30px] bg-white p-[20px] rounded-[10px] shadow-sm">
            <p className="mb-0 text-[#333]">Abaixo, estão disponíveis fontes de consulta sobre documentos de controle urbanístico e cadastros auxiliares:</p>
        </section>

        <section className="mb-[30px] bg-white p-[20px] rounded-[10px] shadow-sm">
            <ul className="list-disc pl-[20px] space-y-4 text-[#333]">
                <li><strong>Geral</strong>
                    <ul className="list-disc pl-[20px] mt-2 space-y-2">
                        <li><a href="https://diariooficial.prefeitura.sp.gov.br/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Diário
                                Oficial</a> Busca em Matérias, ou Baixar Edição (para edição paginada)</li>
                        <li><a href="https://www.imprensaoficial.com.br/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Diário Oficial
                                (antigo)</a>&lt;/&gt; Busca Avançada &lt;/&gt; Diário Oficial da Cidade de SP</li>
                        <li><a href="https://geosampa.prefeitura.sp.gov.br/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">GeoSampa</a> (nas camadas Licenciamento e Licenciamento Ambiental, e também em Pesquisar &lt;/&gt; Licenciamento)</li>
                        <li><a href="https://capital.sp.gov.br/web/licenciamento/w/servicos/156417"
                                target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Relatórios de Aprovação (SMUL)</a></li>
                        <li><a href="https://www3.prefeitura.sp.gov.br/deolhonaobra/Forms/frmConsultaSlc.aspx" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">De Olho na Obra</a></li>
                        <li><a href="https://processos.prefeitura.sp.gov.br/Forms/consultarProcessos.aspx#!"
                                target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Consulta de Processos</a></li>
                        <li><a href="https://capital.sp.gov.br/web/licenciamento/w/servicos/5513"
                                target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Relação de aparelho de transporte mecânico</a> &lt;/&gt;Relação de aparelho de transporte mecânico por endereço</li>
                        <li><a href="https://capital.sp.gov.br/web/licenciamento/w/servicos/5513"
                                target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Relação das Empresas Conservadoras de aparelhos de transporte mecânico </a> &lt;/&gt;Relação das Empresas Conservadoras</li>
                    </ul>
                </li>
                <li><strong>Específicos</strong>
                    <ul className="list-disc pl-[20px] mt-2 space-y-2">
                        <li><a href="https://www.portaldolicenciamentosp.com.br/login" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Documentos emitidos pelo
                                Aprova Digital</a></li>
                        <li><a href="http://www3.prefeitura.sp.gov.br/sd0241_slc_web_atcd/ConfirmarAutenticidade.aspx" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Documentos emitidos pelo SISACOE, SLC (SLC2/SLCII) e SLCe</a></li>
                        <li><a href="https://portaldelicenciamento.prefeitura.sp.gov.br/prodam/ConsultaLicenca/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Documentos emitidos pelo Plataforma de Regularização de Edificações (“Portal de Licenciamento”)</a></li>
                        <li><a href="https://sei.prefeitura.sp.gov.br/sei/controlador_externo.php?acao=documento_conferir&id_orgao_acesso_externo=0" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Documentos do Sistema
                                Eletrônico de Informações - SEI</a></li>
                        <li><a href="https://tolegal.prefeitura.sp.gov.br/AutenticidadeDocumento" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Documentos do Tô Legal</a></li>
                        <li><a href="http://www3.prefeitura.sp.gov.br/sd0219_emissaodocumento/PaginasPublicas/frm09ConsultaPedido.aspx" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Histórico da Edificação</a></li>
                        <li><a href="http://www3.prefeitura.sp.gov.br/sd0219_emissaodocumento/PaginasPublicas/frm09ConsultaPedido.aspx" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Certificado de Regularidade da Edificação</a></li>
                        <li><a href="http://www3.prefeitura.sp.gov.br/sd0219_emissaodocumento/PaginasPublicas/frm09ConsultaPedido.aspx" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Notificação de Irregularidade da Edificação</a></li>
                        <li><a href="http://www3.prefeitura.sp.gov.br/sd0219_emissaodocumento/PaginasPublicas/frm09ConsultaPedido.aspx" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Certidão de Logradouro</a></li>
                        <li><a href="http://www3.prefeitura.sp.gov.br/sd0219_emissaodocumento/PaginasPublicas/frm09ConsultaPedido.aspx" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Certidão de Numeração</a></li>
                        <li><a href="https://consultadiretrizes.prefeitura.sp.gov.br/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Certidão de Diretrizes para Pólo Gerador de Tráfego - PGT</a></li>
                        <li><a href="https://e-licenca.prefeitura.sp.gov.br/LicenciamentoInternet/ConsultaLicenca"
                                target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Auto de Licença de Funcionamento - ALF (consultar)</a></li>
                        <li><a href="https://e-licenca.prefeitura.sp.gov.br/LicenciamentoInternet/EmitirALF/emitir"
                                target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Auto de Licença de Funcionamento - ALF (autenticidade)</a></li>
                        <li><a href="https://sivisa.saude.sp.gov.br/sivisa/cidadao/cidadaoLicenca.consultaEstabelecimento.logic"
                                target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Licença de Funcionamento Sanitária (consultar)</a></li>
                        <li><a href="https://sivisa.saude.sp.gov.br/sivisa/cidadao/cidadaoLicenca.consulta.logic"
                                target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Licença de Funcionamento Sanitária (autenticidade)</a></li>
                        <li><a href="https://www.jucesp.sp.gov.br/IntegradorPaulista/ConsultaPublica"
                                target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Certificado de Licenciamento Integrado</a></li>
                        <li><a href="https://www.google.com/maps/d/viewer?mid=15_gph2WVkC5C_vejsOE5qd55eYZKFWCq&femb=1&ll=-23.553423435757097%2C-46.56867589999999&z=12"
                                target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Cadastro no Projeto Ruas SP</a></li>
                </ul>
            </li>
        </ul>

        <h2 className="text-[20px] mb-[15px] text-[#2c3e50]"><strong>Denúncias - Canais disponíveis</strong></h2>
        <ul className="list-disc pl-[20px] space-y-4 text-[#333]">
            <li><strong>Geral</strong>
                <ul className="list-disc pl-[20px] mt-2 space-y-2">
                    <li><a href="https://sp156.prefeitura.sp.gov.br" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Portal 156</a></li>
                    <li>Central Telefônica 156</li>
                    <li>Praças de Atendimento das Subprefeituras(<a href="https://sp156.prefeitura.sp.gov.br/portal/outros-canais-de-atendimento#praca-atendimento"
                            target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Endereços</a>)</li>
                    <li>Descomplica SP(<a href="https://sp156.prefeitura.sp.gov.br/portal/descomplica"
                            target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">endereços</a>)</li>
                </ul>
            </li>
            <li><strong>Segurança</strong>
                <ul className="list-disc pl-[20px] mt-2 space-y-2">
                    <li><a href="mailto:denuncias.contru@prefeitura.sp.gov.br" className="text-[#2c3e50] hover:underline">denuncias.contru@prefeitura.sp.gov.br</a>
                    </li>
                </ul>
            </li>
            <li><strong>Ambiental</strong>
                <ul className="list-disc pl-[20px] mt-2 space-y-2">
                    <li>Guarda Civil Metropolitana - Inspetoria de Defesa Ambiental - IDAM (<a href="https://capital.sp.gov.br/web/guarda_civil/w/enderecos/8604"
                            target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">maiores informações</a>)</li>
                </ul>
            </li>
            <li><strong>Direitos do consumidor</strong>
                <ul className="list-disc pl-[20px] mt-2 space-y-2">
                    <li><strong>PROCON Paulistano</strong> (Largo Páteo do Colégio, nº 5, Sé <a href="https://capital.sp.gov.br/web/procon"
                            target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">maiores informações</a>)</li>
                </ul>
            </li>
        </ul>

        <h2 className="text-[20px] mb-[15px] mt-8 text-[#2c3e50]"><strong>Dicas de Pesquisa</strong></h2>
        <ul className="list-disc pl-[20px] space-y-3 text-[#333]">
            <li><strong>Os processos municipais possuem vários padrões de numeração diferentes:</strong>
                <ul className="list-disc pl-[20px] mt-2 space-y-2">
                    <li>1. antes de 1978, os processos eram numerados em uma sequência numérica seguida do ano (ex.: 99.999/51, para um processo de 1951);</li>
                    <li>2. entre 1978 e 1997, o padrão 99-999.999-78*99 (número de etiqueta, para um processo de 1978);</li>
                    <li>3. entre 1997 até hoje (sendo progressivamente substituído pelo SEI desde 2015), o padrão 1997-9.999.999-9 (Sistema Municipal de Processos - SIMPROC, para um processo de 1997); a depender da fonte pesquisada, pode aparecer como 1997-9999999-9, 0000/1997-9.999.999-9 ou 0000-1997-9.999.999-9;</li>
                    <li>4. após 2015, o padrão 9999/2015-9.999.999-9 (Sistema Eletrônico de Informações - SEI, para um processo de 2015); a depender da fonte pesquisada, pode aparecer como 9999/2015-9999999-9.</li>
                </ul>
            </li>
            <li>Além dos números de processo, sistemas como o SLC, SLCe, Portal de Regularização e Aprova Digital se utilizam de números de protocolo para diferenciar os pedidos iniciais dos pedidos recursais, no padrão 9999-12 (para um processo de 2012);  alguns pedidos possuem apenas esse número para busca (ex.: as Comunicações de Obra Emergencial, no SLCe); o Aprova Digital possui um número interno (às vezes também chamado de nº de protocolo) que contém números e letras (ex.: 99999-20-SP-ABC, para um processo de 2020).</li>
            <li>Os números de documento também variam com o tempo e com o sistema. Os mais recentes utilizam uma numeração sequencial finalizada em um dígito para a versão (ex.: 2012/1234-00 para o documento inicial de 2012, e 2012/1234-01 para um primeiro apostilamento - mesmo que não em 2012). No Aprova Digital, o número do documento é o seu número interno, e suas versões são informadas dentro do documento.</li>
            <li>O Diário Oficial da Cidade - DOC (antes do Decreto nº 46.195, de 10 de Agosto de 2005, chamado Diário Oficial do Município - DOM) está disponível online:
                <ul className="list-disc pl-[20px] mt-2 space-y-2">
                    <li>1. entre 02.12.1975 e 31.08.2001, na versão escaneada e com reconhecimento óptico de caracteres (OCR), no Diário Oficial antigo;</li>
                    <li>2. entre 01.09.2001 e 28.02.2023, na versão digital, no Diário Oficial antigo;</li>
                    <li>3. a partir de 01.03.2023, na versão digital, no Diário Oficial novo.</li>
                </ul>
            </li>
            <li>É possível solicitar uma pesquisa sobre a existência de processos e desarquivamento (planta/alvarás) de processos físicos arquivados pelo <a href="https://processos.prefeitura.sp.gov.br/Forms/PedidoEletronico1.aspx"
                            target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Portal de Processos (Sistema Eletrônico de Informações - SEI)</a> &lt;/&gt; Processo físico arquivado - Pesquisa de existência de processos e desarquivamento (Planta/Alvarás).</li>
            <li>Na página Consulta de Processos, podem estar disponíveis mais informações sobre comunicações (Comunique-ses) ou decisões (Despachos).</li>
            <li>No SEI, caso a pessoa se configure como interessada em documentos que estejam com aceso restrito, tem o direito a vistas, que podem ser solicitadas pelo <a href="https://processos.prefeitura.sp.gov.br/Forms/PedidoEletronico1.aspx"
                            target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline">Portal de Processos (Sistema Eletrônico de Informações - SEI)</a>.</li>

        </ul>
        </section>
      </main>

      <Footer />
    </div>
  )
}
