import Layout from "./Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Ajuda from "./pages/Ajuda";
import DocTecnica from "./pages/DocTecnica";
import GuiaLegislacaoUrbanistica from "./pages/GuiaLegislacaoUrbanistica";
import CartaServicos from "./pages/CartaServicos";
import GuiaFiscalizacaoUrbanistica from "./pages/GuiaFiscalizacaoUrbanistica";
import LinksAdministrativos from "./pages/LinksAdministrativos";
import { Navigate, RouteObject } from "react-router-dom";
import { GlobalProvider } from "./GlobalProvider";
import { Loader2 } from "lucide-react";

const FullscreenLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center">
    <Loader2 className="h-10 w-10 animate-spin" />
  </div>
);

const routes: RouteObject[] = [
  {
    element: <GlobalProvider />,
    children: [
      {
        path: "/callback",
        element: <FullscreenLoader />,
      },
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <Home /> },
          { path: "ajuda", element: <Ajuda /> },
          { path: "sobre", element: <About /> },
          { path: "contato", element: <Contact /> },
          { path: "doc-tecnica", element: <DocTecnica /> },
          {
            path: "guia-legislacao-urbanistica",
            element: <GuiaLegislacaoUrbanistica />,
          },
          { path: "carta-servicos", element: <CartaServicos /> },
          {
            path: "guia-fiscalizacao-urbanistica",
            element: <GuiaFiscalizacaoUrbanistica />,
          },
          {
            path: "links-administrativos",
            element: <LinksAdministrativos />,
          },

          // URLs antigas mantidas por compatibilidade (links externos e indexação)
          {
            path: "info-urbis",
            element: <Navigate to="/guia-legislacao-urbanistica" replace />,
          },
          {
            path: "licencas",
            element: <Navigate to="/guia-fiscalizacao-urbanistica" replace />,
          },
        ],
      },
    ],
  },
];

export default routes;
