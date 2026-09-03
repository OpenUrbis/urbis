import { useCallback, useEffect, useMemo, useState } from "react";
import { pageService } from "../services/page-service";
import {
  formatPageReference,
  type PageReference,
} from "../domain/page-reference";

/**
 * Cache de módulo: as referências de origem repetem muito entre dispositivos do
 * mesmo documento (e entre remontagens da view), e o rótulo não muda durante a
 * sessão. `null` marca id inexistente, para não pedir de novo.
 */
const referenceCache = new Map<string, PageReference | null>();
/** Ids já pedidos nesta sessão; falha de rede os devolve para nova tentativa. */
const requestedIds = new Set<string>();

const ID_SEPARATOR = "|";

const toKey = (ids: string[]) =>
  Array.from(new Set(ids.filter(Boolean)))
    .sort()
    .join(ID_SEPARATOR);

const snapshotFor = (key: string) => {
  const snapshot = new Map<string, PageReference>();
  if (!key) return snapshot;

  key.split(ID_SEPARATOR).forEach((id) => {
    const cached = referenceCache.get(id);
    if (cached) snapshot.set(id, cached);
  });

  return snapshot;
};

/**
 * Resolve ids de páginas em referências legíveis. Usado onde o modelo guarda só
 * o identificador (ex.: origem de uma situação especial), para o leitor ver o
 * nome do documento e poder abri-lo em vez de encarar um id técnico.
 */
export function usePageReferences(
  ids: string[],
): (id?: string) => PageReference | undefined {
  const key = useMemo(() => toKey(ids), [ids]);
  const [resolved, setResolved] = useState(() => snapshotFor(key));

  useEffect(() => {
    setResolved(snapshotFor(key));
    if (!key) return;

    const missing = key
      .split(ID_SEPARATOR)
      .filter((id) => !requestedIds.has(id));
    if (!missing.length) return;

    let active = true;
    missing.forEach((id) => requestedIds.add(id));

    pageService
      .getPagesByIds(missing)
      .then((pages) => {
        const found = new Set<string>();

        pages.forEach((page) => {
          referenceCache.set(page.id, formatPageReference(page));
          found.add(page.id);
        });

        // Ausente de verdade: registra para não pedir a cada render.
        missing.forEach((id) => {
          if (!found.has(id)) referenceCache.set(id, null);
        });

        if (active) setResolved(snapshotFor(key));
      })
      .catch(() => {
        // Falha de rede não é ausência: libera os ids para outra tentativa.
        missing.forEach((id) => requestedIds.delete(id));
      });

    return () => {
      active = false;
    };
  }, [key]);

  return useCallback(
    (id?: string) => (id ? resolved.get(id) : undefined),
    [resolved],
  );
}
