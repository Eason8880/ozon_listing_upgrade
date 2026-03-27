import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'low' | 'high';
  className?: string;
}

export function SectionCard(props: SectionCardProps) {
  const tone = props.tone ?? 'default';
  const className = ['section-card', `section-card--${tone}`, props.className]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={className}>
      <div className="section-card__header">
        <div>
          <h2>{props.title}</h2>
          {props.description ? <p>{props.description}</p> : null}
        </div>
        {props.actions ? <div className="section-card__actions">{props.actions}</div> : null}
      </div>
      {props.children}
    </section>
  );
}
