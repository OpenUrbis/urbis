type MenuItem = { label: string; href: string; active?: boolean };
type UrbisApp = "mosaico" | "mapa" | "dados" | "legis" | "viabiliza" | "docs";

function beginsWith(value: string, prefix: string) {
  return value.indexOf(prefix) === 0;
}

function normalize(value: string) {
  return (value || "").toLowerCase();
}

export function buildUrbisNav(opts: {
  isAuthenticated: boolean;
  /**
   * Força qual app é o atual (útil em localhost / ambientes com host único)
   * Ex: "mapa"
   */
  currentApp?: UrbisApp;
}) {
  const isAuthenticated = opts.isAuthenticated;

  let hostname = "";
  let pathname = "";

  if (typeof window !== "undefined" && window.location) {
    hostname = normalize(window.location.hostname);
    pathname = normalize(window.location.pathname);
  }

  const isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    beginsWith(hostname, "localhost:");

  // Detecção por host (produção)
  const byHostMapa = beginsWith(hostname, "mapa.");
  const byHostDados = beginsWith(hostname, "dadosabertos.");
  const byHostViabiliza = beginsWith(hostname, "viabiliza.");
  const byHostDocs = beginsWith(hostname, "docs.");
  const byHostMosaico = hostname === "urbis.prefeitura.sp.gov.br" || beginsWith(hostname, "urbis.");

  // Detecção por path (dev / host único)
  // Ajuste os prefixes se o seu router usar outra estrutura.
  const byPathMapa = beginsWith(pathname, "/map") || pathname === "/mapa";
  const byPathDados = beginsWith(pathname, "/dados") || beginsWith(pathname, "/dados-abertos");
  const byPathViabiliza = beginsWith(pathname, "/viabiliza");
  const byPathDocs = beginsWith(pathname, "/docs");
  const byPathLegis = beginsWith(pathname, "/docs/legis");

  // ✅ Override explícito (tem prioridade)
  const forced = opts.currentApp;

  const isMapa = forced === "mapa" ? true : byHostMapa || (isLocal && byPathMapa);
  const isDados = forced === "dados" ? true : byHostDados || (isLocal && byPathDados);
  const isViabiliza = forced === "viabiliza" ? true : byHostViabiliza || (isLocal && byPathViabiliza);
  const isDocs = forced === "docs" ? true : byHostDocs || (isLocal && byPathDocs);
  const isLegis =
    forced === "legis"
      ? true
      : (byHostDocs && beginsWith(pathname, "/docs/legis")) || (isLocal && byPathLegis);

  // Mosaico só é "fallback" quando nada mais for verdadeiro
  const isMosaico =
    forced === "mosaico"
      ? true
      : byHostMosaico || (!isMapa && !isDados && !isViabiliza && !isDocs && !isLegis);

  const badgeText = isMapa
    ? "Mapa"
    : isDados
      ? "Dados Abertos"
      : isViabiliza
        ? "Viabiliza"
        : isLegis
          ? "Legis"
          : isDocs
            ? "Doc. técnica"
            : "Mosaico";

  const base: MenuItem[] = [
    { label: "Mosaico", href: "https://urbis.prefeitura.sp.gov.br", active: isMosaico },
    { label: "Mapa", href: "https://mapa.urbis.prefeitura.sp.gov.br", active: isMapa },
    { label: "Dados Abertos", href: "https://dadosabertos.urbis.prefeitura.sp.gov.br", active: isDados },
    { label: "Legis", href: "https://docs.urbis.prefeitura.sp.gov.br/docs/legis", active: isLegis },
    { label: "Viabiliza", href: "https://viabiliza.urbis.prefeitura.sp.gov.br/docs/legis", active: isViabiliza },
    { label: "Doc. técnica", href: "https://docs.urbis.prefeitura.sp.gov.br/", active: isDocs && !isLegis },
  ];

  if (isAuthenticated) {
    base.push({ label: "Datalake", href: "https://datalake.urbis.prefeitura.sp.gov.br" });
  }

  // ✅ remove o item ativo do menu
  const menuItems = base.filter((i) => !i.active);

  return { menuItems, badgeText };
}
