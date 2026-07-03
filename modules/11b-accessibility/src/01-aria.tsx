/**
 * WORKED EXAMPLE — an icon-only button MUST carry an accessible name via aria-label,
 * because its visible content (an icon) isn't readable text.
 */
export interface IconButtonProps {
  label: string;
  icon: string;
  onClick?: () => void;
}
export function IconButton({ label, icon, onClick }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} onClick={onClick}>
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}

/**
 * YOUR TURN (analog) — a toggle button. Render a real <button> whose `aria-pressed` reflects
 * `pressed` and that calls `onToggle` on click. The visible child is `label`.
 * Props: { label: string, pressed: boolean, onToggle: () => void }.
 */
export interface ToggleButtonProps {
  label: string;
  pressed: boolean;
  onToggle: () => void;
}
export function ToggleButton(_props: ToggleButtonProps) {
  throw new Error(
    "TODO: <button aria-pressed={pressed} onClick={onToggle}>{label}</button>",
  );
}
