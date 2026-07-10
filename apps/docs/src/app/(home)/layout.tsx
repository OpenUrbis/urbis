import { HomeLayout } from "fumadocs-ui/layouts/home";
import {
  NavbarMenu,
  NavbarMenuContent,
  NavbarMenuLink,
  NavbarMenuTrigger,
} from "fumadocs-ui/layouts/home/navbar";
import { Book, ComponentIcon, Pencil, PlusIcon, Server } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { baseOptions } from "src/lib/layout.shared";

export const metadata: Metadata = {
  other: {
    "dc:title": "Urbis",
    "dc:rights": "Copyright de 202x, Município de São Paulo",
    "dc:license": "https://creativecommons.org/licenses/by-sa/4.0/",
    "dc:source": "https://www.prefeitura.sp.gov.br",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout
      {...baseOptions()}
      links={[
        {
          type: "menu",
          on: "menu",
          text: "Documentation",
          items: [
            {
              text: "Introduction",
              url: "/docs/general/quick-start",
              icon: <Book />,
            },
            {
              text: "Architecture",
              url: "/docs/general/architecture/stack",
              icon: <Server />,
            },
          ],
        },
        {
          type: "custom",
          on: "nav",
          children: (
            <NavbarMenu>
              <NavbarMenuTrigger>
                <Link href="/docs/general/quick-start">Documentation</Link>
              </NavbarMenuTrigger>
              <NavbarMenuContent>
                <NavbarMenuLink
                  href="/docs/general/quick-start"
                  className="md:row-span-2"
                >
                  <div className="-mx-3 -mt-3">
                    <div className="h-32 rounded-t-lg bg-fd-primary/10" />
                  </div>
                  <p className="font-medium">Quick Start</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Get up and running with the platform in minutes.
                  </p>
                </NavbarMenuLink>

                <NavbarMenuLink
                  href="/docs/general/architecture/stack"
                  className="lg:col-start-2"
                >
                  <ComponentIcon className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">Architecture</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Understand the core components and stack.
                  </p>
                </NavbarMenuLink>

                <NavbarMenuLink
                  href="/docs/general/backend/overview"
                  className="lg:col-start-2"
                >
                  <Server className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">Backend</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Explore the API, database, and core modules.
                  </p>
                </NavbarMenuLink>

                <NavbarMenuLink
                  href="/docs/general/auth/accounts"
                  className="lg:col-start-3 lg:row-start-1"
                >
                  <Pencil className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">Authentication</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Learn about user accounts and permissions.
                  </p>
                </NavbarMenuLink>

                <NavbarMenuLink
                  href="/docs/general/deployment/overview"
                  className="lg:col-start-3 lg:row-start-2"
                >
                  <PlusIcon className="bg-fd-primary text-fd-primary-foreground p-1 mb-2 rounded-md" />
                  <p className="font-medium">Deployment</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Guides for deploying to AWS, Docker, and K8s.
                  </p>
                </NavbarMenuLink>
              </NavbarMenuContent>
            </NavbarMenu>
          ),
        },
      ]}
      className="dark:bg-neutral-950 dark:[--color-fd-background:var(--color-neutral-950)] [--color-fd-primary:var(--color-brand)]"
    >
      {children}
    </HomeLayout>
  );
}
