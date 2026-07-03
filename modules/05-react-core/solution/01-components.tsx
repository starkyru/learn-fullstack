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

export interface BadgeProps {
  label: string;
  tone?: "neutral" | "success" | "danger";
}
export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{label}</span>;
}
