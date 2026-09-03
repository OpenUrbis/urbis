import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const TableRowActions = Extension.create({
  name: "tableRowActions",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("tableRowActions"),
        props: {
          decorations: (state) => {
            const { doc } = state;
            const decorations: Decoration[] = [];

            doc.descendants((node, pos) => {
              if (node.type.name === "tableRow") {
                // Find position of the first cell
                // node.firstChild is the first cell
                if (node.firstChild) {
                  const firstCellPos = pos + 1; // Position inside the row, at start of first cell node
                  // We want to put the widget INSIDE the first cell, at its start.
                  // The first cell node starts at pos + 1. Its content starts at pos + 2.
                  // Decoration.widget at pos + 2.

                  const widgetPos = firstCellPos + 1;

                  const widget = Decoration.widget(
                    widgetPos,
                    (view, getPos) => {
                      const btn = document.createElement("button");
                      // Position absolute inside relative cell, visible on row hover (group-hover)
                      btn.className =
                        "absolute left-0.5 top-1/2 -translate-y-1/2 w-4 h-4 inline-flex items-center justify-center rounded hover:bg-primary/20 text-primary/50 hover:text-primary cursor-pointer transition-all opacity-0 group-hover:opacity-100 z-10";
                      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`;
                      btn.title = "Configurar Linha";

                      btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Select the row
                        // We can use TextSelection on the whole row content?
                        // Or just ensure the cursor is in the row and let PageForm logic pick it up.

                        if (typeof getPos === "function") {
                          const currentPos = getPos();
                          if (typeof currentPos === "number") {
                            // Set selection to this position
                            const tr = view.state.tr;
                            tr.setSelection(
                              TextSelection.near(tr.doc.resolve(currentPos)),
                            );
                            view.dispatch(tr);
                            view.focus();
                          }
                        }
                      };
                      return btn;
                    },
                    { side: -1 },
                  ); // side -1 to appear before text

                  decorations.push(widget);
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
