export function DemoFooter() {
  return (
    <footer className="text-center px-4 pb-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <p className="text-xs text-muted-foreground/50">
        Powered by{" "}
        <a
          href="/"
          className="text-primary/50 hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-sm"
        >
          LaunchPath
        </a>
      </p>
    </footer>
  );
}
