import React from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type:
    | "uso"
    | "cnae"
    | "cnpj"
    | "parametros"
    | "area"
    | "ver-prospeccao"
    | null;
}

export function InfoModal({ isOpen, onClose, type }: InfoModalProps) {
  if (!isOpen || !type) return null;

  const renderContent = () => {
    switch (type) {
      case "uso":
        return (
          <div className="space-y-4 text-xs md:text-sm text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              Os usos urbanísticos utilizados são definidos pela legislação
              paulistana, em especial pelo Decreto nº 57.378/2016, atualizado e
              consolidado até janeiro de 2026. A partir de um uso, especificado
              até o nível da tipologia (usos residenciais) ou do grupo de
              atividades (usos não residenciais), é possível encontrar as zonas
              onde é permitido ou proibido, com ou sem ressalvas, e suas
              condições de instalação (ver Quadros nº 4 e 4A da atual Lei de
              Zoneamento - Lei n° 16.402/2016).
            </p>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Mais informações:
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Usos urbanísticos de legislações anteriores podem ser
                  tolerados pela atual Lei de Zoneamento em algumas condições
                  (ver art. 135 da Lei nº 16.642/2016), mas essas situações não
                  são abarcadas por esta ferramenta.
                </li>
                <li>
                  Os casos de dúvidas ou lacunas devem ser resolvidos pela
                  Câmara Técnica de Legislação Urbanística - CTLU (ver arts. 96
                  - parágrafo único, 157 e 158 da Lei nº 16.402/2016).
                </li>
                <li>
                  A legislação de uso urbanístico desta ferramenta está
                  atualizada e consolidada até janeiro de 2026 (considerando:
                  Resolução SMDU/CTLU nº 17/2019, pelo Decreto nº 62.365/2023 e
                  pela Resolução SMUL/CTLU nº 3/2025).
                </li>
              </ul>
            </div>
          </div>
        );
      case "cnae":
        return (
          <div className="space-y-4 text-xs md:text-sm text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              Os nºs da Classificação Nacional de Atividades Econômicas - CNAE
              são definidos pela Comissão Nacional de Classificação - CONCLA, do
              Instituto Brasileiro de Geografia e Estatística - IBGE (
              <a
                href="https://concla.ibge.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                maiores informações <ExternalLink className="w-3 h-3" />
              </a>
              ). A partir do CNAE é possível obter o uso urbanístico pelas
              correlações estabelecidas pela legislação paulistana, em especial
              pelo Decreto nº 57.378/2016. A partir de um uso, especificado até
              o nível do grupo de atividades, é possível encontrar as zonas onde
              é permitido ou proibido, com ou sem ressalvas, e suas condições de
              instalação (ver Quadros nº 4 e 4A da atual Lei de Zoneamento - Lei
              n° 16.402/2016).
            </p>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Mais informações:
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Os usos urbanísticos que não constituem atividade econômica,
                  como os usos residenciais, não possuem CNAE.
                </li>
                <li>
                  Algumas atividades são enquadradas como auxiliares pela
                  sistematização da CONCLA (conferir Resolução CONCLA nº
                  1/2008), e por isso não possuem CNAE próprio (nem
                  correspondência com uma atividade específica na legislação
                  paulistana). Como consequência, as seguintes atividades da lei
                  paulistana podem ocorrer junto a qualquer CNAE:
                </li>
              </ul>

              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 mt-2">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="p-2 font-semibold text-slate-700 dark:text-slate-300">
                        Atividade
                      </th>
                      <th className="p-2 font-semibold text-slate-700 dark:text-slate-300">
                        Descrição
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-200">
                        nR1-4-1
                      </td>
                      <td className="p-2">Ambulatório</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-200">
                        nR1-6-3
                      </td>
                      <td className="p-2">
                        Escritórios em geral, incluindo espaços para Locação de
                        Uso Compartilhado e “Co-Working”
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-200">
                        nR1-6-7
                      </td>
                      <td className="p-2">Showroom sem venda no local</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-200">
                        nR1-15-1
                      </td>
                      <td className="p-2">
                        Depósitos de material em geral, exceto inflamáveis ou
                        explosivos
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-200">
                        nR1-15-4
                      </td>
                      <td className="p-2">
                        Estacionamento e garagens de veículos com até 40 vagas
                        (inclusive no sistema de garagens subterrâneas),
                        admitindo em conjunto serviços de lavagem de carros
                        manual ou à seco sem serviços automotivos
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-200">
                        nR2-5-1
                      </td>
                      <td className="p-2">Ambulatório</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-200">
                        nR2-12-1
                      </td>
                      <td className="p-2">
                        Depósitos de material em geral, exceto explosivos
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-200">
                        nR2-12-4
                      </td>
                      <td className="p-2">
                        Estacionamento e garagens de veículos com mais de 40 e
                        até 200 vagas de automóvel (inclusive no sistema de
                        garagens subterrâneas) admitindo em conjunto serviços de
                        lavagem de carros manual ou à seco sem serviços
                        automotivos
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-200">
                        nR3-6-1
                      </td>
                      <td className="p-2">
                        Depósitos de material em geral, exceto inflamáveis
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-200">
                        nR3-6-5
                      </td>
                      <td className="p-2">
                        Estacionamento e garagens de veículos com mais 200 vagas
                        de automóvel (inclusive no sistema de garagens
                        subterrâneas) admitindo em conjunto serviços de lavagem
                        de carros manual ou à seco sem serviços automotivos
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium text-slate-900 dark:text-slate-200">
                        nR3-8-1
                      </td>
                      <td className="p-2">Ambulatório</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ul className="list-disc pl-5 space-y-2 pt-2">
                <li>
                  A associação entre os usos urbanísticos e os CNAEs do Decreto
                  nº 57.378/2016 se deu com base nas subclasses 2.2 do CNAE, que
                  atualmente se encontra na versão 2.3. Havendo discrepâncias, o
                  usuário pode tentar buscar a equivalência no site do IBGE -
                  CONCLA.
                </li>
                <li>
                  Os casos de dúvidas ou lacunas devem ser resolvidos pela
                  Câmara Técnica de Legislação Urbanística - CTLU (ver arts. 96
                  - parágrafo único, 157 e 158 da Lei nº 16.402/2016).
                </li>
                <li>
                  A legislação de uso urbanístico desta ferramenta está
                  atualizada e consolidada até janeiro de 2026 (considerando:
                  Resolução SMDU/CTLU nº 17/2019, pelo Decreto nº 62.365/2023 e
                  pela Resolução SMUL/CTLU nº 3/2025).
                </li>
              </ul>
            </div>
          </div>
        );
      case "cnpj":
        return (
          <div className="space-y-4 text-xs md:text-sm text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              Os nºs de Cadastro Nacional de Pessoas Jurídicas - CNPJ são
              definidos pela Receita Federal do Brasil - RFB (
              <a
                href="https://www.gov.br/receitafederal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                maiores informações <ExternalLink className="w-3 h-3" />
              </a>
              ). A obtenção do(s) CNAE(s) pelo CNPJ é possível pelo serviço web
              OpenCNPJ (
              <a
                href="https://cnpj.rocks/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                maiores informações <ExternalLink className="w-3 h-3" />
              </a>
              ). A partir do CNAE é possível obter o uso urbanístico pelas
              correlações estabelecidas pela legislação paulistana, em especial
              pelo Decreto nº 57.378/2016. A partir de um uso, especificado até
              o nível do grupo de atividades, é possível encontrar as zonas onde
              é permitido ou proibido, com ou sem ressalvas, e suas condições de
              instalação (ver Quadros nº 4 e 4A da atual Lei de Zoneamento - Lei
              n° 16.402/2016).
            </p>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Mais informações:
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Um CNPJ pode estar associado a uma atividade principal e
                  outra(s) secundária(s).
                </li>
                <li>
                  Apesar do nome, o CNPJ é obrigatório não só para pessoas
                  jurídicas, mas para alguns entes despersonalizados, como
                  condomínios edilícios ou massas falidas.
                </li>
              </ul>
            </div>
          </div>
        );
      case "parametros":
        return (
          <div className="space-y-4 text-xs md:text-sm text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              Estão disponíveis para inclusão os parâmetros urbanísticos dos
              Quadros nº 2A, 3, 3A, 3C e/ou 4B da atual Lei de Zoneamento (Lei
              n° 16.402/2016) que possuam variação. A partir dos parâmetros
              escolhidos e seus valores, é possível encontrar as zonas e/ou
              perímetros de qualificação ambiental que os permitem,
              desconsiderando-se as exceções dadas pelas notas dos quadros.
            </p>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Mais informações:
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>“NA” significa “não se aplica”.</li>
                <li>
                  A variação de valores considera também as notas associadas.
                  Assim, o parâmetro urbanístico vibração associada, que possui
                  em todos os casos o mesmo valor e nota (NA e “a” - ver Lei n°
                  16.402/2016, quadro nº 4B), não está disponível para inclusão.
                </li>
              </ul>
            </div>
          </div>
        );
      case "area":
        return (
          <div className="space-y-4 text-xs md:text-sm text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              Os dados utilizados para áreas dos imóveis são os registros de
              Área do Terreno do Cadastro Imobiliário Fiscal - CIF (base para
              cobrança de tributos como o IPTU). Ao inserir valores mínimos e/ou
              máximos, os parâmetros urbanísticos incompatíveis ficam
              indisponíveis para inclusão ou, caso incluídos, são excluídos
              automaticamente (ex.: se “Área do imóvel” mínima for 600 m², o
              parâmetro “T.O. máx (&lt; 500 m²)” é incompatível).
            </p>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Mais informações:
              </h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  O valor Área do Terreno do CIF se baseia, preferencialmente,
                  nos dados do título do imóvel (matrícula ou documento
                  análogo), mas nos casos em que estes não existam ou desviem
                  fora de determinada tolerância, é considerada a situação
                  fática (ver Decreto nº 52.884/2011 - anexo - art. 96).
                </li>
                <li>
                  Devido à sua finalidade tributária, as áreas irregulares,
                  públicas ou rurais podem não estar representadas ou estarem
                  representadas com imprecisões e desatualizações.
                </li>
                <li>
                  Os lotes fiscais do CIF não são uma parcela
                  territorial certificada, ou seja, não representam com precisão
                  o imóvel, conforme descrição do seu título.
                </li>
                <li>
                  A Prefeitura não se responsabiliza por usos não tributários
                  dos dados do CIF.
                </li>
              </ul>
            </div>
          </div>
        );
      case "ver-prospeccao":
        return (
          <div className="space-y-4 text-xs md:text-sm text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              Clique no botão para visualizar no mapa a prospecção realizada. A
              configuração visual da ferramenta permite que os resultados das
              prospecções por uso, por parâmetros urbanísticos e por parâmetros
              imobiliários sejam vistos concomitantemente.
            </p>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Mais informações:
              </h4>
              <p className="leading-relaxed">
                Não é permitida a prospecção exclusivamente com base em dados
                imobiliários. Caso deseje prospectar exclusivamente com dados
                imobiliários, utilize a ferramenta Filtros por atributos de
                camada, selecione a camada Lotes fiscais e insira
                condições relacionadas ao atributo Área do terreno.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "uso":
        return "Uso Urbanístico";
      case "cnae":
        return "Classificação CNAE";
      case "cnpj":
        return "Cadastro CNPJ";
      case "parametros":
        return "Parâmetros Urbanísticos";
      case "area":
        return "Área do Imóvel";
      case "ver-prospeccao":
        return "Prospecção no Mapa";
      default:
        return "Informações";
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col border border-border overflow-hidden shadow-none animate-in fade-in zoom-in-95 duration-200">
        <div className="px-4 py-3 md:px-6 md:py-4 flex justify-between items-center border-b border-border shrink-0 bg-background">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm md:text-base">
            {getTitle()}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full w-8 h-8 flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto flex-1 custom-scrollbar bg-background">
          {renderContent()}
        </div>
        <div className="px-4 py-3 md:px-6 md:py-4 border-t border-border flex justify-end shrink-0 bg-background">
          <button
            onClick={onClose}
            className="px-4 py-2 md:px-5 md:py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-300 font-semibold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
