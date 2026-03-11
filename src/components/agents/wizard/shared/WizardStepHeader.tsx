"use client";

interface WizardStepHeaderProps {
  title: string;
  description: string;
}

/** Consistent header for every wizard step — matches agents page typography. */
export function WizardStepHeader({ title, description }: WizardStepHeaderProps) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        {title}
      </h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
