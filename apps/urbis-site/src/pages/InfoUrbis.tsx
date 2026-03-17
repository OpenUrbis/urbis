import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'

export default function InfoUrbis() {
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
        <h1 className="m-0 text-[18px] font-bold">+informações sobre legislação urbanística</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 mt-[60px] p-[20px] max-w-[900px] mx-auto w-full">
        <section className="mb-[30px] bg-white p-[20px] rounded-[10px] shadow-sm">
          <p className="mb-4 text-[#333]"><strong>As principais normativas urbanísticas do município são:</strong></p>
          <ul className="list-disc pl-[20px] space-y-2 text-[#333]">
            <li><a href="https://legislacao.prefeitura.sp.gov.br/leis/lei-16050-de-31-de-julho-de-2014/consolidado" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"> <strong>Plano Diretor Estratégico - PDE</strong></a></li>
            <li><a href="https://legislacao.prefeitura.sp.gov.br/leis/lei-16402-de-22-de-marco-de-2016/consolidado" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"> <strong>Lei de Parcelamento, Uso e Ocupação do Solo - LPUOS</strong></a></li>
            <li><a href="https://legislacao.prefeitura.sp.gov.br/leis/lei-16642-de-09-de-maio-de-2017/consolidado" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"> <strong>Código de Obras e Edificações - COE</strong></a></li>
          </ul>
        </section>

        <section className="mb-[30px] bg-white p-[20px] rounded-[10px] shadow-sm">
           <p className="mb-4 text-[#333]"><strong>
             A depender do interesse do que se pesquisa, porém, inúmeras outras normativas podem ser necessárias.
             Abaixo foram selecionadas algumas fontes de pesquisa normativa:
           </strong></p>
           <ul className="list-disc pl-[20px] space-y-3 text-[#333]">
              <li>
                <a href="https://legislacao.prefeitura.sp.gov.br/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Legislação Municipal</strong></a>
                :&nbsp;(Prefeitura) (mais completa fonte para pesquisas, apresentando dados de assinatura, publicação, situação, regulamentações, revogações, normas relacionadas, vetos e temas relacionados, além de em sua apresentação possuir links e versões consolidadas - que permite ver os conteúdos alterados - ou compiladas; entretanto, nem todo o seu conteúdo está digitalizado);
              </li>
              <li>
                <a href="https://www.saopaulo.sp.leg.br/atividade-legislativa/legislacao-municipal-biblioteca/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Legislação Municipal - Biblioteca </strong></a>
                :&nbsp;(Câmara de Vereadores) (possui todos os Projetos de Lei, Leis (e equivalentes) e Decretos, mas em geral digitalizados e sem reconhecimento óptico de caracteres - OCR);
              </li>
              <li>
                <a href="https://gestaourbana.prefeitura.sp.gov.br/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Gestão Urbana SP</strong></a>
                :&nbsp;(possui diversos materiais ilustrativos sobre as principais leis urbanísticas, além de mapas de lei em diversos formatos digitais, mas não possui estes materiais para as revisões destas normativas);
              </li>
              <li>
                <a href="https://www.imprensaoficial.com.br/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Diário Oficial da Cidade - DOC (antigo)</strong></a>
                {' '}&lt;/&gt; Busca Avançada &lt;/&gt; Diário Oficial da Cidade de SP (entre 12.1975 e 08.2001, versão escaneada e com reconhecimento óptico de caracteres - OCR; entre 09.2001 e 02.2023, versão digital);
              </li>
              <li>
                <a href="https://diariooficial.prefeitura.sp.gov.br/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Diário Oficial da Cidade - DOC</strong></a>
                &nbsp;&lt;/&gt; Busca em Matérias, ou Baixar Edição (para edição paginada) (a partir de 03.2023);
              </li>
              <li><a href="https://www.imprensaoficial.com.br/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Pesquisa de legislação (Estado)</strong></a></li>
              <li>
                <a href="https://www.imprensaoficial.com.br/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Diário Oficial do Estado - DOE  (antigo) </strong></a>
                {' '}&lt;/&gt; Busca Avançada &lt;/&gt; Executivo / Legislativo (até 06.03.2024)
              </li>            
              <li>
                <a href="http://www.doe.sp.gov.br" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Diário Oficial do Estado - DOE</strong></a>
                {' '}(a partir de 07.03.2024)
              </li>
              <li>
                <a href="https://www4.planalto.gov.br/legislacao" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Portal da Legislação (Presidência da República)</strong></a>
                &nbsp;&lt;/&gt; Legislação (algumas normas possuem apenas versão compilada, ou seja, não é possível ver os conteúdos alterados)
              </li>
              <li>
                <a href="https://www.in.gov.br/leiturajornal" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Diário Oficial da União - DOU</strong></a>
                :&lt;/&gt; Pesquisa Avançada &lt;/&gt; Data &lt;/&gt; Personalizado &lt;/&gt; Preencher o mesma data nos campos Início e Fim (ATENÇÃO: a mesma Seção pode possuir dois Cadernos, o Convencional - ex.: “nº 62” - ou Eletrônico - ex.: “nº 62-E”)
              </li>
              <li><a href="https://www.abntcolecao.com.br/mpf/grid.aspx" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Normas de Acessibilidade da ABNT</strong></a></li>

              <li>
                Tombamentos (esfera municipal):
                <ul className="list-disc pl-[20px] mt-1 space-y-1">
                    <li><a href="https://capital.sp.gov.br/web/cultura/w/conpresp/legislacao/resolucoes/1137" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Resoluções</strong></a></li>
                </ul>
              </li>
              <li>
                Tombamentos (esfera estadual):
                <ul className="list-disc pl-[20px] mt-1 space-y-1">
                    <li><a href="https://capital.sp.gov.br/web/cultura/w/cit/1157" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Resoluções do Condephaat</strong></a></li>
                    <li><a href="http://condephaat.sp.gov.br/resolucoes-de-tombamento-registro/" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Resoluções de Tombamento/Registro</strong></a></li>
                </ul>
              </li>
              <li>
                Tombamentos (esfera federal):
                <ul className="list-disc pl-[20px] mt-1 space-y-1">
                    <li><a href="https://capital.sp.gov.br/web/cultura/w/patrimonio_historico/28035" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Bens tombados pelo IPHAN no Município de São Paulo</strong></a></li>
                    <li><a href="http://portal.iphan.gov.br/uploads/ckfinder/arquivos/Lista%20bens%20tombados%20no%20estado%20de%20SP.pdf" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Bens tombados na Cidade de São Paulo</strong></a></li>
                    <li><a href="https://www.gov.br/iphan/pt-br/centrais-de-conteudo/legislacao/atos-normativos" target="_blank" rel="noopener noreferrer" className="text-[#2c3e50] hover:underline"><strong>Atos Normativos</strong></a></li>
                </ul>
              </li>
           </ul>
        </section>
      </main>

      <Footer />
    </div>
  )
}
