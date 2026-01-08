import { cn } from "@/lib/utils";
import Editor, { OnMount } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  className?: string;
  placeholder?: string;
  schema?: object;
}

export const CodeEditor = ({
  value,
  onChange,
  language = "json",
  className,
  schema,
}: CodeEditorProps) => {
  const [internalValue, setInternalValue] = useState(value);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || "";
    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    if (schema && language === "json") {
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          {
            uri: "http://internal/view-template-schema.json",
            fileMatch: ["*"],
            schema: schema,
          },
        ],
      });
    }
  };

  return (
    <div className={cn("relative font-mono text-sm border rounded-md overflow-hidden h-full", className)}>
      <Editor
        height="100%"
        defaultLanguage={language}
        value={internalValue}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          wordWrap: "on",
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
};
