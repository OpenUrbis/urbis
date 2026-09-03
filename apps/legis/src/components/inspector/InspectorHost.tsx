import React, { useState } from "react";
import type { AnnotatedTextSegment } from "../../domain/types";
import { InspectorShell } from "./InspectorShell";
import { HtmlEditorView } from "./HtmlEditorView";
import { LinkMultiPickerView } from "./LinkMultiPickerView";
import { LinkPickerView } from "./LinkPickerView";
import { TrechoView } from "./TrechoView";
import {
  useInspectorTask,
  type TrechosTaskRequest,
  type LinksTaskRequest,
} from "./inspector-task-context";

/**
 * Renders whichever step the centre column asked for. When there is no pending
 * task it simply renders the panel that belongs to the page, so the inspector is
 * a single column that changes content instead of a pile of dialogs.
 */

/** Holds the passages while they are being edited, resolving only on "Concluir". */
function TrechoTaskView({
  task,
  editor,
  onResolve,
  onToggleCollapse,
}: {
  task: TrechosTaskRequest;
  editor?: unknown;
  onResolve: (segments: AnnotatedTextSegment[]) => void;
  onToggleCollapse?: () => void;
}) {
  const [segments, setSegments] = useState<AnnotatedTextSegment[]>(
    task.segments,
  );

  return (
    <TrechoView
      baseText={task.baseText}
      elementId={task.elementId}
      elementLabel={task.elementLabel}
      situationType={task.situationType}
      segments={segments}
      onChange={setSegments}
      onBack={() => onResolve(segments)}
      editor={editor}
      onToggleCollapse={onToggleCollapse}
    />
  );
}

/**
 * A multi-link step can itself open a passage step. Rather than nesting tasks,
 * the sub-step is kept as local state of this view.
 */
function LinksTaskView({
  task,
  editor,
  onResolve,
  onCancel,
  onToggleCollapse,
}: {
  task: LinksTaskRequest;
  editor?: unknown;
  onResolve: (payload: Parameters<LinksTaskRequest["onResolve"]>) => void;
  onCancel: () => void;
  onToggleCollapse?: () => void;
}) {
  const [segmentStep, setSegmentStep] = useState<{
    elementId: string;
    elementLabel: string;
    baseText: string;
    segments: AnnotatedTextSegment[];
    onResolve: (segments: AnnotatedTextSegment[]) => void;
  } | null>(null);

  if (segmentStep) {
    return (
      <TrechoTaskView
        task={{
          kind: "trechos",
          baseText: segmentStep.baseText,
          elementId: segmentStep.elementId,
          elementLabel: segmentStep.elementLabel,
          situationType: "Nova redação",
          segments: segmentStep.segments,
          onResolve: segmentStep.onResolve,
        }}
        editor={editor}
        onResolve={(segments) => {
          segmentStep.onResolve(segments);
          setSegmentStep(null);
        }}
        onToggleCollapse={onToggleCollapse}
      />
    );
  }

  return (
    <LinkMultiPickerView
      title={task.title}
      initialLinks={task.initialLinks}
      localElements={task.localElements}
      onConfirm={(links, cache) => onResolve([links, cache])}
      onBack={onCancel}
      onToggleCollapse={onToggleCollapse}
      onRequestSegments={(request) =>
        setSegmentStep({
          elementId: request.elementId,
          elementLabel: request.elementLabel,
          baseText: request.baseText,
          segments: request.segments,
          onResolve: request.onResolve,
        })
      }
    />
  );
}

export interface InspectorHostProps {
  /** Tiptap instance, enabling passage capture inside the steps. */
  editor?: unknown;
  /** Panel rendered when no step is pending. */
  children?: React.ReactNode;
}

export function InspectorHost({ editor, children }: InspectorHostProps) {
  const { task, resolve, cancel } = useInspectorTask();
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => setCollapsed((value) => !value);

  if (!task) return <>{children}</>;

  switch (task.kind) {
    case "link":
      return (
        <InspectorShell
          mode="link"
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        >
          <LinkPickerView
            title={task.title}
            localElements={task.localElements}
            initialSelection={task.initialSelection}
            onSelect={(selection) => resolve(selection)}
            onBack={cancel}
            onToggleCollapse={toggleCollapse}
          />
        </InspectorShell>
      );

    case "links":
      return (
        <InspectorShell
          mode="link"
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        >
          <LinksTaskView
            task={task}
            editor={editor}
            onResolve={([links, cache]) => resolve({ links, cache })}
            onCancel={cancel}
            onToggleCollapse={toggleCollapse}
          />
        </InspectorShell>
      );

    case "trechos":
      return (
        <InspectorShell
          mode="trechos"
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        >
          <TrechoTaskView
            task={task}
            editor={editor}
            onResolve={(segments) => resolve(segments)}
            onToggleCollapse={toggleCollapse}
          />
        </InspectorShell>
      );

    case "html":
      return (
        <InspectorShell
          mode="code"
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        >
          <HtmlEditorView
            title={task.title}
            initialValue={task.initialValue}
            onConfirm={(html) => resolve(html)}
            onBack={cancel}
            onToggleCollapse={toggleCollapse}
          />
        </InspectorShell>
      );
  }
}
