export default function GuiaLegislacaoUrbanistica() {
  return (
    <div className="flex flex-col font-sans bg-muted/30">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 py-6 px-4 max-w-[900px] mx-auto w-full border-b border-border">
        <h1 className="text-2xl font-bold m-0 text-foreground">
          Guia para a legislação urbanística
        </h1>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-[900px] mx-auto w-full space-y-8 pb-12">
        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <p className="mb-0 text-card-foreground">
            O Urbis possui um componente próprio sobre legislação, o{" "}
            <a
              href="https://legis.urbis.prefeitura.sp.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-700 font-semibold"
            >
              Legis
            </a>
            .
          </p>
        </section>

        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <p className="mb-4 text-card-foreground">
            <strong>
              As principais normativas urbanísticas do município são:
            </strong>
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>
              <a
                href="https://legislacao.prefeitura.sp.gov.br/leis/lei-16050-de-31-de-julho-de-2014/consolidado"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Plano Diretor Estratégico - PDE</strong>
              </a>
            </li>
            <li>
              <a
                href="https://legislacao.prefeitura.sp.gov.br/leis/lei-16402-de-22-de-marco-de-2016/consolidado"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>
                  Lei de Parcelamento, Uso e Ocupação do Solo - LPUOS
                </strong>
              </a>
            </li>
            <li>
              <a
                href="https://legislacao.prefeitura.sp.gov.br/leis/lei-16642-de-09-de-maio-de-2017/consolidado"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Código de Obras e Edificações - COE</strong>
              </a>
            </li>
          </ul>
        </section>

        <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <p className="mb-4 text-card-foreground">
            <strong>
              A depender do interesse do que se pesquisa, porém, inúmeras outras
              normativas podem ser necessárias. Abaixo foram selecionadas
              algumas fontes de pesquisa normativa:
            </strong>
          </p>
          <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
            <li>
              <a
                href="https://legislacao.prefeitura.sp.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Legislação Municipal</strong>
              </a>
              :&nbsp;(Prefeitura) (mais completa fonte para pesquisas,
              apresentando dados de assinatura, publicação, situação,
              regulamentações, revogações, normas relacionadas, vetos e temas
              relacionados, além de em sua apresentação possuir links e versões
              consolidadas - que permite ver os conteúdos alterados - ou
              compiladas; entretanto, nem todo o seu conteúdo está
              digitalizado);
            </li>
            <li>
              <a
                href="https://www.saopaulo.sp.leg.br/atividade-legislativa/legislacao-municipal-biblioteca/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Legislação Municipal - Biblioteca </strong>
              </a>
              :&nbsp;(Câmara de Vereadores) (possui todos os Projetos de Lei,
              Leis (e equivalentes) e Decretos, mas em geral digitalizados e sem
              reconhecimento óptico de caracteres - OCR);
            </li>
            <li>
              <a
                href="https://gestaourbana.prefeitura.sp.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Gestão Urbana SP</strong>
              </a>
              :&nbsp;(possui diversos materiais ilustrativos sobre as principais
              leis urbanísticas, além de mapas de lei em diversos formatos
              digitais, mas não possui estes materiais para as revisões destas
              normativas);
            </li>
            <li>
              <a
                href="https://www.imprensaoficial.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Diário Oficial da Cidade - DOC (antigo)</strong>
              </a>
              {" > "}Busca Avançada{" > "}Diário Oficial da Cidade de SP (entre
              12.1975 e 08.2001, versão escaneada e com reconhecimento óptico de
              caracteres - OCR; entre 09.2001 e 02.2023, versão digital);
            </li>
            <li>
              <a
                href="https://diariooficial.prefeitura.sp.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Diário Oficial da Cidade - DOC</strong>
              </a>
              &nbsp;{" > "}Busca em Matérias, ou Baixar Edição (para edição
              paginada) (a partir de 03.2023);
            </li>
            <li>
              <a
                href="https://www.imprensaoficial.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Pesquisa de legislação (Estado)</strong>
              </a>
            </li>
            <li>
              <a
                href="https://www.imprensaoficial.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Diário Oficial do Estado - DOE (antigo) </strong>
              </a>
              {" > "}Busca Avançada{" > "}Executivo / Legislativo (até
              06.03.2024)
            </li>
            <li>
              <a
                href="http://www.doe.sp.gov.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Diário Oficial do Estado - DOE</strong>
              </a>{" "}
              (a partir de 07.03.2024)
            </li>
            <li>
              <a
                href="https://www4.planalto.gov.br/legislacao"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Portal da Legislação (Presidência da República)</strong>
              </a>
              &nbsp;{" > "}Legislação (algumas normas possuem apenas versão
              compilada, ou seja, não é possível ver os conteúdos alterados)
            </li>
            <li>
              <a
                href="https://www.in.gov.br/leiturajornal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Diário Oficial da União - DOU</strong>
              </a>
              :{" > "}Pesquisa Avançada{" > "}Data{" > "}Personalizado{" > "}
              Preencher a mesma data nos campos Início e Fim (ATENÇÃO: a mesma
              Seção pode possuir dois Cadernos, o Convencional - ex.: “nº 62” -
              ou Eletrônico - ex.: “nº 62-E”)
            </li>
            <li>
              <a
                href="https://www.abntcolecao.com.br/mpf/grid.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700 font-semibold"
              >
                <strong>Normas de Acessibilidade da ABNT</strong>
              </a>
            </li>

            <li>
              Tombamentos (esfera municipal):
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  <a
                    href="https://capital.sp.gov.br/web/cultura/w/conpresp/legislacao/resolucoes/1137"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    <strong>Resoluções</strong>
                  </a>
                </li>
              </ul>
            </li>

            <li>
              Tombamentos (esfera estadual):
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  <a
                    href="https://capital.sp.gov.br/web/cultura/w/cit/1157"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    <strong>Resoluções do Condephaat</strong>
                  </a>
                </li>
                <li>
                  <a
                    href="http://condephaat.sp.gov.br/resolucoes-de-tombamento-registro/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    <strong>Resoluções de Tombamento/Registro</strong>
                  </a>
                </li>
              </ul>
            </li>

            <li>
              Tombamentos (esfera federal):
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>
                  <a
                    href="https://capital.sp.gov.br/web/cultura/w/patrimonio_historico/28035"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    <strong>
                      Bens tombados pelo IPHAN no Município de São Paulo
                    </strong>
                  </a>
                </li>
                <li>
                  <a
                    href="http://portal.iphan.gov.br/uploads/ckfinder/arquivos/Lista%20bens%20tombados%20no%20estado%20de%20SP.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    <strong>Bens tombados na Cidade de São Paulo</strong>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.gov.br/iphan/pt-br/centrais-de-conteudo/legislacao/atos-normativos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-700 font-semibold"
                  >
                    <strong>Atos Normativos</strong>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
