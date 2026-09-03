/**
 * Typography of the document title, shared by the reader and the editor.
 *
 * Reading and editing are the same document, so the title must not change size
 * or weight when you switch between them: only the caret should tell them apart.
 * Keeping it in one constant is what stops the two screens from drifting again.
 *
 * The `md:` step is not decoration. The shared `Textarea` ships with a baked-in
 * `md:text-sm`, and `tailwind-merge` keeps it because it is a different modifier
 * than a plain `text-*`. Without an `md:` override of our own, the editable
 * title silently collapsed to 14px on any screen wider than 768px.
 */
export const DOCUMENT_TITLE_CLASS =
  "text-2xl font-bold leading-tight tracking-tight md:text-3xl";

/**
 * Extra classes that strip the form-field look off the editable title: no box,
 * no padding, no focus ring, and no minimum height fighting the auto-resize.
 */
export const DOCUMENT_TITLE_INPUT_RESET =
  "w-full min-h-0 resize-none overflow-hidden rounded-none border-0 bg-transparent p-0 shadow-none outline-none placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-default disabled:opacity-100";
