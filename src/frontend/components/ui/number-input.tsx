"use client";

import {
  useEffect,
  useState,
  type FocusEventHandler,
  type InputHTMLAttributes
} from "react";

type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type" | "value"
> & {
  allowEmpty?: boolean;
  onValueChange: (value: number | undefined) => void;
  value: number | null | undefined;
};

export function NumberInput({
  allowEmpty = false,
  onBlur,
  onValueChange,
  value,
  ...inputProps
}: NumberInputProps) {
  const valueText = value === null || value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(valueText);

  useEffect(() => {
    setDraft(valueText);
  }, [valueText]);

  const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    if (!allowEmpty && draft === "") {
      setDraft(valueText);
    }
    onBlur?.(event);
  };

  return (
    <input
      {...inputProps}
      type="number"
      value={draft}
      onBlur={handleBlur}
      onChange={(event) => {
        const nextDraft = event.target.value;
        setDraft(nextDraft);

        if (nextDraft === "") {
          if (allowEmpty) onValueChange(undefined);
          return;
        }

        const nextValue = event.target.valueAsNumber;
        if (Number.isFinite(nextValue)) onValueChange(nextValue);
      }}
    />
  );
}
