import React, { useState, useMemo } from "react";
import { 
    EditorRoot, 
    EditorContent, 
    JSONContent, 
    EditorCommand, 
    EditorCommandEmpty, 
    EditorCommandList,
    EditorCommandItem,
    EditorBubble,
} from "novel";
import { defaultExtensions } from "./extensions";
import { suggestionItems as defaultSuggestionItems } from "./slash-command";
import BubbleMenu from "./bubble-menu";

import { type Editor as TiptapEditor } from "@tiptap/core";

import { cx } from "class-variance-authority";
import { Command, renderItems } from "novel";

interface EditorProps {
  initialValue?: JSONContent;
  onChange?: (value: JSONContent) => void;
  editable?: boolean;
  onEditorReady?: (editor: TiptapEditor) => void;
  isNormative?: boolean;
  suggestionItems?: any[]; // Allow overriding items
}

export default function NovelEditorWrapper({ initialValue, onChange, editable = true, onEditorReady, isNormative = false, suggestionItems = defaultSuggestionItems }: EditorProps) {
  // Re-configure slash command with provided items
  const extensions = useMemo(() => {
      const slashCommand = Command.configure({
          suggestion: {
              items: () => suggestionItems,
              render: renderItems,
          },
      });
      // Replace default slashCommand (which might be in defaultExtensions)
      // Actually defaultExtensions has slashCommand configured with default items.
      // We should filter it out and add ours?
      // Or just append? Tiptap usually uses last config.
      return [...(defaultExtensions as any), slashCommand];
  }, [suggestionItems]);

  return (
    <div className="relative w-full max-w-screen-lg novel-editor-wrapper">
      <EditorRoot>
         <EditorContent
            initialContent={initialValue}
            extensions={extensions}
            onCreate={({ editor }) => {
                if (onEditorReady) {
                    onEditorReady(editor as any);
                }
            }}
            onUpdate={({ editor }) => {
                if (onChange) {
                    onChange(editor.getJSON());
                }
            }}
            editorProps={{
                attributes: {
                    class: `prose prose-lg dark:prose-invert focus:outline-none max-w-full min-h-[500px] py-2 pl-10 pr-4 ${!editable ? 'pointer-events-none' : ''} ${isNormative ? 'is-normative' : ''}`,
                },
                editable: () => editable,
            }}
            className="rounded-md shadow-none bg-background"
         >
            <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
                <EditorCommandEmpty className="px-2 text-muted-foreground">Sem resultados</EditorCommandEmpty>
                <EditorCommandList>
                    {suggestionItems.map((item) => (
                        <EditorCommandItem
                            value={item.title}
                            onCommand={(val) => item.command?.(val)}
                            className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                            key={item.title}
                            // @ts-ignore - keywords is not in SuggestionItem type but EditorCommandItem accepts it
                            keywords={item.searchTerms}
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                                {item.icon}
                            </div>
                            <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                        </EditorCommandItem>
                    ))}
                </EditorCommandList>
            </EditorCommand>

            <BubbleMenu />
         </EditorContent>
      </EditorRoot>
    </div>
  );
}
