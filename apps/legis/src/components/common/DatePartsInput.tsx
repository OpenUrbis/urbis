import React, { useState, useEffect } from "react";
import { Input } from "@open-urbis/map-ui";
import { isAfter, isValid, parse, startOfDay } from "date-fns";

interface DatePartsInputProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  maxYear?: number;
  allowFuture?: boolean;
  className?: string;
}

function normalizeStoredDateToDisplay(storedValue?: string) {
  if (!storedValue || storedValue === "vigência condicionada") return "";

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
  className,
}: DatePartsInputProps) {
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
    <Input
      placeholder="dd/mm/aaaa"
      value={displayValue}
      onChange={(e) => handleChange(e.target.value)}
      inputMode="numeric"
      maxLength={10}
      disabled={disabled}
      className={className}
    />
  );
}
