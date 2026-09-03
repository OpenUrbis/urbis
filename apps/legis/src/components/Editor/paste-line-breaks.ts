import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Fragment, Node as ProseMirrorNode, Slice } from "@tiptap/pm/model";

/**
 * Why pasted text sometimes lands inside a single block (one normative
 * element) instead of breaking into one block per line:
 *
 * Word, Google Docs, PDF viewers, VS Code, terminals and many sites ship a
 * `text/html` flavour of the clipboard where the content sits in a `<pre>` or in
 * an element carrying `style="white-space: pre-wrap"`. `prosemirror-model`
 * honours that (`ParseContext.addElement` turns on `localPreserveWS`), so the
 * pasted HTML is parsed with whitespace preservation and the literal `\n`
 * survives *inside a text node* instead of producing sibling blocks.
 *
 * The result is exactly the reported symptom: one paragraph in the JSON, one
 * `normativeId`, one normative element — and no visible break either, because
 * the editor renders with `white-space: normal`, so `\n` collapses to a space.
 * It only happens "sometimes" because it depends on the HTML produced by the
 * source app: when the clipboard has no `text/html` (plain text) ProseMirror
 * already splits on `/(?:\r\n?|\n)+/`, and when the HTML uses `<p>`/`<div>` per
 * line the break survives as separate blocks.
 *
 * `<br>` has the same practical effect here: it becomes a `hardBreak` *inside*
 * the paragraph, so two logical lines still collapse into a single normative
 * element.
 *
 * Fixing it at the source (`transformPastedHTML`) is not enough — removing the
 * `white-space` style would make ProseMirror collapse the `\n` into a space and
 * the break would be lost for good. So we normalize one level later, on the
 * parsed slice (`transformPasted`), which is source-agnostic and also covers
 * drag & drop.
 */

export interface PasteLineBreaksOptions {
  /** Also break blocks on `<br>` / `hardBreak` coming from the clipboard. */
  splitHardBreaks: boolean;
  /**
   * Collapse the tab/space runs that `white-space: pre` sources drag along
   * (indentation, column padding). Only applied to the lines we split.
   */
  collapseWhitespace: boolean;
}

export const defaultPasteLineBreaksOptions: PasteLineBreaksOptions = {
  splitHardBreaks: true,
  collapseWhitespace: true,
};

/**
 * `\u000b` is what Word uses for a manual line break, `\u0085`/`\u2028`/`\u2029`
 * show up in PDF and RTF exports.
 */
const LINE_BREAK = /\r\n?|[\n\u000b\u000c\u0085\u2028\u2029]/; // eslint-disable-line no-control-regex -- \u000b/\u000c are real line breaks in Word/PDF clipboards

/** Attributes that must not be duplicated across the blocks we create. */
const IDENTITY_ATTRS = ["normativeId"] as const;

function isPreservedWhitespaceNode(node: ProseMirrorNode) {
  return node.type.spec.code === true || node.type.spec.whitespace === "pre";
}

function isSplittableTextblock(node: ProseMirrorNode) {
  return node.isTextblock && !isPreservedWhitespaceNode(node);
}

function isHardBreak(node: ProseMirrorNode) {
  return (
    !node.isText &&
    node.isLeaf &&
    (node.type.name === "hardBreak" ||
      node.type.spec.linebreakReplacement === true)
  );
}

function withText(node: ProseMirrorNode, text: string) {
  return node.type.schema.text(text, node.marks);
}

function collapseSpaces(text: string) {
  return text.replace(/[\t ]+/g, " ");
}

function attrsForFollowingBlock(attrs: Record<string, unknown>) {
  const next = { ...attrs };
  IDENTITY_ATTRS.forEach((key) => {
    if (key in next) next[key] = null;
  });
  return next;
}

/**
 * Splits the inline content of a textblock on every line break, returning one
 * array of inline nodes per line, or `null` when there is nothing to split.
 */
function toLines(
  node: ProseMirrorNode,
  options: PasteLineBreaksOptions,
): ProseMirrorNode[][] | null {
  const lines: ProseMirrorNode[][] = [[]];
  let sawBreak = false;

  node.content.forEach((child) => {
    if (child.isText) {
      const parts = (child.text ?? "").split(LINE_BREAK);

      parts.forEach((part, index) => {
        if (index > 0) {
          lines.push([]);
          sawBreak = true;
        }

        const text = options.collapseWhitespace ? collapseSpaces(part) : part;
        if (text) lines[lines.length - 1].push(withText(child, text));
      });

      return;
    }

    if (options.splitHardBreaks && isHardBreak(child)) {
      lines.push([]);
      sawBreak = true;
      return;
    }

    lines[lines.length - 1].push(child);
  });

  return sawBreak ? lines : null;
}

