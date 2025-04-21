"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-provider";

// Login form schema using zod
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    await login(data.email, data.password);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 w-full">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 