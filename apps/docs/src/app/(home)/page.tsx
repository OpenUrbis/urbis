import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cloud,
  Database,
  ExternalLink,
  FileCode,
  FileText,
  GitBranch,
  Map as MapIcon,
  Server,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Background ambient gradient glow */}
      <div className="absolute inset-x-0 top-0 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl">
        <div
          className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-emerald-500/15 opacity-50 dark:opacity-30"
          style={{
            clipPath:
              "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative px-6 pt-12 pb-16 md:pt-20 md:pb-24 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-sm text-xs md:text-sm font-medium text-muted-foreground mb-6 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground">
            Prefeitura de São Paulo
          </span>
          <span className="text-muted-foreground/60">•</span>
          <span className="text-foreground/90">CODATA / SMUL</span>
          <span className="text-muted-foreground/60">•</span>
          <span className="font-semibold text-foreground">OpenUrbis</span>
          <span className="text-muted-foreground/60">•</span>
          <span className="text-primary font-medium">Documentação Técnica</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-5xl mx-auto leading-[1.1] mb-6">
          Plataforma Territorial Integrada &{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 dark:from-blue-400 dark:via-indigo-300 dark:to-emerald-400 bg-clip-text text-transparent">
            Inteligência Geoespacial
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
          Ecossistema aberto de engenharia de dados territoriais da cidade de
          São Paulo. Arquitetura medalhão no Dagster com PostGIS e GeoServer,
          visualização analítica em Deck.gl a 60fps e integração contínua com
          bases do GeoSampa e CKAN da CODATA.
        </p>

        {/* Action Button Grid */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 max-w-4xl mx-auto mb-14">
          <Link
            href="/docs/general/mapa/layer-configuration"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <MapIcon className="size-4" />
            <span>Módulo Mapa</span>
            <ArrowRight className="size-4 opacity-70" />
          </Link>

          <Link
            href="/docs/datalake"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-accent/80 hover:text-accent-foreground transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
          >
            <Database className="size-4 text-blue-500" />
            <span>Datalake & Dados</span>
          </Link>

          <Link
            href="/docs/general/usuarios"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-accent/80 hover:text-accent-foreground transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
          >
            <Users className="size-4 text-emerald-500" />
            <span>Contas & Permissões</span>
          </Link>

          <Link
            href="/docs/general/forms"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-accent/80 hover:text-accent-foreground transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
          >
            <FileText className="size-4 text-rose-500" />
            <span>Formulários & Processos</span>
          </Link>

          <Link
            href="/docs/openapi"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-accent/80 hover:text-accent-foreground transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
          >
            <FileCode className="size-4 text-purple-500" />
            <span>OpenAPI Reference</span>
          </Link>

          <Link
            href="/docs/general/architecture/stack"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-accent/80 hover:text-accent-foreground transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
          >
            <Boxes className="size-4 text-indigo-500" />
            <span>Arquitetura Mestre</span>
          </Link>

          <a
            href="https://github.com/OpenUrbis"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-muted/60 border border-border text-muted-foreground hover:text-foreground font-semibold text-sm hover:bg-muted transition-all"
          >
            <GitBranch className="size-4" />
            <span>GitHub</span>
            <ExternalLink className="size-3.5 opacity-60" />
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-border/60 text-left">
          <div className="p-4 rounded-xl bg-card/40 border border-border/40">
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              +7.500
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Camadas e datasets territoriais indexados no Azure Blob Storage
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card/40 border border-border/40">
            <div className="text-2xl md:text-3xl font-bold text-primary">
              3 Clusters
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              AKS Kubernetes em Nuvem Azure PMSP (Urbis, DataLake, GeoServer)
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card/40 border border-border/40">
            <div className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              100% Livre
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Licença AGPL v3 (Código Aberto) & CC BY-SA 4.0 (Dados Abertos)
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card/40 border border-border/40">
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              Deck.gl + Dagster
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Renderização Web GIS a 60fps & Pipelines analíticos reativos
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="px-6 py-16 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Módulos e Domínios do Ecossistema
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Selecione o módulo de interesse para navegar pelas diretrizes
              técnicas, engenharia de dados territoriais e guias operacionais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Mapa Urbis */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <MapIcon className="size-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    Web GIS Municipal
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  Mapa Urbis
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualizador territorial em React, Deck.gl e MapLibre.
                  Consulta interativa de zoneamento (LPUOS), lotes fiscais,
                  sobreposição por BBOX e integração contínua com as camadas do
                  GeoSampa.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Deck.gl
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    MapLibre
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    GeoSampa
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Layer Schema
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Mapas Base
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Link
                  href="/docs/general/mapa/layer-configuration"
                  className="inline-flex items-center justify-between text-xs font-semibold text-primary hover:underline"
                >
                  <span>Configuração de Camadas</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/general/mapa/layer-schema"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Esquema de Dados (Schema)</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/general/mapa/base-maps"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Mapas de Fundo (Base Maps)</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Datalake */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-emerald-500/50 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Database className="size-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Data Engineering & CODATA
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-emerald-500 transition-colors">
                  Datalake & Pipelines
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Orquestrador Dagster com arquitetura medalhão (Raw, Bronze,
                  Silver, Gold e CKAN CODATA). PostGIS 3.4, publicação OGC
                  (WFS/WMS) no GeoServer e automação de ingestão.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Dagster
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    PostGIS 3.4
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    GeoServer OGC
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    CKAN CODATA
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    GeoSampa
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Link
                  href="/docs/datalake/arquitetura-medalhao"
                  className="inline-flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Arquitetura Medalhão</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/datalake/agendamento"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Agendamento & Reconciliação</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/datalake/catalogo"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Catálogo de Camadas (+7.500)</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: Contas & Usuários */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-indigo-500/50 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Users className="size-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    Governança & RBAC
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-indigo-500 transition-colors">
                  Contas & Permissões
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Autenticação Single Sign-On via OpenID Connect (OIDC), gestão
                  hierárquica para secretarias municipais (SMUL), órgãos
                  públicos e cidadãos, com matriz granular de perfis.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    OIDC / SSO
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    RBAC
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    SMUL / PMSP
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Organizações
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Auditoria
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Link
                  href="/docs/general/usuarios"
                  className="inline-flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>Visão Geral de Contas</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/general/usuarios/cargos"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Matriz de Cargos e Acessos</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/general/usuarios/organizacoes"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Gestão de Organizações</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 4: Backend & Arquitetura */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-purple-500/50 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Server className="size-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    Backend & Microsserviços
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-purple-500 transition-colors">
                  Backend Modular & Filas
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arquitetura modular em NestJS, processamento assíncrono com
                  Bull e Redis, TypeORM com migrações automatizadas e padrões de
                  integridade para serviços municipais.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    NestJS
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Bull / Redis
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    TypeORM
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Workers
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Link
                  href="/docs/general/architecture/backend/overview"
                  className="inline-flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <span>Visão Geral do Backend</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/general/architecture/backend/queues"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Filas e Processamento Assíncrono</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/general/architecture/backend/database"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Banco de Dados & Migrações</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 6: Infra & DevOps */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-sky-500/50 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <Cloud className="size-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    Infraestrutura & Nuvem PMSP
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-sky-500 transition-colors">
                  Infraestrutura & DevOps
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Topologia dos clusters Azure AKS (Urbis, SiiauDataLake,
                  slui-geoserver), rollouts declarativos via kubectl, containers
                  Docker e governança de custos na nuvem da Prefeitura.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Azure AKS
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Kubernetes
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Docker
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    CI / CD
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Segurança PMSP
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Link
                  href="/docs/general/infrastructure/azure-resources"
                  className="inline-flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <span>Recursos no Azure AKS</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/general/infrastructure/deploy"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Guia de Deploy & Rollouts</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/general/infrastructure/logs"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Monitoramento e Logs</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Experience & Quick Navigation */}
      <section className="px-6 py-16 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12 relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-2">
              <Terminal className="size-4" />
              <span>Para Desenvolvedores & Equipes Técnicas</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Pronto para configurar seu ambiente local?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Acesse o guia passo a passo para clonar os submódulos, inicializar
              o banco de dados PostgreSQL/PostGIS local com pnpm composer:up e
              executar os pipelines de engenharia de dados e testes integrados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/docs/general/development/setup"
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors group"
            >
              <Terminal className="size-5 text-primary shrink-0" />
              <div>
                <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  Setup Local
                </div>
                <div className="text-xs text-muted-foreground">
                  Instalação e variáveis .env
                </div>
              </div>
            </Link>

            <Link
              href="/docs/general/development/commit-guidelines"
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors group"
            >
              <GitBranch className="size-5 text-emerald-500 shrink-0" />
              <div>
                <div className="font-semibold text-sm text-foreground group-hover:text-emerald-500 transition-colors">
                  Padrão de Commits
                </div>
                <div className="text-xs text-muted-foreground">
                  Conventional Commits
                </div>
              </div>
            </Link>

            <Link
              href="/docs/general/development/pull-request-guidelines"
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors group"
            >
              <CheckCircle2 className="size-5 text-blue-500 shrink-0" />
              <div>
                <div className="font-semibold text-sm text-foreground group-hover:text-blue-500 transition-colors">
                  Pull Requests
                </div>
                <div className="text-xs text-muted-foreground">
                  Ciclo de vida e revisões
                </div>
              </div>
            </Link>

            <Link
              href="/docs/general/development/troubleshooting"
              className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors group"
            >
              <Sparkles className="size-5 text-amber-500 shrink-0" />
              <div>
                <div className="font-semibold text-sm text-foreground group-hover:text-amber-500 transition-colors">
                  Soluções de Problemas
                </div>
                <div className="text-xs text-muted-foreground">
                  Erros comuns e diagnósticos
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
