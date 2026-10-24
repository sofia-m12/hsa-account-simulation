import type { ReactNode } from "react";

type PanelProps = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({ title, action, children, className = "" }: PanelProps) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(title || action) && (
        <header className="panel__header">
          {title ? <h2 className="panel__title">{title}</h2> : <span />}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
