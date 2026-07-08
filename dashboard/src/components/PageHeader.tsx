interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-whatsapp-700">{eyebrow}</p> : null}
        <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">{title}</h2>
      </div>
      {actions}
    </div>
  );
}

