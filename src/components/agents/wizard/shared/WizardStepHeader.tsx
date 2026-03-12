"use client";

interface WizardStepHeaderProps {
  title: string;
  description: string;
}

/** Consistent header for every wizard step — matches agents page typography. */
export function WizardStepHeader({ title, description }: WizardStepHeaderProps) {
  return (
    <div className="stagger-enter space-y-3">
      <h2
        className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
        style={{ "--stagger": 0 } as React.CSSProperties}
      >
        {title}
      </h2>
      <p
        className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed"
        style={{ "--stagger": 1 } as React.CSSProperties}
      >
        {description}
      </p>
    </div>
  );
}
