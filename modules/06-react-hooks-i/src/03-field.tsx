/**
 * YOUR TURN — a labelled field. Generate an id with `useId`, put it on the <input>, and set
 * the <label>'s htmlFor to the same id so clicking the label focuses the input.
 * Props: { label: string, value: string, onChange: (v: string) => void }.
 */
export interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}
export function Field(_props: FieldProps) {
  throw new Error("TODO: render <label htmlFor={id}> + <input id={id}> using useId");
}
