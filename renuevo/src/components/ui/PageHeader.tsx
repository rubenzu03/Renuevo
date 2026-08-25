import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtext,
  actions,
}: {
  title: string;
  subtext?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-normal tracking-[-0.012em] text-paper">
          {title}
        </h1>
        {subtext ? (
          <p className="mt-1 text-sm text-fog">{subtext}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-(--radius-card) border border-dashed border-graphite px-6 py-12 text-center">
      <p className="text-[15px] text-mist">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-fog">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
