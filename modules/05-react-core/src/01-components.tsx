/**
 * WORKED EXAMPLE — a presentational Card: function of props → JSX.
 */
export interface CardProps {
  title: string;
  description?: string;
}
export function Card({ title, description }: CardProps) {
  return (
    <article className="card">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </article>
  );
}

/**
 * YOUR TURN (analog) — a Badge that renders its `label` inside a <span> whose className is
 * `badge badge-<tone>` (tone defaults to "neutral"). Mirror Card's prop-driven structure.
 */
export interface BadgeProps {
  label: string;
  tone?: "neutral" | "success" | "danger";
}
export function Badge(_props: BadgeProps) {
  throw new Error("TODO: render <span className={`badge badge-${tone}`}>{label}</span>");
}
