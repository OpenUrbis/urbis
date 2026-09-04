import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Cloud,
  Database,
  ExternalLink,
  Globe,
  BarChart3,
  Github,
  FileCode2,
  Lock,
  LogIn,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Info,
} from "lucide-react";
import { isAdminUser, userRolesLoaded } from "@open-urbis/map-auth";
import { Button } from "@open-urbis/map-ui/ui/button";
import { Card, CardContent } from "@open-urbis/map-ui/ui/card";
import { useAuth } from "../hooks/useAuth";

interface AdminDocLink {
  title: string;
  href: string;
}

interface AdminTool {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  buttonText: string;
  icon: typeof Cloud;
  docs: AdminDocLink[];
}

const ADMIN_TOOLS: AdminTool[] = [
  {
    id: "azure",
    title: "Microsoft Azure",
    category: "Nuvem & Infraestrutura",
    description:
      "Portal de gerenciamento da infraestrutura em nuvem do Urbis, incluindo clusters Kubernetes (AKS: Urbis, SiiauDataLake, slui-geoserver), instâncias de bancos de dados PostgreSQL/PostGIS e contas de armazenamento Blob Storage (openurbisdatalake).",
    url: "https://portal.azure.com/",
    buttonText: "Acessar Portal Azure",
    icon: Cloud,
    docs: [
      {
        title: "Recursos Azure no Urbis",
        href: "https://docs.urbis.prefeitura.sp.gov.br/docs/general/infrastructure/azure-resources",
      },
      {
        title: "Visão Geral de Infraestrutura",
        href: "https://docs.urbis.prefeitura.sp.gov.br/docs/general/infrastructure",
      },
    ],
  },
  {
    id: "dagster",
    title: "Dagster Datalake",
    category: "Engenharia de Dados",
    description:
      "Plataforma de orquestração e conciliação declarativa de ativos de dados territoriais. Responsável pela extração de dados do GeoSampa, ArcGIS e WFS, transformações na arquitetura medalhão (Raw, Bronze, Silver e Gold) e auto-materialização.",
    url: "https://datalake.urbis.prefeitura.sp.gov.br/",
    buttonText: "Acessar Dagster",
    icon: Database,
    docs: [
      {
        title: "Visão Geral do Datalake",
        href: "https://docs.urbis.prefeitura.sp.gov.br/docs/datalake",
      },
      {
        title: "Agendamento & Reconciliação",
        href: "https://docs.urbis.prefeitura.sp.gov.br/docs/datalake/agendamento",
      },
    ],
  },
  {
    id: "geoserver",
    title: "GeoServer",
    category: "Geosserviços OGC & Mapas",
    description:
      "Servidor geoespacial em software livre para publicação, compartilhamento e estilização de dados territoriais em padrões abertos OGC (WFS, WMS). Disponibiliza as camadas geográficas consumidas pelo Mapa Urbis e formulários do Viabiliza.",
    url: "https://geoserver.slui.dev/geoserver/",
    buttonText: "Acessar GeoServer",
    icon: Globe,
    docs: [
      {
        title: "Arquitetura de Medalhão & GeoServer",
        href: "https://docs.urbis.prefeitura.sp.gov.br/docs/datalake/arquitetura-medalhao",
      },
      {
        title: "Cadastro e Configuração de Camadas",
        href: "https://docs.urbis.prefeitura.sp.gov.br/docs/general/mapa/cadastrar-camada",
      },
    ],
  },
  {
    id: "posthog",
    title: "PostHog",
    category: "Analytics & Feature Flags",
    description:
      "Plataforma de inteligência analítica de produto e gerenciamento dinâmico de Feature Flags. Monitoramento de métricas de navegação dos usuários, telemetria de renderização geoespacial e ativação progressiva de novos recursos no ecossistema.",
    url: "https://eu.posthog.com/project/257292/",
    buttonText: "Acessar PostHog",
    icon: BarChart3,
    docs: [
      {
        title: "Guia de Feature Flags no Urbis",
        href: "https://docs.urbis.prefeitura.sp.gov.br/docs/general/feature-flags",
      },
    ],
  },
];

const COMPLEMENTARY_LINKS = [
  {
    title: "Docs.Urbis",
    description:
      "Portal central de documentação técnica, manuais operacionais, arquitetura e especificações do Urbis.",
    url: "https://docs.urbis.prefeitura.sp.gov.br",
    icon: FileCode2,
  },
  {
    title: "GitHub OpenUrbis",
    description:
      "Organização de código aberto contendo os repositórios, issues, pull requests e pipelines de CI/CD.",
    url: "https://github.com/OpenUrbis",
    icon: Github,
  },
];

