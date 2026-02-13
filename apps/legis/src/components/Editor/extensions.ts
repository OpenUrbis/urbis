import {
  StarterKit,
  TiptapImage,
  TaskItem,
  TaskList,
  HorizontalRule,
  Placeholder,
  AIHighlight,
  CodeBlockLowlight,
  TextStyle,
  Command,
  renderItems,
  GlobalDragHandle,
} from "novel";

import { cx } from "class-variance-authority";
import { common, createLowlight } from "lowlight";
import { suggestionItems } from "./slash-command";
import { ActiveBlock } from "./active-block";

// Create lowlight instance for code blocks
const lowlight = createLowlight(common);

const tiptapImage = TiptapImage.configure({
  allowBase64: true,
  HTMLAttributes: {
    class: cx("rounded-lg border border-muted"),
  },
});

const taskList = TaskList.configure({
  HTMLAttributes: {
    class: cx("not-prose pl-2"),
  },
});

const taskItem = TaskItem.configure({
  HTMLAttributes: {
    class: cx("flex gap-2 items-start my-4"),
  },
  nested: true,
});

const horizontalRule = HorizontalRule.configure({
  HTMLAttributes: {
    class: cx("mt-4 mb-6 border-t border-muted-foreground/30"),
  },
});

const starterKit = StarterKit.configure({
  bulletList: {
    HTMLAttributes: {
      class: cx("list-disc list-outside leading-3 -mt-2"),
    },
  },
  orderedList: {
    HTMLAttributes: {
      class: cx("list-decimal list-outside leading-3 -mt-2"),
    },
  },
  listItem: {
    HTMLAttributes: {
      class: cx("leading-normal -mb-2"),
    },
  },
  blockquote: {
    HTMLAttributes: {
      class: cx("border-l-4 border-primary"),
    },
  },
  codeBlock: false, // disable default codeBlock to use lowlight
  code: {
    HTMLAttributes: {
      class: cx("rounded-md bg-muted px-1.5 py-1 font-mono font-medium"),
      spellcheck: "false",
    },
  },
  horizontalRule: false,
  dropcursor: {
    color: "#DBEAFE",
    width: 4,
  },
  gapcursor: false,
});

const codeBlockLowlight = CodeBlockLowlight.configure({
  lowlight,
});

const placeholder = Placeholder.configure({
    placeholder: "Pressione '/' para comandos...",
    includeChildren: true,
});

const textStyle = TextStyle.configure({
    HTMLAttributes: {
      class: cx("font-medium"),
    },
});

const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});

export const defaultExtensions = [
  starterKit,
  placeholder,
  tiptapImage,
  taskList,
  taskItem,
  horizontalRule,
  codeBlockLowlight,
  AIHighlight,
  textStyle,
  slashCommand,
  GlobalDragHandle,
  ActiveBlock,
];
