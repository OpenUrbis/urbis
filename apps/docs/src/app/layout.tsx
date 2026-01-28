import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { UrbisFooter } from "@open-urbis/map-ui";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3010",
  ),
  title: "Urbis Documentation - Integração e Dados Geoespaciais",
  description:
    "Documentação oficial da plataforma Urbis da Prefeitura de São Paulo. Sistema de integração, datalake e análise geoespacial.",
  keywords: [
    "urbis",
    "prefeitura de são paulo",
    "datalake",
    "geoespacial",
    "formulários dinâmicos",
    "mapa",
    "infraestrutura",
    "documentação",
  ],
  openGraph: {
    title: "Urbis Documentation - Integração e Dados Geoespaciais",
    description:
      "Documentação oficial da plataforma Urbis da Prefeitura de São Paulo.",
    url: "https://docs.urbis.sampa.br/",
    siteName: "Urbis Docs",
    images: [
      {
        url: "/og-img.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={notoSans.className} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>
          <main className="flex-1">{children}</main>

          {/* Footer global */}
          <UrbisFooter className="border-t mt-8" />
        </RootProvider>
      </body>
    </html>
  );
}
