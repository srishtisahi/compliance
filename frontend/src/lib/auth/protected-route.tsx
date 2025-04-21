"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after we've checked authentication status
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show nothing while checking authentication or redirecting
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  // If authenticated, show the protected content
  return <>{children}</>;
} 