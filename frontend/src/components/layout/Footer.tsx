export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} Compliance Management System. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </a>
          <a href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </a>
          <a href="/contact" className="underline underline-offset-4 hover:text-foreground">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
} 