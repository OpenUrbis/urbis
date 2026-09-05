import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  AnnotatedTextSegment,
  SpecialSituationType,
} from "../../domain/types";
import type {
  CollectionLink,
  NormativeElementEntity,
  OriginalNormativo,
} from "../../domain/entities";
import type { LinkPickerSelection } from "./LinkPickerView";

/**
 * Channel used by components in the centre column (the editor, the metadata
 * form) to ask the lateral inspector for a step, instead of opening a dialog.
 *
 * A task carries its own `onResolve`, so the requester keeps ownership of what
 * happens with the result and the inspector stays generic.
 */

export interface LinkTaskRequest {
  kind: "link";
  title?: string;
  localElements?: NormativeElementEntity[];
  initialSelection?: { documentId?: string; elementId?: string };
  onResolve: (selection: LinkPickerSelection) => void;
}

export interface AcrescimoTaskRequest {
  kind: "acrescimo";
  title?: string;
  localElements?: NormativeElementEntity[];
  onResolve: (
    selection: LinkPickerSelection,
    segments: AnnotatedTextSegment[],
  ) => void;
}

export interface LinksTaskRequest {
  kind: "links";
  title?: string;
  initialLinks: CollectionLink[];
  localElements?: NormativeElementEntity[];
  onResolve: (
    links: CollectionLink[],
    cache: Record<string, OriginalNormativo>,
  ) => void;
}

export interface TrechosTaskRequest {
  kind: "trechos";
  title?: string;
  baseText: string;
  elementId: string;
  elementLabel: string;
  situationType: SpecialSituationType;
  segments: AnnotatedTextSegment[];
  onResolve: (segments: AnnotatedTextSegment[]) => void;
}

export interface HtmlTaskRequest {
  kind: "html";
  title?: string;
  initialValue?: string;
  onResolve: (html: string) => void;
}

export type InspectorTask =
  | LinkTaskRequest
  | AcrescimoTaskRequest
  | LinksTaskRequest
  | TrechosTaskRequest
  | HtmlTaskRequest;

interface InspectorTaskContextValue {
  task: InspectorTask | null;
  request: (task: InspectorTask) => void;
  /** Resolves the task with a value and closes the view. */
  resolve: (value: unknown) => void;
  /** Closes the view without resolving. */
  cancel: () => void;
}

const InspectorTaskContext = createContext<InspectorTaskContextValue | null>(
  null,
);

export function InspectorTaskProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [task, setTask] = useState<InspectorTask | null>(null);

  const request = useCallback((next: InspectorTask) => setTask(next), []);
  const cancel = useCallback(() => setTask(null), []);

  const resolve = useCallback((value: unknown) => {
    setTask((current) => {
      if (!current) return null;

      switch (current.kind) {
        case "link":
          current.onResolve(value as LinkPickerSelection);
          break;
        case "acrescimo": {
          const payload = value as {
            selection: LinkPickerSelection;
            segments: AnnotatedTextSegment[];
          };
          current.onResolve(payload.selection, payload.segments);
          break;
        }
        case "links": {
          const payload = value as {
            links: CollectionLink[];
            cache: Record<string, OriginalNormativo>;
          };
          current.onResolve(payload.links, payload.cache);
          break;
        }
        case "trechos":
          current.onResolve(value as AnnotatedTextSegment[]);
          break;
        case "html":
          current.onResolve(value as string);
          break;
      }

      return null;
    });
  }, []);

  const contextValue = useMemo(
    () => ({ task, request, resolve, cancel }),
    [task, request, resolve, cancel],
  );

  return (
    <InspectorTaskContext.Provider value={contextValue}>
      {children}
    </InspectorTaskContext.Provider>
  );
}

/**
 * Returns the requester side of the channel. Safe to call outside the provider:
 * `request` becomes a no-op, so a component can be reused in contexts without an
 * inspector (previews, tests) without crashing.
 */
export function useInspectorTaskRequest() {
  const context = useContext(InspectorTaskContext);

  return useMemo(
    () => ({
      request: context?.request ?? (() => undefined),
      available: !!context,
    }),
    [context],
  );
}

/** Returns the inspector side of the channel. */
export function useInspectorTask(): InspectorTaskContextValue {
  const context = useContext(InspectorTaskContext);

  return (
    context ?? {
      task: null,
      request: () => undefined,
      resolve: () => undefined,
      cancel: () => undefined,
    }
  );
}
