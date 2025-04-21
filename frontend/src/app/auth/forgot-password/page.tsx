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

// Forgot password form schema using zod
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    await forgotPassword(data.email);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We have sent password reset instructions to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="text-center mb-4">
              If you don't see the email in your inbox, please check your spam folder
            </p>
            <Button 
              variant="outline"
              onClick={() => setIsSubmitted(false)}
              className="w-full max-w-xs mb-2"
            >
              Try another email
            </Button>
            <Button
              variant="link"
              asChild
              className="w-full max-w-xs"
            >
              <Link href="/auth/login">Back to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email and we'll send you password reset instructions
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending instructions..." : "Send instructions"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 w-full">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 