export function Footer() {
  return (
    <footer className="py-8 border-t border-white/5 text-center text-sm text-muted-foreground">
      <div className="container mx-auto">
        <p>© {new Date().getFullYear()} LaunchPath. All rights reserved.</p>
      </div>
    </footer>
  );
}
