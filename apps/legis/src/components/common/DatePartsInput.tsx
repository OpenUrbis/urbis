import React, { useState, useEffect } from "react";
import { Button, Input } from "@open-urbis/map-ui";
import { isAfter, isValid, parse, startOfDay } from "date-fns";
import {
  CONDITIONAL_VALIDITY,
  isConditionalValidity,
} from "../../domain/validity";

interface DatePartsInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  maxYear?: number;
  allowFuture?: boolean;
  /** Adds an explicit control for the non-date validity state. */
  allowConditional?: boolean;
  className?: string;
}

function normalizeStoredDateToDisplay(storedValue?: string) {
  if (!storedValue || isConditionalValidity(storedValue)) return "";

  const parts = storedValue.split(".");
  if (parts.length !== 3) return storedValue;

  return `${parts[0]}/${parts[1]}/${parts[2]}`;
}

export function DatePartsInput({
  value,
  onChange,
  disabled,
  maxYear,
  allowFuture,
  allowConditional = false,
  className,
}: DatePartsInputProps) {
  const isConditional = isConditionalValidity(value);
  const [displayValue, setDisplayValue] = useState(() =>
    normalizeStoredDateToDisplay(value),
  );

  const formatDigitsAsDate = (digits: string) => {
    const trimmedDigits = digits.slice(0, 8);

    if (trimmedDigits.length <= 2) return trimmedDigits;
    if (trimmedDigits.length <= 4) {
      return `${trimmedDigits.slice(0, 2)}/${trimmedDigits.slice(2)}`;
    }

    return `${trimmedDigits.slice(0, 2)}/${trimmedDigits.slice(2, 4)}/${trimmedDigits.slice(4)}`;
  };

  const emitParsedValue = (maskedValue: string) => {
    const digits = maskedValue.replace(/\D/g, "");

    if (!digits) {
      onChange(undefined);
      return;
    }

    if (digits.length !== 8) return;

    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);
    const dateStr = `${day}.${month}.${year}`;
    const parsedDate = parse(dateStr, "dd.MM.yyyy", new Date());

    if (!isValid(parsedDate)) return;

    const yearNum = Number.parseInt(year, 10);
    if (maxYear && yearNum > maxYear) return;

    if (
      allowFuture === false &&
      isAfter(startOfDay(parsedDate), startOfDay(new Date()))
    ) {
      return;
    }

    onChange(dateStr);
  };

  useEffect(() => {
    setDisplayValue(normalizeStoredDateToDisplay(value));
  }, [value]);

  const handleChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, "").slice(0, 8);
    const maskedValue = formatDigitsAsDate(digits);

    setDisplayValue(maskedValue);
    emitParsedValue(maskedValue);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Input
          placeholder="dd/mm/aaaa"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          inputMode="numeric"
          maxLength={10}
          disabled={disabled || isConditional}
          className={className}
        />
        {allowConditional && (
          <Button
            type="button"
            variant={isConditional ? "outline" : "ghost"}
            size="sm"
            className="h-8 shrink-0 px-1.5 text-[10px]"
            onClick={() =>
              onChange(isConditional ? undefined : CONDITIONAL_VALIDITY)
            }
            disabled={disabled}
            title={
              isConditional
                ? "Trocar a vigência condicionada por uma data"
                : "Marcar como vigência condicionada"
            }
          >
            {isConditional ? "Informar data" : "Condicionada"}
          </Button>
        )}
      </div>
      {allowConditional && isConditional && (
        <span className="text-[10px] text-muted-foreground">
          Vigência condicionada
        </span>
      )}
    </div>
  );
}
