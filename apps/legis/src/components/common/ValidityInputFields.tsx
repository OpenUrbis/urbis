import React from "react";
import { Label } from "@open-urbis/map-ui";
import type { Validity } from "../../domain/types";
import { DatePartsInput } from "./DatePartsInput";
import { NormativeLinkInput } from "./NormativeLinkInput";
import { updateValidityNormativeElement } from "../../domain/validity";

interface ValidityInputFieldsProps {
  value: Validity;
  onChange: (value: Validity) => void;
  onOpenLinkManager: () => void;
  linkLabel?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function ValidityInputFields({
  value,
  onChange,
  onOpenLinkManager,
  linkLabel,
  disabled: _disabled,
  compact = false,
}: ValidityInputFieldsProps) {
  const labelClassName = compact
    ? "text-[10px] text-muted-foreground"
    : "text-xs";
  const gridClassName = compact
    ? "grid grid-cols-1 gap-3 md:grid-cols-2"
    : "grid grid-cols-2 gap-3";

  const isLinked = Boolean(value.normativeElementId?.trim());

  return (
    <div className={gridClassName}>
      <div className="space-y-2">
        <Label className={labelClassName}>
          Data{" "}
          {isLinked && (
            <span className="font-normal text-muted-foreground">
              (do elemento vinculado)
            </span>
          )}
        </Label>
        <DatePartsInput
          value={value.date}
          onChange={(date) => onChange({ ...value, date: date || "" })}
          disabled={isLinked || _disabled}
          className={compact ? "h-8 text-xs" : undefined}
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label className={labelClassName}>Elemento vinculado</Label>
        <NormativeLinkInput
          value={value.normativeElementId || ""}
          onChange={(normativeElementId) =>
            onChange(updateValidityNormativeElement(value, normativeElementId))
          }
          onOpen={onOpenLinkManager}
          label={linkLabel}
        />
      </div>
    </div>
  );
}
