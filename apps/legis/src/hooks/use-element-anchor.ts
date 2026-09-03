import {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ELEMENT_ANCHOR_OFFSET_VAR,
  elementAnchorOffset,
  findElementAnchorNode,
  parseElementAnchor,
  scrollToElementAnchor,
} from "../lib/element-anchor";

/**
 * Foco de âncoras de dispositivo (`#el-<id>`) na leitura e no editor.
 *
 * O alvo raramente está na tela quando a URL chega: o documento é buscado, o
 * editor monta o conteúdo depois, uma coletânea ainda vai carregar os originais
 * referenciados. Daí o padrão: procurar por alguns segundos, rolar, e conferir
 * por um instante se o dispositivo continua no lugar depois que o resto pinta.
 */

/** Janela para o alvo aparecer (documento/editor montando, conteúdo assíncrono). */
const FIND_TIMEOUT_MS = 4000;

/** Janela de conferência: conteúdo que pinta depois desloca o alvo já alcançado. */
const SETTLE_TIMEOUT_MS = 900;

/** Gestos que significam "eu assumo a rolagem": nada mais de reposicionar. */
const USER_SCROLL_EVENTS = [
  "wheel",
  "touchstart",
  "pointerdown",
  "keydown",
] as const;

const noop = () => {};

/** Rolagem suave é enfeite: quem pediu menos movimento recebe o salto direto. */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function focusAnchorFromLocation({
  behavior,
  settle,
}: {
  behavior: ScrollBehavior;
  settle: boolean;
}): () => void {
  if (typeof window === "undefined") return noop;

  const elementId = parseElementAnchor(window.location.hash);
  if (!elementId) return noop;

  let frame = 0;
  let cancelled = false;
  let lastTop = 0;
  let settleUntil = 0;
  const findUntil = Date.now() + FIND_TIMEOUT_MS;

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    if (frame) window.cancelAnimationFrame(frame);
    USER_SCROLL_EVENTS.forEach((event) =>
      window.removeEventListener(event, cancel),
    );
  };

  const keepAligned = () => {
    if (cancelled) return;

    const node = findElementAnchorNode(elementId);
    if (!node) return;

    // Conteúdo que pinta depois (originais de uma coletânea, imagens) empurra
    // o dispositivo para fora do lugar: basta recolocá-lo.
    const top = node.getBoundingClientRect().top;
    if (Math.abs(top - lastTop) > 1) {
      scrollToElementAnchor(elementId, {
        behavior: "instant",
        highlight: false,
      });
      lastTop = node.getBoundingClientRect().top;
    }

    if (Date.now() < settleUntil)
      frame = window.requestAnimationFrame(keepAligned);
  };

  const find = () => {
    if (cancelled) return;

    const node = scrollToElementAnchor(elementId, { behavior });
    if (!node) {
      if (Date.now() < findUntil) frame = window.requestAnimationFrame(find);
      return;
    }

    if (!settle) return;

    lastTop = node.getBoundingClientRect().top;
    settleUntil = Date.now() + SETTLE_TIMEOUT_MS;
    frame = window.requestAnimationFrame(keepAligned);
  };

  USER_SCROLL_EVENTS.forEach((event) =>
    window.addEventListener(event, cancel, { passive: true }),
  );
  // Um frame de folga deixa o conteúdo recém-montado medir antes da primeira tentativa.
  frame = window.requestAnimationFrame(find);

  return cancel;
}

/**
 * Rola até o dispositivo apontado pela URL.
 *
 * @param enabled  liga o foco quando o conteúdo já pode existir na tela.
 * @param resetKey identifica o documento: trocar de página pela mesma rota não
 *                 remonta o componente nem dispara `hashchange`, então a chave é
 *                 o que faz a nova âncora ser buscada.
 */
export function useElementAnchorFocus(
  enabled: boolean,
  resetKey?: string | null,
): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Chegada (link externo, recarga, troca de documento): salto direto, o
    // destino é o início da leitura e não um passeio pelo documento inteiro.
    let cancel = focusAnchorFromLocation({ behavior: "instant", settle: true });

    // Link clicado aqui: o conteúdo já está pintado, então a rolagem suave
    // mostra ao leitor de onde para onde ele foi.
    const refocus = () => {
      cancel();
      cancel = focusAnchorFromLocation({
        behavior: prefersReducedMotion() ? "instant" : "smooth",
        settle: false,
      });
    };

    window.addEventListener("hashchange", refocus);
    window.addEventListener("popstate", refocus);

    return () => {
      cancel();
      window.removeEventListener("hashchange", refocus);
      window.removeEventListener("popstate", refocus);
    };
  }, [enabled, resetKey]);
}

/**
 * Mantém `--element-anchor-offset` alinhado à barra fixa da tela.
 *
 * A altura é medida, não constante: a barra do documento cresce com o zoom, com
 * a fonte e com o que couber nela. Aplique `anchorOffsetStyle` no contêiner que
 * envolve tanto a barra quanto o documento, e `stickyRef` na própria barra.
 */
export function useElementAnchorOffset({ includeAppHeader = true } = {}) {
  const [stickyHeight, setStickyHeight] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const stickyRef = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) {
      setStickyHeight(0);
      return;
    }

    const measure = () => setStickyHeight(node.getBoundingClientRect().height);
    measure();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const anchorOffsetStyle = useMemo(
    () =>
      ({
        [ELEMENT_ANCHOR_OFFSET_VAR]: elementAnchorOffset(stickyHeight, {
          includeAppHeader,
        }),
      }) as CSSProperties,
    [includeAppHeader, stickyHeight],
  );

  return { stickyRef, anchorOffsetStyle };
}