export default function LinksAdministrativos() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const unsubAdmin = isAdminUser.subscribe((value) => {
      setIsAdmin(!!value);
    });
    const unsubRoles = userRolesLoaded.subscribe((value) => {
      setRolesLoaded(!!value);
    });

    return () => {
      unsubAdmin();
      unsubRoles();
    };
  }, []);

  // Durante a renderização SSG ou enquanto carrega o estado de autenticação
  if (!isMounted || (!rolesLoaded && auth.isLoading)) {
    return (
      <div className="flex flex-col font-sans bg-muted/30 min-h-[calc(100vh-64px)]">
        <div className="flex flex-col md:flex-row md:items-center gap-4 py-6 px-4 max-w-[1000px] mx-auto w-full border-b border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 shrink-0 self-start md:self-center"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold m-0 text-foreground">
              Links administrativos
            </h1>
          </div>
        </div>
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">
            Verificando credenciais de acesso...
          </p>
        </main>
      </div>
    );
  }

  // Se o usuário não estiver autenticado
  if (!auth.isAuthenticated) {
    return (
      <div className="flex flex-col font-sans bg-muted/30 min-h-[calc(100vh-64px)]">
        <div className="flex flex-col md:flex-row md:items-center gap-4 py-6 px-4 max-w-[1000px] mx-auto w-full border-b border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 shrink-0 self-start md:self-center"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold m-0 text-foreground">
              Links administrativos
            </h1>
          </div>
        </div>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-card border border-border shadow-sm p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Acesso Restrito a Administradores
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Esta página contém atalhos diretos para consoles de infraestrutura,
              bancos de dados e ferramentas de gestão do Urbis. O acesso é
              exclusivo para administradores autenticados.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => auth.signinRedirect()}
                className="w-full sm:w-auto gap-2"
              >
                <LogIn className="w-4 h-4" /> Entrar com conta institucional
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full sm:w-auto"
              >
                Voltar ao início
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // Se o usuário estiver autenticado, mas NÃO for administrador
  if (!isAdmin) {
    return (
      <div className="flex flex-col font-sans bg-muted/30 min-h-[calc(100vh-64px)]">
        <div className="flex flex-col md:flex-row md:items-center gap-4 py-6 px-4 max-w-[1000px] mx-auto w-full border-b border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 shrink-0 self-start md:self-center"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold m-0 text-foreground">
              Links administrativos
            </h1>
          </div>
        </div>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-card border border-border shadow-sm p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Permissão Insuficiente
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Você está conectado como{" "}
              <strong className="text-foreground">
                {auth.user?.profile?.name ||
                  auth.user?.profile?.email ||
                  "usuário"}
              </strong>
              , mas sua conta não possui privilégios de administrador para
              acessar as ferramentas de administração do sistema.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar ao início
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  // Usuário Administrador Autenticado: renderiza página completa
  return (
    <div className="flex flex-col font-sans bg-muted/30 min-h-[calc(100vh-64px)]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 px-4 max-w-[1000px] mx-auto w-full border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold m-0 text-foreground">
                Links administrativos
              </h1>
              <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-secondary-foreground">
                Uso interno
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-[1000px] mx-auto w-full space-y-8 pb-16">
        {/* Banner Informativo */}
        <section className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-semibold text-foreground mb-1">
                Central de Ferramentas e Consoles de Administração
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed m-0">
                Abaixo estão listadas as ferramentas e plataformas vinculadas ao
                ecossistema Urbis. Para cada serviço, você encontra uma síntese de
                sua finalidade, o link de acesso direto e os links para as páginas
                correspondentes na documentação técnica oficial (Docs.Urbis).
              </p>
            </div>
          </div>
        </section>

        {/* Grade de Ferramentas Administrativas Principais */}
        <section aria-labelledby="tools-heading" className="space-y-4">
          <h2
            id="tools-heading"
            className="text-lg font-bold text-foreground flex items-center gap-2"
          >
            <Info className="h-5 w-5 text-primary" />
            Plataformas e Serviços de Gestão
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ADMIN_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card
                  key={tool.id}
                  className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
                >
                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground m-0">
                              {tool.title}
                            </h3>
                            <span className="text-xs text-muted-foreground font-medium">
                              {tool.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed m-0">
                        {tool.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border/60">
                      {tool.docs && tool.docs.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-primary" />
                            Documentação no Docs.Urbis:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {tool.docs.map((doc) => (
                              <a
                                key={doc.href}
                                href={doc.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-md transition-colors"
                              >
                                {doc.title}
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2">
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full no-underline"
                        >
                          <Button
                            className="w-full flex items-center justify-center gap-2 font-medium"
                            size="default"
                          >
                            <span>{tool.buttonText}</span>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Recursos Complementares */}
        <section aria-labelledby="complementary-heading" className="space-y-4">
          <h2
            id="complementary-heading"
            className="text-lg font-bold text-foreground"
          >
            Recursos Complementares
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMPLEMENTARY_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block no-underline"
                >
                  <Card className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all h-full p-4 flex items-start gap-3.5">
                    <div className="p-2 rounded-md bg-secondary text-secondary-foreground shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors m-0">
                          {item.title}
                        </h3>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 mb-0 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </Card>
                </a>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
