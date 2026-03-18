import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";
import { Plus, Trash2 } from "lucide-react";
import { getIcon } from "../../utils/layer-utils";
import {
  FilterCondition,
  FilterGroup,
  FilterNode,
} from "./types";
import { memo, useState, useEffect } from "preact/compat";

export interface FilterField {
  name: string;
  type: "text" | "number" | "date";
  label?: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

interface FilterBuilderProps {
  value: FilterGroup;
  onChange: (value: FilterGroup) => void;
  fields?: FilterField[];
}

export const FilterBuilder = memo(({
  value,
  onChange,
  fields = [],
}: FilterBuilderProps) => {
  return <GroupNode group={value} onChange={onChange} fields={fields} isRoot />;
});

interface GroupNodeProps {
  group: FilterGroup;
  onChange: (group: FilterGroup) => void;
  onDelete?: () => void;
  fields: FilterField[];
  isRoot?: boolean;
}

const GroupNode = memo(({
  group,
  onChange,
  onDelete,
  fields,
  isRoot,
}: GroupNodeProps) => {
  const updateOperator = (op: "AND" | "OR") => {
    onChange({ ...group, operator: op });
  };

  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: generateId(),
      type: "condition",
      field: fields[0]?.name || "",
      operator: "=",
      value: "",
    };
    onChange({ ...group, children: [...group.children, newCondition] });
  };

  const addGroup = () => {
    const newGroup: FilterGroup = {
      id: generateId(),
      type: "group",
      operator: "AND",
      children: [],
    };
    onChange({ ...group, children: [...group.children, newGroup] });
  };

  const removeChild = (childId: string) => {
    onChange({
      ...group,
      children: group.children.filter((c) => c.id !== childId),
    });
  };

  const updateChild = (child: FilterNode) => {
    onChange({
      ...group,
      children: group.children.map((c) => (c.id === child.id ? child : c)),
    });
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-card/50">
      <div className="flex items-center gap-2">
        <Select
          value={group.operator}
          onValueChange={(v: any) => updateOperator(v)}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">E</SelectItem>
            <SelectItem value="OR">OU</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="outline"
          onClick={addCondition}
          className="gap-1 h-8"
        >
          <Plus className="h-3 w-3" /> Condição
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={addGroup}
          className="gap-1 h-8"
        >
          <Plus className="h-3 w-3" /> Grupo
        </Button>
        {!isRoot && onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2 pl-4 border-l-2 border-border/50">
        {group.children.length === 0 && (
          <div className="text-xs text-muted-foreground italic py-2">
            Nenhuma condição ou grupo adicionado.
          </div>
        )}
        {group.children.map((child) => (
          <div key={child.id}>
            {child.type === "group" ? (
              <GroupNode
                group={child as FilterGroup}
                onChange={(g) => updateChild(g)}
                fields={fields}
                onDelete={() => removeChild(child.id)}
              />
            ) : (
              <ConditionNode
                condition={child as FilterCondition}
                onChange={(c) => updateChild(c)}
                fields={fields}
                onDelete={() => removeChild(child.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

interface ConditionNodeProps {
  condition: FilterCondition;
  onChange: (condition: FilterCondition) => void;
  onDelete: () => void;
  fields: FilterField[];
}

const ConditionNode = memo(({
  condition,
  onChange,
  onDelete,
  fields,
}: ConditionNodeProps) => {
  const [localValue, setLocalValue] = useState(condition.value);

  useEffect(() => {
    setLocalValue(condition.value);
  }, [condition.value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== condition.value) {
        onChange({ ...condition, value: localValue });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localValue, condition, onChange]);

  const handleChange = (key: keyof FilterCondition, val: any) => {
    if (key === "value") {
      setLocalValue(val);
    } else {
      onChange({ ...condition, [key]: val });
    }
  };

  const selectedField = fields.find((f) => f.name === condition.field);
  const fieldType = selectedField?.type || "text";

  const getOperators = (type: string) => {
    const common = [
      { value: "=", label: "Igual" },
      { value: "<>", label: "Diferente" },
      { value: "IS NULL", label: "É Nulo" },
    ];

    if (type === "number" || type === "date") {
      return [
        ...common,
        { value: ">", label: "Maior que" },
        { value: ">=", label: "Maior ou igual" },
        { value: "<", label: "Menor que" },
        { value: "<=", label: "Menor ou igual" },
      ];
    }

    if (type === "text") {
      return [
        ...common,
        { value: "ILIKE", label: "Contém" },
        { value: "LIKE", label: "Contém (Case Sensitive)" },
      ];
    }

    return common;
  };

  const operators = getOperators(fieldType);

  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-background border border-border/50">
      <div className="w-[220px]">
        {fields.length > 0 ? (
          <Select
            value={condition.field}
            onValueChange={(v) => handleChange("field", v)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Campo" />
            </SelectTrigger>
            <SelectContent>
              {fields.map((f) => {
                const Icon = getIcon(f.type);
                return (
                  <SelectItem key={f.name} value={f.name} className="text-xs">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      {f.label || f.name}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={condition.field}
            onInput={(e) => handleChange("field", e.currentTarget.value)}
            placeholder="Campo"
            className="h-8 text-xs"
          />
        )}
      </div>

      <Select
        value={condition.operator}
        onValueChange={(v: any) => handleChange("operator", v)}
      >
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem
              key={op.value}
              value={op.value}
              className="text-xs"
            >
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {condition.operator !== "IS NULL" && (
        <Input
          value={localValue}
          onInput={(e) => handleChange("value", e.currentTarget.value)}
          placeholder="Valor"
          className="flex-1 h-8 text-xs"
          type={fieldType === "number" ? "number" : "text"}
        />
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});
