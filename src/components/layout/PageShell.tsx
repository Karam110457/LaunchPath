import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageShell({ 
  children, 
  title, 
  description, 
  action,
  className 
}: PageShellProps) {
  return (
    <div className={cn("container py-8 md:py-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl md:text-4xl font-light italic tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
