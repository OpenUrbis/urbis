import React, { useMemo, useState, useEffect } from "react";
import { useBuilder } from "../builder/BuilderContext";
import { Label, Input } from "@open-urbis/map-ui";
import {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

interface EjsDataSelectorProps {
  name: string;
  label?: string;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  placeholder?: string;
}

export const EjsDataSelector: React.FC<EjsDataSelectorProps> = ({
  name,
  label = "Valor",
  register,
  setValue,
  watch,
  placeholder = "Selecione ou digite...",
}) => {
  const { mockData } = useBuilder();
  const currentValue = watch(name);
  const [mode, setMode] = useState<"select" | "custom">("select");

  // Extract keys from mockData.properties
  const dataKeys = useMemo(() => {
    if (mockData && mockData.properties) {
      return Object.keys(mockData.properties);
    }
    return [];
  }, [mockData]);

  // Determine initial mode
  useEffect(() => {
    if (currentValue) {
      const match = currentValue.match(
        /^<%- (?:properties\?\.)?([^ ]+)(?: \?\? '-')? %>$/,
      );
      const isExactMatch = match && dataKeys.includes(match[1]);

      if (
        !isExactMatch &&
        !dataKeys.some((k) => `<%- properties.${k} %>` === currentValue)
      ) {
        setMode("custom");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKeys]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "___custom___") {
      setMode("custom");
    } else if (val) {
      setMode("select");
      setValue(name, `<%- properties.${val} %>`, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      setMode("select");
      setValue(name, "", { shouldDirty: true, shouldValidate: true });
    }
  };

  const getSelectedValue = () => {
    if (mode === "custom") return "___custom___";
    if (!currentValue) return "";

    // Testa o formato padrão do select
    const match = currentValue.match(/^<%- properties\.([^ ]+) %>$/);
    if (match && dataKeys.includes(match[1])) {
      return match[1];
    }

    // Testa o formato gerado pelo Auto Preencher
    const matchAuto = currentValue.match(
      /^<%- (?:properties\?\.)?([^ ]+) \?\? '-' %>$/,
    );
    if (matchAuto && dataKeys.includes(matchAuto[1])) {
      return matchAuto[1];
    }

    return "___custom___";
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-2">
        <select
          className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={getSelectedValue()}
          onChange={handleSelectChange}
        >
          <option value="">Selecione uma propriedade...</option>
          {dataKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
          <option value="___custom___">Personalizado (EJS ou Texto)</option>
        </select>

        {mode === "custom" && (
          <Input
            {...register(name)}
            placeholder={placeholder}
            className="w-full font-mono text-xs"
          />
        )}

        {mode === "select" && <input type="hidden" {...register(name)} />}
      </div>
    </div>
  );
};
