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
  var isAuthenticated = opts.isAuthenticated;

  var hostname = "";
  var pathname = "";

  if (typeof window !== "undefined" && window.location) {
    hostname = normalize(window.location.hostname);
    pathname = normalize(window.location.pathname);
  }

  var isLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    beginsWith(hostname, "localhost:");

  // Detecção por host (produção)
  var byHostMapa = beginsWith(hostname, "mapa.");
  var byHostDados = beginsWith(hostname, "dadosabertos.");
  var byHostViabiliza = beginsWith(hostname, "viabiliza.");
  var byHostDocs = beginsWith(hostname, "docs.");
  var byHostMosaico = hostname === "urbis.prefeitura.sp.gov.br" || beginsWith(hostname, "urbis.");

  // Detecção por path (dev / host único)
  // Ajuste os prefixes se o seu router usar outra estrutura.
  var byPathMapa = beginsWith(pathname, "/map") || pathname === "/mapa";
  var byPathDados = beginsWith(pathname, "/dados") || beginsWith(pathname, "/dados-abertos");
  var byPathViabiliza = beginsWith(pathname, "/viabiliza");
  var byPathDocs = beginsWith(pathname, "/docs");
  var byPathLegis = beginsWith(pathname, "/docs/legis");

  // ✅ Override explícito (tem prioridade)
  var forced = opts.currentApp;

  var isMapa = forced === "mapa" ? true : byHostMapa || (isLocal && byPathMapa);
  var isDados = forced === "dados" ? true : byHostDados || (isLocal && byPathDados);
  var isViabiliza = forced === "viabiliza" ? true : byHostViabiliza || (isLocal && byPathViabiliza);
  var isDocs = forced === "docs" ? true : byHostDocs || (isLocal && byPathDocs);
  var isLegis =
    forced === "legis"
      ? true
      : (byHostDocs && beginsWith(pathname, "/docs/legis")) || (isLocal && byPathLegis);

  // Mosaico só é "fallback" quando nada mais for verdadeiro
  var isMosaico =
    forced === "mosaico"
      ? true
      : byHostMosaico || (!isMapa && !isDados && !isViabiliza && !isDocs && !isLegis);

  var badgeText = isMapa
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

  var base: MenuItem[] = [
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
  var menuItems = base.filter(function (i) {
    return !i.active;
  });

  return { menuItems: menuItems, badgeText: badgeText };
}