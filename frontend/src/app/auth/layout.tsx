import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication - Legal Compliance System",
  description: "Login or register to access the legal compliance system.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex justify-center md:justify-start">
          <Link href="/" className="text-xl font-semibold text-slate-900 dark:text-white">
            Legal Compliance
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        {children}
      </main>
      <footer className="py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 text-center text-sm text-slate-600 dark:text-slate-400">
          &copy; {new Date().getFullYear()} Legal Compliance System. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 