"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { Hero } from "@/components/layout/Hero";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { FeatureCardsSkeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <MainLayout>
      <Hero />

      <section className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 md:py-16 lg:py-24">
        {isLoading ? (
          <FeatureCardsSkeleton />
        ) : (
          <div className="mx-auto max-w-5xl py-8 grid gap-8 md:grid-cols-3">
            <Card className="flex flex-col h-full content-visible-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl mb-2">Real-Time Updates</CardTitle>
                <CardDescription>
                  Get real-time compliance information from government sources.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6 flex-grow">
                <p>Our system connects directly to government databases and resources to provide the most current compliance information.</p>
              </CardContent>
              <CardFooter className="pt-4 mt-auto border-t">
                <Button variant="secondary" size="default" className="w-full" asChild>
                  <Link href="/features">Learn More</Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="flex flex-col h-full content-visible-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl mb-2">Document Analysis</CardTitle>
                <CardDescription>
                  Upload and analyze your construction documents for compliance issues.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6 flex-grow">
                <p>Our AI-powered document analysis tools can review your documents and highlight potential compliance concerns.</p>
              </CardContent>
              <CardFooter className="pt-4 mt-auto border-t">
                <Button variant="secondary" size="default" className="w-full" asChild>
                  <Link href="/document-upload">Upload Now</Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="flex flex-col h-full content-visible-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl mb-2">Compliance Reports</CardTitle>
                <CardDescription>
                  Generate detailed compliance reports for your projects.
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6 flex-grow">
                <p>Get comprehensive reports on compliance status, risks, and recommendations for your construction projects.</p>
              </CardContent>
              <CardFooter className="pt-4 mt-auto border-t">
                <Button variant="secondary" size="default" className="w-full" asChild>
                  <Link href="/compliance-reports">View Reports</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
