import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cloud,
  Database,
  ExternalLink,
  FileCode,
  GitBranch,
  Map as MapIcon,
  Scale,
  Server,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="px-6 pt-12 pb-14 md:pt-16 md:pb-20 max-w-5xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-muted/40 text-xs md:text-sm font-medium text-muted-foreground mb-6">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-foreground">OpenUrbis</span>
          <span className="text-muted-foreground/50">•</span>
          <span>Prefeitura de São Paulo</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="text-primary font-medium">Documentação Técnica</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-tight mb-4">
          Documentação Técnica do Urbis
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          Guias práticos, arquitetura do sistema e referências técnicas para
          desenvolvimento e integração da plataforma de dados territoriais de
          São Paulo.
        </p>

        {/* Action Button Grid */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-3xl mx-auto mb-12">
          <Link
            href="/docs/general/mapa/layer-configuration"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <MapIcon className="size-4" />
            <span>Módulo Mapa</span>
            <ArrowRight className="size-3.5 opacity-70" />
          </Link>

          <Link
            href="/docs/datalake"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
          >
            <Database className="size-4 text-muted-foreground" />
            <span>Datalake</span>
          </Link>

          <Link
            href="/docs/general/usuarios"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
          >
            <Users className="size-4 text-muted-foreground" />
            <span>Contas</span>
          </Link>

          <Link
            href="/docs/legis"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
          >
            <Scale className="size-4 text-muted-foreground" />
            <span>Legis</span>
          </Link>

          <Link
            href="/docs/openapi"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
          >
            <FileCode className="size-4 text-muted-foreground" />
            <span>OpenAPI</span>
          </Link>

          <Link
            href="/docs/general/architecture/stack"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
          >
            <Boxes className="size-4 text-muted-foreground" />
            <span>Arquitetura</span>
          </Link>

          <a
            href="https://github.com/OpenUrbis"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground font-medium text-sm hover:bg-muted transition-colors"
          >
            <GitBranch className="size-4" />
            <span>GitHub</span>
            <ExternalLink className="size-3 opacity-60" />
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto pt-6 border-t border-border text-left">
          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="text-xl md:text-2xl font-bold text-foreground">
              +7.500
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Arquivos no Datalake
            </div>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="text-xl md:text-2xl font-bold text-foreground">
              3 Clusters
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Ambientes Azure AKS
            </div>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="text-xl md:text-2xl font-bold text-foreground">
              100% Livre
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Licença AGPL v3
            </div>
          </div>
          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="text-xl md:text-2xl font-bold text-foreground">
              60 FPS
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Renderização no Mapa
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="px-6 py-14 bg-muted/20 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Módulos do Sistema
            </h2>
            <p className="text-sm text-muted-foreground">
              Explore a documentação técnica por área da plataforma.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Mapa Urbis */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted text-foreground">
                    <MapIcon className="size-5" />
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    Web GIS
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  Mapa Urbis
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                  Visualização de camadas geoespaciais, zoneamento e lotes
                  urbanos com suporte a vetores e imagens.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Deck.gl
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    MapLibre
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    GeoJSON
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-3 border-t border-border">
                <Link
                  href="/docs/general/mapa/layer-configuration"
                  className="inline-flex items-center justify-between text-xs font-medium text-primary hover:underline"
                >
                  <span>Configuração de Camadas</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/general/mapa/layer-schema"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Esquema de Dados</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/general/mapa/base-maps"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Mapas de Fundo</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* Card 2: Datalake */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted text-foreground">
                    <Database className="size-5" />
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    Dados
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  Datalake e Pipelines
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                  Pipelines de ingestão e processamento de dados territoriais
                  com Dagster, PostGIS e GeoServer.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Dagster
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    PostGIS
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    GeoServer
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-3 border-t border-border">
                <Link
                  href="/docs/datalake/arquitetura-medalhao"
                  className="inline-flex items-center justify-between text-xs font-medium text-primary hover:underline"
                >
                  <span>Arquitetura Medalhão</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/datalake/agendamento"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Agendamento de Tarefas</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/datalake/catalogo"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Catálogo de Camadas</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* Card 3: Contas & Permissões */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted text-foreground">
                    <Users className="size-5" />
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    Acesso
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  Contas e Permissões
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                  Login único (OIDC), estrutura de organizações e controle de
                  acessos por cargo.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    OIDC
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    RBAC
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Organizações
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-3 border-t border-border">
                <Link
                  href="/docs/general/usuarios"
                  className="inline-flex items-center justify-between text-xs font-medium text-primary hover:underline"
                >
                  <span>Visão Geral de Contas</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/general/usuarios/cargos"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Matriz de Permissões</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/general/usuarios/organizacoes"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Gestão de Organizações</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* Card 4: Legis */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted text-foreground">
                    <Scale className="size-5" />
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    Legislação
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  Legis Urbanístico
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                  Consulta, interpretação e inspeção de regras de parcelamento,
                  uso e ocupação do solo.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Normas
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Artigos
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Zoneamento
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-3 border-t border-border">
                <Link
                  href="/docs/legis/architecture"
                  className="inline-flex items-center justify-between text-xs font-medium text-primary hover:underline"
                >
                  <span>Arquitetura do Legis</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/legis/inspetor-situacoes"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Inspetor de Situações</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/legis/specs"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Especificações Técnicas</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* Card 5: Backend */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted text-foreground">
                    <Server className="size-5" />
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    Backend
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  Backend e API
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                  API em NestJS, filas assíncronas com Redis/Bull e
                  gerenciamento de banco com TypeORM.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    NestJS
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Redis
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    TypeORM
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-3 border-t border-border">
                <Link
                  href="/docs/general/architecture/backend/overview"
                  className="inline-flex items-center justify-between text-xs font-medium text-primary hover:underline"
                >
                  <span>Visão Geral do Backend</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/general/architecture/backend/queues"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Filas e Processamento</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/general/architecture/backend/database"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Banco de Dados e Migrações</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>

            {/* Card 6: Infra & DevOps */}
            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-muted text-foreground">
                    <Cloud className="size-5" />
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    DevOps
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  Infraestrutura e Nuvem
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                  Clusters Kubernetes no Azure AKS, contêineres Docker, rotinas
                  de deploy e monitoramento.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Azure AKS
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Kubernetes
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    Docker
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-3 border-t border-border">
                <Link
                  href="/docs/general/infrastructure/azure-resources"
                  className="inline-flex items-center justify-between text-xs font-medium text-primary hover:underline"
                >
                  <span>Recursos no Azure</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/general/infrastructure/deploy"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Deploy e Rollouts</span>
                  <ArrowRight className="size-3" />
                </Link>
                <Link
                  href="/docs/general/infrastructure/logs"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Monitoramento e Logs</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="px-6 py-14 max-w-6xl mx-auto w-full">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="max-w-2xl mb-6">
            <div className="inline-flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-wider mb-2">
              <Terminal className="size-3.5" />
              <span>Desenvolvedores</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Comece a Desenvolver
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Guia rápido para configurar o ambiente local e seguir os padrões
              de contribuição do projeto.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/docs/general/development/setup"
              className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors group"
            >
              <Terminal className="size-4 text-primary shrink-0" />
              <div>
                <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  Setup Local
                </div>
                <div className="text-xs text-muted-foreground">
                  Instalação e variáveis .env
                </div>
              </div>
            </Link>

            <Link
              href="/docs/general/development/commit-guidelines"
              className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors group"
            >
              <GitBranch className="size-4 text-muted-foreground shrink-0" />
              <div>
                <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  Padrão de Commits
                </div>
                <div className="text-xs text-muted-foreground">
                  Conventional Commits
                </div>
              </div>
            </Link>

            <Link
              href="/docs/general/development/pull-request-guidelines"
              className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors group"
            >
              <CheckCircle2 className="size-4 text-muted-foreground shrink-0" />
              <div>
                <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  Pull Requests
                </div>
                <div className="text-xs text-muted-foreground">
                  Padrões e revisões
                </div>
              </div>
            </Link>

            <Link
              href="/docs/general/development/troubleshooting"
              className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors group"
            >
              <Sparkles className="size-4 text-muted-foreground shrink-0" />
              <div>
                <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  Dúvidas e Erros
                </div>
                <div className="text-xs text-muted-foreground">
                  Solução de problemas
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
