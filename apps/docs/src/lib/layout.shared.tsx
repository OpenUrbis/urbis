import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import {
  Database,
  FileCode,
  Github,
  Home,
  Map as MapIcon,
  Scale,
  Users,
} from "lucide-react";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Documentação Urbis",
      enabled: false, // Gerenciado pelo UrbisHeader global
    },
    links: [
      {
        text: "Início",
        url: "/",
        icon: <Home className="size-4" />,
      },
      {
        text: "Mapa",
        url: "/docs/general/mapa/layer-configuration",
        icon: <MapIcon className="size-4" />,
      },
      {
        text: "Datalake",
        url: "/docs/datalake",
        icon: <Database className="size-4" />,
      },
      {
        text: "Contas",
        url: "/docs/general/usuarios",
        icon: <Users className="size-4" />,
      },
      {
        text: "Legis",
        url: "/docs/legis",
        icon: <Scale className="size-4" />,
      },
      {
        text: "OpenAPI",
        url: "/docs/openapi",
        icon: <FileCode className="size-4" />,
      },
      {
        text: "GitHub",
        url: "https://github.com/OpenUrbis",
        external: true,
        icon: <Github className="size-4" />,
      },
    ],
  };
}
