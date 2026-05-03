import { ViteReactSSG } from "vite-react-ssg";
import { jsxs, jsx } from "react/jsx-runtime";
import { Link, Outlet } from "react-router-dom";
import { Slot } from "@radix-ui/react-slot";
function Layout() {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-screen bg-background font-sans antialiased text-foreground", children: [
    /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", children: /* @__PURE__ */ jsxs("div", { className: "container flex h-14 max-w-screen-2xl items-center", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "mr-6 flex items-center space-x-2 font-bold", children: "Urbis" }),
      /* @__PURE__ */ jsxs("nav", { className: "flex items-center gap-4 text-sm lg:gap-6", children: [
        /* @__PURE__ */ jsx(Link, { to: "/sobre", className: "transition-colors hover:text-foreground/80 text-foreground/60", children: "Sobre" }),
        /* @__PURE__ */ jsx(Link, { to: "/contato", className: "transition-colors hover:text-foreground/80 text-foreground/60", children: "Contato" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("main", { className: "flex-1", children: /* @__PURE__ */ jsx(Outlet, {}) }),
    /* @__PURE__ */ jsx("footer", { className: "py-6 md:px-8 md:py-0 border-t", children: /* @__PURE__ */ jsx("div", { className: "container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row", children: /* @__PURE__ */ jsx("p", { className: "text-balance text-center text-sm leading-loose text-muted-foreground md:text-left", children: "© 2024 Urbis. Todos os direitos reservados." }) }) })
  ] });
}
function Home() {
  return /* @__PURE__ */ jsx("div", { className: "container py-10", children: /* @__PURE__ */ jsxs("section", { className: "mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]", children: "Bem-vindo ao Urbis" }),
    /* @__PURE__ */ jsx("span", { className: "max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl", children: "Construindo o futuro do mapeamento urbano com tecnologia de ponta." }),
    /* @__PURE__ */ jsxs("div", { className: "flex w-full items-center justify-center space-x-4 py-4 md:pb-10", children: [
      /* @__PURE__ */ jsx("button", { className: "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8", children: "Começar" }),
      /* @__PURE__ */ jsx(Slot, { className: "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8", children: /* @__PURE__ */ jsx("a", { href: "/sobre", children: "Saiba mais" }) })
    ] })
  ] }) });
}
function About() {
  return /* @__PURE__ */ jsxs("div", { className: "container py-10", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-4", children: "Sobre Nós" }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Esta é a página sobre." })
  ] });
}
function Contact() {
  return /* @__PURE__ */ jsxs("div", { className: "container py-10", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-4", children: "Contato" }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Entre em contato conosco." })
  ] });
}
const routes = [
  {
    path: "/",
    element: /* @__PURE__ */ jsx(Layout, {}),
    children: [
      { index: true, element: /* @__PURE__ */ jsx(Home, {}) },
      { path: "sobre", element: /* @__PURE__ */ jsx(About, {}) },
      { path: "contato", element: /* @__PURE__ */ jsx(Contact, {}) }
    ]
  }
];
const createApp = ViteReactSSG(
  // @ts-ignore
  { routes, base: "/" }
);
export {
  createApp
};
