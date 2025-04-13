import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function ComplianceCheckPage() {
  return (
    <MainLayout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Compliance Check</h1>
        <p className="text-gray-500 mb-8 max-w-3xl">
          Enter your question about construction compliance regulations or upload a document to analyze for compliance issues.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Text Prompt</CardTitle>
              <CardDescription>
                Ask a question about construction compliance regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="prompt" className="text-sm font-medium">
                    Your Question
                  </label>
                  <Textarea
                    id="prompt"
                    placeholder="Example: What are the current regulations for residential bathroom ventilation in California?"
                    className="min-h-[150px]"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location (optional)
                  </label>
                  <Input
                    id="location"
                    placeholder="Example: California"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="project-type" className="text-sm font-medium">
                    Project Type (optional)
                  </label>
                  <Input
                    id="project-type"
                    placeholder="Example: Residential Remodel"
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Check Compliance
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>
                Upload a document to check for compliance issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                <Button variant="outline">
                  Browse Files
                </Button>
                <p className="text-xs text-gray-400 mt-4">
                  Supported formats: PDF, DOCX, TXT (Max 10MB)
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Upload and Analyze
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Results</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center">
                Submit a question or upload a document to see compliance analysis results here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 