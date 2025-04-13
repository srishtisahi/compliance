import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <MainLayout>
      <section className="py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Real-Time Compliance Management for Construction Industry
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Stay updated with the latest compliance requirements and regulations in the construction industry.
              </p>
            </div>
            <div className="space-x-4">
              <Button asChild>
                <Link href="/compliance-check">
                  Check Compliance
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/document-upload">
                  Upload Documents
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-24 lg:py-32">
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Updates</CardTitle>
              <CardDescription>
                Get real-time compliance information from government sources.
              </CardDescription>
            </CardHeader>
            <CardContent>
              Our system connects directly to government databases and resources to provide the most current compliance information.
            </CardContent>
            <CardFooter>
              <Button variant="ghost" asChild>
                <Link href="/features">Learn More</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Document Analysis</CardTitle>
              <CardDescription>
                Upload and analyze your construction documents for compliance issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              Our AI-powered document analysis tools can review your documents and highlight potential compliance concerns.
            </CardContent>
            <CardFooter>
              <Button variant="ghost" asChild>
                <Link href="/document-upload">Upload Now</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>
                Generate detailed compliance reports for your projects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              Get comprehensive reports on compliance status, risks, and recommendations for your construction projects.
            </CardContent>
            <CardFooter>
              <Button variant="ghost" asChild>
                <Link href="/compliance-reports">View Reports</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
