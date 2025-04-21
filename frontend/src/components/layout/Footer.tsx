export function Footer() {
  return (
    <footer className="border-t w-full py-6 md:py-8" style={{ contain: 'layout' }}>
      <div className="container mx-auto px-4 md:px-6" style={{ contain: 'layout' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left order-2 md:order-1">
            © {new Date().getFullYear()} Compliance Management System. All rights reserved.
          </p>
          
          <nav className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 order-1 md:order-2">
            <a href="/privacy" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors">
              Terms of Service
            </a>
            <a href="/contact" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors">
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
} 