import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/lib/auth/auth-provider";

// Configure fonts with display swap for better loading performance
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "optional",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "optional",
  preload: true,
  fallback: ["monospace"],
});

// Separate viewport metadata as per Next.js 15 guidelines
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// Theme script to prevent flash of incorrect theme
function ThemeScript() {
  const themeScript = `
    (function() {
      // Check for saved theme preference or use OS preference
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Apply theme immediately to prevent flash
      document.documentElement.classList.toggle('dark', 
        storedTheme === 'dark' || (!storedTheme && prefersDark));
        
      // Add event listener for OS theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
          document.documentElement.classList.toggle('dark', e.matches);
        }
      });
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />;
}

export const metadata: Metadata = {
  title: "Compliance Management System",
  description: "Real-time compliance information for the construction industry",
  // Disable format detection for better performance
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head suppressHydrationWarning>
        {/* Theme script to prevent flash during page load - must come before any rendering */}
        <ThemeScript />
        {/* Preload critical assets */}
        <link 
          rel="preconnect" 
          href="https://fonts.googleapis.com" 
          crossOrigin="anonymous" 
        />
        <link 
          rel="preload"
          href="/fonts/geist-sans.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Suspense fallback={null}>
              <Toaster />
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
