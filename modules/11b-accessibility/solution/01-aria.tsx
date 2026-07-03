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

export interface ToggleButtonProps {
  label: string;
  pressed: boolean;
  onToggle: () => void;
}
export function ToggleButton({ label, pressed, onToggle }: ToggleButtonProps) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onToggle}>
      {label}
    </button>
  );
}
