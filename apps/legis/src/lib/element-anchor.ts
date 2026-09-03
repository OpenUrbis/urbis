/**
 * Âncoras de dispositivo (`#el-<id>`).
 *
 * Todo elemento normativo é endereçável por URL: de uma coletânea, de uma nota
 * de margem, de um link colado fora do sistema. Onde a âncora cair, duas coisas
 * precisam valer:
 *
 * - o dispositivo para *abaixo* da moldura fixa (cabeçalho do app + barra da
 *   página), nunca escondido debaixo dela;
 * - o foco funciona tanto na primeira pintura (link externo, documento ainda
 *   carregando) quanto em troca de hash (link clicado na própria página).
 *
 * O recuo mora no CSS (`scroll-margin-top` sobre `[data-element-anchor]`, em
 * `globals.css`), justamente para que a rolagem nativa do navegador — a que
 * acontece sozinha ao clicar `<a href="#el-...">` — e a nossa concordem.
 */

const ELEMENT_ANCHOR_PREFIX = "el-";

/** Variável CSS lida pelo `scroll-margin-top` das âncoras. */
export const ELEMENT_ANCHOR_OFFSET_VAR = "--element-anchor-offset";

/** Respiro entre a moldura fixa e o topo do dispositivo focado. */
const ELEMENT_ANCHOR_GAP = "1.5rem";

/** Atributo que marca o alvo focado, para o realce de chegada. */
const ELEMENT_ANCHOR_FOCUS_ATTR = "data-element-anchor-focus";

const FOCUS_HIGHLIGHT_MS = 1400;

export const elementAnchorId = (elementId: string) =>
  `${ELEMENT_ANCHOR_PREFIX}${elementId}`;

export const elementAnchorHref = (elementId: string) =>
  `#${elementAnchorId(elementId)}`;

/**
 * Atributos do alvo da âncora: o `id` responde ao hash da URL e o `data-`
 * carrega o recuo do topo (e é o seletor estável, imune a mudanças de markup).
 */
export const elementAnchorAttributes = (elementId: string) => ({
  id: elementAnchorId(elementId),
  "data-element-anchor": elementId,
});

/** Id do dispositivo em `#el-<id>`; `null` quando o hash não é uma âncora dessas. */
export function parseElementAnchor(hash?: string | null): string | null {
  if (!hash) return null;

  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Hash malformado: vale o que veio, sem quebrar a navegação.
  }

  if (!decoded.startsWith(ELEMENT_ANCHOR_PREFIX)) return null;

  const elementId = decoded.slice(ELEMENT_ANCHOR_PREFIX.length).trim();
  return elementId || null;
}

/**
 * Preserva a âncora ao trocar de tela (ler → editar, editar → ler): quem estava
 * olhando um dispositivo continua nele do outro lado.
 */
export function withElementAnchor(url: string, hash?: string | null): string {
  if (url.includes("#")) return url;

  const elementId = parseElementAnchor(hash);
  return elementId ? `${url}${elementAnchorHref(elementId)}` : url;
}

/**
 * Recuo do topo para a rolagem de âncora, composto no CSS para acompanhar o
 * cabeçalho do app em tempo real.
 *
 * `stickyHeightPx` é a barra fixa própria da tela (a trilha/ações do documento),
 * medida em runtime porque a altura muda com a fonte, o zoom e a largura.
 */
export function elementAnchorOffset(
  stickyHeightPx = 0,
  { includeAppHeader = true, gap = ELEMENT_ANCHOR_GAP } = {},
): string {
  const sticky = Number.isFinite(stickyHeightPx)
    ? Math.max(0, Math.round(stickyHeightPx))
    : 0;
  const parts = [
    includeAppHeader ? "var(--header-height, 0px)" : null,
    `${sticky}px`,
    gap,
  ].filter(Boolean);

  return `calc(${parts.join(" + ")})`;
}

const escapeAttributeValue = (value: string) => value.replace(/["\\]/g, "\\$&");

/**
 * O nó do dispositivo na tela.
 *
 * A leitura marca o alvo com `data-element-anchor`/`id`; no editor o mesmo
 * dispositivo é um bloco do ProseMirror, identificado por `data-normative-id`.
 * Procurar as três formas mantém uma única rotina de foco para as duas telas.
 */
export function findElementAnchorNode(
  elementId: string,
  root: ParentNode | null = typeof document === "undefined" ? null : document,
): HTMLElement | null {
  if (!elementId || !root?.querySelector) return null;

  const value = escapeAttributeValue(elementId);
  const node =
    root.querySelector(`[data-element-anchor="${value}"]`) ??
    root.querySelector(
      `[id="${escapeAttributeValue(elementAnchorId(elementId))}"]`,
    ) ??
    root.querySelector(`[data-normative-id="${value}"]`);

  return (node as HTMLElement | null) ?? null;
}

let activeHighlight: { node: Element; timeout: number } | null = null;

/** Realce breve de chegada: mostra qual dispositivo a âncora endereçava. */
function highlightElementAnchor(node: Element | null): void {
  if (!node) return;

  /*
      No editor o alvo é um bloco do ProseMirror. Escrever atributos no DOM que
      ele governa provoca releitura do documento, e nenhum realce vale esse risco:
      lá a rolagem já basta, e o cursor do usuário diz onde ele está.
    */
  if (node.closest?.(".ProseMirror")) return;

  if (activeHighlight) {
    window.clearTimeout(activeHighlight.timeout);
    activeHighlight.node.removeAttribute(ELEMENT_ANCHOR_FOCUS_ATTR);
    activeHighlight = null;
  }

  node.setAttribute(ELEMENT_ANCHOR_FOCUS_ATTR, "");
  activeHighlight = {
    node,
    timeout: window.setTimeout(() => {
      node.removeAttribute(ELEMENT_ANCHOR_FOCUS_ATTR);
      activeHighlight = null;
    }, FOCUS_HIGHLIGHT_MS),
  };
}

/**
 * Rola até o dispositivo. Devolve o nó alcançado (ou `null` se ele ainda não
 * está na tela), para quem chama decidir se vale tentar de novo.
 */
export function scrollToElementAnchor(
  elementId: string,
  {
    behavior = "auto",
    root,
    highlight = true,
  }: {
    behavior?: ScrollBehavior;
    root?: ParentNode | null;
    highlight?: boolean;
  } = {},
): HTMLElement | null {
  const node = findElementAnchorNode(elementId, root);
  if (!node?.scrollIntoView) return null;

  // `block: 'start'` é o único que respeita `scroll-margin-top`.
  node.scrollIntoView({ behavior, block: "start", inline: "nearest" });
  if (highlight) highlightElementAnchor(node);

  return node;
}
