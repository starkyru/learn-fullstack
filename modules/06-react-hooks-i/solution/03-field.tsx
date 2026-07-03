import { useId } from "react";

export interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function Field({ label, value, onChange }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
