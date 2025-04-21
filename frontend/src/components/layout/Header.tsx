"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/lib/auth/auth-provider";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{ contain: 'layout', height: '56px', minHeight: '56px' }}
    >
      <div 
        className="container flex h-14 md:h-16 items-center justify-between px-4 md:px-6"
        style={{ contain: 'layout' }}
      >
        <div className="flex items-center">
          <Link className="flex items-center" href="/">
            <span 
              className="font-bold text-sm md:text-base truncate max-w-[200px] md:max-w-none"
              style={{ height: '20px', display: 'flex', alignItems: 'center' }}
            >
              Compliance Management System
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 md:p-2">
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isAuthenticated ? (
                <>
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/dashboard" className="w-full">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/compliance-search" className="w-full">Compliance Search</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/compliance-check" className="w-full">Compliance Check</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/document-upload" className="w-full">Document Upload</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/compliance-reports" className="w-full">Reports</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600"
                    onClick={() => logout()}
                  >
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/auth/login" className="w-full">Login</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/auth/register" className="w-full">Register</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/compliance-search" className="w-full">Try Compliance Search</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/compliance-check" className="w-full">Try Compliance Check</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {isAuthenticated ? (
            <Button variant="ghost" size="sm" className="p-1 md:p-2 flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                {user?.name?.charAt(0) || "U"}
              </div>
              <span className="hidden md:inline">{user?.name?.split(" ")[0]}</span>
            </Button>
          ) : (
            <Button variant="default" size="sm" className="p-1 md:p-2" asChild>
              <Link href="/auth/login" className="w-full h-full flex items-center justify-center">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
} 