/** Drops the leading/trailing whitespace left behind by the split. */
function trimLine(line: ProseMirrorNode[]) {
  const nodes = [...line];

  while (nodes.length && nodes[0].isText) {
    const text = (nodes[0].text ?? "").replace(/^[\t ]+/, "");
    if (!text) {
      nodes.shift();
      continue;
    }
    if (text !== nodes[0].text) nodes[0] = withText(nodes[0], text);
    break;
  }

  while (nodes.length && nodes[nodes.length - 1].isText) {
    const last = nodes[nodes.length - 1];
    const text = (last.text ?? "").replace(/[\t ]+$/, "");
    if (!text) {
      nodes.pop();
      continue;
    }
    if (text !== last.text) nodes[nodes.length - 1] = withText(last, text);
    break;
  }

  return nodes;
}

/**
 * Turns one textblock carrying line breaks into the sibling blocks it should
 * have been. Returns `null` when the block has no break to act on.
 */
function splitTextblock(
  node: ProseMirrorNode,
  options: PasteLineBreaksOptions,
): ProseMirrorNode[] | null {
  const lines = toLines(node, options);
  if (!lines) return null;

  const blocks = lines
    .map(trimLine)
    .filter((line) => line.length > 0)
    .map((line, index) =>
      node.type.create(
        index === 0 ? node.attrs : attrsForFollowingBlock(node.attrs),
        Fragment.fromArray(line),
        node.marks,
      ),
    );

  if (blocks.length) return blocks;

  // The block held nothing but breaks: keep a single empty block so the paste
  // still behaves like pressing Enter.
  const empty = node.type.createAndFill(node.attrs, undefined, node.marks);
  return empty ? [empty] : null;
}

/**
 * Recursively rewrites a fragment so no textblock keeps a literal line break.
 * Returns the very same fragment instance when nothing changed, so callers can
 * cheaply detect a no-op.
 */
export function splitLineBreaksInFragment(
  fragment: Fragment,
  options: PasteLineBreaksOptions = defaultPasteLineBreaksOptions,
): Fragment {
  const children: ProseMirrorNode[] = [];
  let changed = false;

  fragment.forEach((child) => {
    if (isSplittableTextblock(child)) {
      const blocks = splitTextblock(child, options);
      if (blocks) {
        changed = true;
        children.push(...blocks);
      } else {
        children.push(child);
      }
      return;
    }

    if (child.isLeaf || isPreservedWhitespaceNode(child)) {
      children.push(child);
      return;
    }

    const content = splitLineBreaksInFragment(child.content, options);
    if (content === child.content) {
      children.push(child);
      return;
    }

    // A textblock split adds siblings, which some parents (a table cell with a
    // single-child content expression, for instance) may not accept.
    // `matchFragment` also accepts a valid prefix, so open slices still pass.
    if (!child.type.contentMatch.matchFragment(content)) {
      children.push(child);
      return;
    }

    changed = true;
    children.push(child.copy(content));
  });

  return changed ? Fragment.fromArray(children) : fragment;
}

/** Same as {@link splitLineBreaksInFragment}, keeping the slice's open depths. */
export function splitLineBreaksInSlice(
  slice: Slice,
  options: PasteLineBreaksOptions = defaultPasteLineBreaksOptions,
): Slice {
  if (!slice.content.size) return slice;

  const content = splitLineBreaksInFragment(slice.content, options);
  if (content === slice.content) return slice;

  // Nesting depth is never changed (only sibling count and text), so the open
  // depths stay meaningful and the paste keeps merging into the current block.
  return new Slice(content, slice.openStart, slice.openEnd);
}

/**
 * Normalizes pasted/dropped content so every line becomes its own block —
 * and therefore its own normative element.
 */
export const PasteLineBreaks = Extension.create<PasteLineBreaksOptions>({
  name: "pasteLineBreaks",

  addOptions() {
    return { ...defaultPasteLineBreaksOptions };
  },

  addProseMirrorPlugins() {
    const options = this.options;

    return [
      new Plugin({
        key: new PluginKey("pasteLineBreaks"),
        props: {
          transformPasted: (slice) => {
            try {
              return splitLineBreaksInSlice(slice, options);
            } catch {
              // Never block a paste because of normalization.
              return slice;
            }
          },
        },
      }),
    ];
  },
});
