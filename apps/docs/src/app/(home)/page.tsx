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
          <span className="font-semibold text-foreground">OpenUrbis</span>
          <span className="text-muted-foreground/60">•</span>
          <span>Prefeitura de São Paulo</span>
          <span className="text-muted-foreground/60">•</span>
          <span className="text-primary font-medium">Documentação Técnica</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-5xl mx-auto leading-[1.1] mb-6">
          Plataforma Territorial Integrada &{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 dark:from-blue-400 dark:via-indigo-300 dark:to-emerald-400 bg-clip-text text-transparent">
            Engenharia Geoespacial
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
          Guia completo de arquitetura, pipelines de dados territoriais com
          Dagster e PostGIS, visualização em tempo real com Deck.gl, módulo
          legislativo Legis e catálogo de microsserviços.
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
            href="/docs/legis"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-border text-foreground font-semibold text-sm hover:bg-accent/80 hover:text-accent-foreground transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
          >
            <Scale className="size-4 text-amber-500" />
            <span>Legis Urbanístico</span>
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
              Arquivos indexados no Azure Blob Storage
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card/40 border border-border/40">
            <div className="text-2xl md:text-3xl font-bold text-primary">
              3 Clusters
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              AKS Kubernetes em Nuvem (Urbis, DataLake, GeoServer)
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card/40 border border-border/40">
            <div className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              100% Livre
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Licença AGPL v3 (Código) & CC BY-SA 4.0
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card/40 border border-border/40">
            <div className="text-2xl md:text-3xl font-bold text-foreground">
              Deck.gl + Dagster
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Renderização 60fps & SDAs reativos
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
              técnicas, arquitetura de software e guias operacionais.
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
                    Web GIS
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  Mapa Urbis
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualizador territorial em React, Deck.gl e MapLibre. Suporte
                  a camadas vetoriais por BBOX, GeoJSON, WMS raster e
                  visualização rápida de zoneamento e lotes.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Deck.gl
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    MapLibre
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
                    Data Engineering
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-emerald-500 transition-colors">
                  Datalake & Pipelines
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Orquestrador Dagster com arquitetura medalhão (Raw, Bronze,
                  Silver, Gold). Banco PostGIS 3.4, publicação OGC no GeoServer
                  e automação de ingestão.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Dagster
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    PostGIS
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    GeoServer
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
                    Auth & RBAC
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-indigo-500 transition-colors">
                  Contas & Permissões
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Autenticação Single Sign-On via OpenID Connect (OIDC), gestão
                  hierárquica de organizações públicas e privadas, matriz de
                  cargos e permissões territoriais.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    OIDC
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    RBAC
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Organizações
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Cargos
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

            {/* Card 4: Legis */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-amber-500/50 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Scale className="size-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Legislação
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-amber-500 transition-colors">
                  Legis Urbanístico
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Editor interativo de atos normativos, inspetor unificado de
                  situações de parcelamento, uso e ocupação do solo e
                  consolidação de artigos de leis.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Tiptap
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Inspetor
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Normas
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                    Artigos
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Link
                  href="/docs/legis/architecture"
                  className="inline-flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <span>Arquitetura do Legis</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/legis/inspetor-situacoes"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Inspetor de Situações Especiais</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  href="/docs/legis/specs"
                  className="inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Especificações Técnicas</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 5: Backend & Arquitetura */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-purple-500/50 group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Server className="size-6" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    Backend & Stack
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-purple-500 transition-colors">
                  Backend Modular & Filas
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Arquitetura modular em NestJS, processamento em background com
                  Bull e Redis, TypeORM com migrações automatizadas e workers
                  independentes.
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
                    Infraestrutura
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-sky-500 transition-colors">
                  Infraestrutura & DevOps
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Topologia dos clusters Azure AKS (Urbis, SiiauDataLake,
                  slui-geoserver), rollouts seguros via kubectl, containers
                  Docker e análise de custos.
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
              <span>Para Desenvolvedores & Contribuidores</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Pronto para configurar seu ambiente local?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Acesse o guia passo a passo para clonar os submódulos, inicializar
              o banco de dados PostgreSQL/PostGIS local com pnpm composer:up e
              executar os testes integrados.
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
                  Erros comuns e soluções
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
