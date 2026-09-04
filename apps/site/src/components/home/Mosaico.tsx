import {
  Search,
  Rss,
  FileText,
  ExternalLink,
  Github,
  BookOpenText,
  Scale,
  Binoculars,
  Award,
  ClipboardList,
  FileCode2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { isAdminUser } from "@open-urbis/map-auth";
import { Card, CardContent } from "@open-urbis/map-ui/ui/card";
import { Input } from "@open-urbis/map-ui/ui/input";
import { Button } from "@open-urbis/map-ui/ui/button";

const MAP_URL = "https://mapa.urbis.prefeitura.sp.gov.br";
const SEARCH_EXAMPLES = [
  "Av. Paulista, 1578",
  "Praça da Sé",
  "Viaduto do Chá, 15",
  "Parque Ibirapuera",
  "-23.5614, -46.6559",
];

/** Animação de entrada dos cards, desligada em `prefers-reduced-motion`. */
const ENTER =
  "animate-in fade-in slide-in-from-bottom-4 [animation-duration:700ms] fill-mode-both motion-reduce:animate-none";

/** Anel de foco para navegação por teclado. */
const FOCUS_RING =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const CARD_BASE =
  "h-full bg-card rounded-sm relative overflow-hidden shadow-sm transition-shadow duration-200 hover:shadow-md";

/** Faixa vertical de destaque à esquerda do card. */
const CARD_ACCENT =
  "before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-primary";

const SECTION_LABEL = "sr-only";

type MosaicoItem = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** Destino fora do site do Mosaico. */
  external?: boolean;
  /** Abre em nova aba (reservado a destinos de terceiros). */
  newTab?: boolean;
  /** Ambiente interno: só aparece para quem tem papel de administrador. */
  adminOnly?: boolean;
};

const componentes: MosaicoItem[] = [
  {
    title: "Viabiliza",
    description:
      "Formulários complexos com integração aos dados do Urbis e ao SEI, com caixa de entrada e geração de documentos.",
    href: "https://viabiliza.urbis.prefeitura.sp.gov.br",
    icon: ClipboardList,
    external: true,
  },
  {
    title: "Dados Abertos",
    description:
      "Catálogo de metadados, com informações explicativas, administrativas e técnicas, com as opções de consumo do dado.",
    href: "https://dadosabertos.urbis.prefeitura.sp.gov.br",
    icon: BookOpenText,
    external: true,
  },
  {
    title: "Código aberto",
    description:
      "Código-fonte, melhorias e componentes abertos do ecossistema Urbis, publicados no GitHub.",
    href: "https://github.com/OpenUrbis",
    icon: Github,
    external: true,
    newTab: true,
  },
  {
    title: "Documentação técnica",
    description:
      "Guias, referências técnicas e APIs para entender, integrar e desenvolver com o Urbis.",
    href: "/doc-tecnica",
    icon: FileCode2,
  },
  {
    title: "Links administrativos",
    description:
      "Acesso direto às ferramentas, consoles e serviços de administração e infraestrutura do ecossistema Urbis.",
    href: "/links-administrativos",
    icon: ShieldCheck,
    adminOnly: true,
  },
];

const guias: MosaicoItem[] = [
  {
    title: "Carta de Serviços urbanísticos, ambientais e culturais",
    description:
      "Encontre o canal correto para solicitar autorizações, licenças, certidões e demais serviços relacionados ao território.",
    href: "/carta-servicos",
    icon: FileText,
  },
  {
    title: "Guia para a legislação urbanística",
    description:
      "Guia do Urbis para pesquisas em legislação urbanística, com uma seleção de fontes e dicas de uso.",
    href: "/guia-legislacao-urbanistica",
    icon: Scale,
  },
  {
    title: "Guia para a fiscalização urbanística",
    description:
      "Saiba onde consultar autorizações, licenças e certificados emitidos, acompanhar informações públicas e denunciar irregularidades.",
    href: "/guia-fiscalizacao-urbanistica",
    icon: Binoculars,
  },
];

