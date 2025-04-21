"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { DocumentUploadSkeleton } from "@/components/ui/skeleton";

export default function DocumentUploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleUploadAndAnalyze = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div 
          className="container py-10" 
          style={{ 
            contain: 'layout paint', 
            width: '100%', 
            maxWidth: 'var(--container-max-width, 1400px)',
            height: '100vh'
          }}
        >
          <DocumentUploadSkeleton />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div 
        className="container py-10" 
        style={{ 
          contain: 'layout paint', 
          width: '100%', 
          maxWidth: 'var(--container-max-width, 1400px)',
          height: '100vh'
        }}
      >
        <h1 className="text-3xl font-bold mb-6">Document Upload</h1>
        <p className="text-gray-500 mb-8 max-w-3xl">
          Upload construction documents to analyze for compliance with relevant regulations.
          Our system will process your documents and provide detailed compliance analysis.
        </p>

        <div 
          className="grid gap-6 md:grid-cols-3" 
          style={{ 
            contain: 'layout', 
            width: '100%',
            height: '600px'
          }}
        >
          <div className="md:col-span-2">
            <Card 
              className="flex flex-col h-full content-visible-card-lg"
              style={{ contain: 'layout', height: '600px' }}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-xl mb-2">Upload Documents</CardTitle>
                <CardDescription>
                  Upload construction documents for compliance analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow pb-6 space-y-6">
                <div 
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center" 
                  style={{ height: '200px', width: '100%', contain: 'strict' }}
                >
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop your files here, or click to browse
                  </p>
                  <Button variant="outline" size="default" className="mb-2">
                    Browse Files
                  </Button>
                  <p className="text-xs text-gray-400 mt-4">
                    Supported formats: PDF, DOCX, JPG, PNG (Max 50MB total)
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="project-name" className="text-sm font-medium">
                        Project Name
                      </label>
                      <Input
                        id="project-name"
                        placeholder="Enter project name"
                        style={{ height: '40px' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="project-type" className="text-sm font-medium">
                        Project Type
                      </label>
                      <Select>
                        <SelectTrigger id="project-type" className="h-10">
                          <SelectValue placeholder="Select project type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential">Residential Construction</SelectItem>
                          <SelectItem value="commercial">Commercial Construction</SelectItem>
                          <SelectItem value="industrial">Industrial Construction</SelectItem>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="location" className="text-sm font-medium">
                        Location
                      </label>
                      <Input
                        id="location"
                        placeholder="City, State"
                        style={{ height: '40px' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="document-type" className="text-sm font-medium">
                        Document Type
                      </label>
                      <Select>
                        <SelectTrigger id="document-type" className="h-10">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blueprints">Blueprints</SelectItem>
                          <SelectItem value="permits">Permits</SelectItem>
                          <SelectItem value="specifications">Specifications</SelectItem>
                          <SelectItem value="contracts">Contracts</SelectItem>
                          <SelectItem value="regulations">Regulations</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="additional-notes" className="text-sm font-medium">
                      Additional Notes (optional)
                    </label>
                    <Textarea
                      id="additional-notes"
                      placeholder="Add any additional context or specific compliance concerns"
                      className="h-[100px]"
                    />
                  </div>
                </div>

                <Button 
                  variant="default" 
                  size="default" 
                  className="w-full mt-6"
                  onClick={handleUploadAndAnalyze}
                >
                  Upload and Analyze
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card 
              className="flex flex-col h-full content-visible-card"
              style={{ contain: 'layout', height: '400px' }}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-xl mb-2">Upload Tips</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow pb-6 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">For Best Results:</h3>
                  <ul className="list-disc list-inside text-sm text-gray-500 space-y-2">
                    <li>Upload clear, high-resolution documents</li>
                    <li>Include project location for region-specific compliance</li>
                    <li>Upload original files rather than scans when possible</li>
                    <li>Group related documents in a single upload</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Processing Time:</h3>
                  <p className="text-sm text-gray-500">
                    Most documents are processed within 1-2 minutes, but complex or large documents may take longer.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Privacy:</h3>
                  <p className="text-sm text-gray-500">
                    All documents are processed securely. We do not share your documents with third parties.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 