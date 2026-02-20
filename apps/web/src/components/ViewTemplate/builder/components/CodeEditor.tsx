import { Textarea } from "@open-urbis/map-ui";
import { useEffect, useState } from "react";

interface CodeEditorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CodeEditor = ({
  value = "",
  onChange,
  placeholder,
  className,
}: CodeEditorProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    onChange(newVal);
  };

  return (
    <Textarea
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={`font-mono text-xs ${className}`}
    />
  );
};