function ItemLink({
  item,
  className,
  children,
}: {
  item: MosaicoItem;
  className: string;
  children: React.ReactNode;
}) {
  const classes = `group no-underline ${FOCUS_RING} ${className}`;

  if (item.external) {
    return (
      <a
        href={item.href}
        className={classes}
        {...(item.newTab
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={item.href} className={classes}>
      {children}
    </Link>
  );
}

function ComponenteCard({ item, delay }: { item: MosaicoItem; delay: number }) {
  const Icon = item.icon;

  return (
    <ItemLink item={item} className="block h-full">
      <Card
        className={`${CARD_BASE} ${CARD_ACCENT} ${ENTER}`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <CardContent className="p-4 pl-5">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="flex items-center gap-2 text-xl font-bold text-foreground transition-colors group-hover:text-primary">
              <Icon
                className="h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              {item.title}
              {item.newTab && (
                <span className="sr-only">(abre em nova aba)</span>
              )}
            </h3>
            <div className="mt-1 flex shrink-0 items-center gap-2">
              {item.adminOnly && (
                <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-secondary-foreground">
                  Uso interno
                </span>
              )}
              {item.external && (
                <ExternalLink
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
          <p className="text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        </CardContent>
      </Card>
    </ItemLink>
  );
}

function GuiaCard({ item, delay }: { item: MosaicoItem; delay: number }) {
  const Icon = item.icon;

  return (
    <ItemLink item={item} className="flex flex-1 flex-col">
      <Card
        className={`${CARD_BASE} ${CARD_ACCENT} ${ENTER} flex flex-col justify-center`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <CardContent className="flex items-center gap-4 p-4 pl-5">
          <Icon className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h3 className="mb-0.5 text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
              {item.title}
            </h3>
            <p className="text-sm leading-snug text-muted-foreground">
              {item.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </ItemLink>
  );
}

export function Mosaico() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Assinatura manual do sinal (sem transform do Babel) para manter o SSG seguro:
  // na pré-renderização o efeito não roda, então os itens internos ficam fora do HTML estático.
  useEffect(() => isAdminUser.subscribe((value) => setIsAdmin(!!value)), []);

  const componentesVisiveis = componentes.filter(
    (item) => !item.adminOnly || isAdmin,
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const query = searchTerm.trim();
    if (!query) return;

    window.open(
      `${MAP_URL}/?search=${encodeURIComponent(query)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="container mx-auto px-4 xl:px-8 pt-8 pb-12 font-sans">
      <header className="mb-8">
        <div className="relative w-full pb-4">
          <h1 className="m-0 font-sans text-5xl font-bold leading-tight tracking-tight text-primary md:text-6xl">
            Urbis
          </h1>
          <span
            className="absolute bottom-0 left-0 h-2 w-[60%] rounded-full bg-primary"
            aria-hidden="true"
          />
        </div>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Dados, serviços e informações sobre o território da cidade de São
          Paulo.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
        {/* Coluna principal: 7/12 */}
        <div className="flex flex-col gap-2 lg:col-span-7">
          <section aria-labelledby="busca-titulo">
            <Card
              className={`${CARD_BASE} ${ENTER}`}
              style={{ animationDelay: "0ms" }}
            >
              <CardContent className="p-4">
                <h2
                  id="busca-titulo"
                  className="text-xl font-semibold text-foreground"
                >
                  Busca direta
                </h2>

                <form
                  onSubmit={handleSearch}
                  className="mt-3 flex flex-col gap-3"
                >
                  <label htmlFor="busca-urbis" className="sr-only">
                    Buscar endereço, imóvel ou coordenada no Mapa Urbis
                  </label>

                  <div className="flex gap-2">
                    <Input
                      id="busca-urbis"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Ex: Paulista, SQL, coordenadas..."
                      className="h-11 flex-1 rounded-sm text-base"
                      aria-describedby="busca-ajuda"
                      required
                    />

                    <Button
                      type="submit"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-sm"
                    >
                      <Search className="h-5 w-5" aria-hidden="true" />
                      <span className="sr-only">
                        Pesquisar no Mapa Urbis (abre em nova aba)
                      </span>
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Exemplos:</span>
                    {SEARCH_EXAMPLES.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setSearchTerm(example)}
                        className={`rounded-full border border-border px-2 py-0.5 font-medium text-foreground transition-colors hover:border-primary hover:text-primary ${FOCUS_RING}`}
                      >
                        {example}
                      </button>
                    ))}
                  </div>

                  <p
                    id="busca-ajuda"
                    className="text-sm leading-relaxed text-muted-foreground"
                  >
                    Pesquise por endereço, cadastro fiscal (“SQL”, “IPTU”),
                    referências (distritos etc.), coordenadas georref. ou endereço
                    digital (Urbis ou Plus Code)
                  </p>
                </form>
              </CardContent>
            </Card>
          </section>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <section
              aria-labelledby="componentes-titulo"
              className="flex flex-col gap-2"
            >
              <h2 id="componentes-titulo" className={SECTION_LABEL}>
                Componentes
              </h2>
              {componentesVisiveis.map((item, index) => (
                <ComponenteCard
                  key={item.title}
                  item={item}
                  delay={100 + index * 50}
                />
              ))}
            </section>

            <section
              aria-labelledby="guias-titulo"
              className="flex flex-col gap-2"
            >
              <h2 id="guias-titulo" className={SECTION_LABEL}>
                Guias e serviços
              </h2>
              {guias.map((item, index) => (
                <GuiaCard
                  key={item.title}
                  item={item}
                  delay={100 + index * 50}
                />
              ))}
            </section>
          </div>
        </div>

        {/* Coluna lateral: 5/12 */}
        <div className="flex flex-col gap-2 lg:col-span-5">
          <a
            href={MAP_URL}
            className={`group block overflow-hidden border border-border bg-card no-underline shadow-sm transition-shadow duration-200 hover:shadow-md ${ENTER} ${FOCUS_RING}`}
            style={{ animationDelay: "100ms" }}
          >
            <div className="relative aspect-video bg-muted">
              <img
                src="/sp-here-map.jpg"
                alt="Recorte do mapa da cidade de São Paulo no Mapa Urbis"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                loading="lazy"
                decoding="async"
                width="800"
                height="450"
              />
            </div>
            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <h2 className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                  Mapa Urbis
                </h2>
                <p className="text-sm leading-snug text-muted-foreground">
                  Visualize camadas, lotes e informações do território da cidade
                  em um único mapa.
                </p>
              </div>
              <ExternalLink
                className="mt-1 h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
            </div>
          </a>

          <section aria-labelledby="novidades-titulo">
            <Card
              className={`${CARD_BASE} ${ENTER}`}
              style={{ animationDelay: "150ms" }}
            >
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                  <Rss className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h2
                    id="novidades-titulo"
                    className="text-xl font-bold text-foreground"
                  >
                    Novidades
                  </h2>
                </div>

                <a
                  href="https://www.youtube.com/live/LlSHX1FQJLM?t=6995"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group block no-underline ${FOCUS_RING}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-[60%] shrink-0 overflow-hidden rounded-sm border border-border">
                      <img
                        src="/premia-sampa-2026-foto.jpg"
                        alt="Equipe do Urbis recebendo o prêmio de 1º lugar na categoria Processos Internos do Premia Sampa 2026"
                        className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        loading="lazy"
                        decoding="async"
                        width="1162"
                        height="646"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="mb-0.5 flex items-center gap-1.5 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                        <Award
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />
                        Premia Sampa 2026
                      </h3>
                      <p className="text-xs leading-tight text-muted-foreground">
                        1º colocado na categoria Processos Internos, a mais
                        concorrida do Premia Sampa 2026.
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        Assista à premiação
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        <span className="sr-only">(abre em nova aba)</span>
                      </span>
                    </div>
                  </div>
                </a>

                <a
                  href="https://premiasampa.prefeitura.sp.gov.br/#finalistas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-3 inline-block text-xs text-muted-foreground underline hover:text-primary ${FOCUS_RING}`}
                >
                  Conheça os finalistas do Premia Sampa 2026
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
