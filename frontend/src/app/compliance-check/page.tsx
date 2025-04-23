"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ComplianceCheckSkeleton } from "@/components/ui/skeleton";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { toast } from "sonner";
import { useComplianceAnalysis } from "@/hooks/useComplianceAnalysis";

export default function ComplianceCheckPage() {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { 
    uploadDocument, 
    isLoading: isUploading,
    error: uploadError, 
    uploadData, 
    extractedText
  } = useDocumentUpload();
  const { 
    analyzeDocument, 
    isLoading: isAnalyzing,
    error: analysisError, 
    result: analysisResult, 
    reset: resetAnalysis 
  } = useComplianceAnalysis();
  
  useEffect(() => {
    resetAnalysis();
  }, [selectedFile, resetAnalysis]);

  const handleSubmitPrompt = () => {
    setTimeout(() => {
    }, 2000);
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedFile) {
      toast.error("Please select a document to analyze.");
      return;
    }
    // Upload first. The result is the full API response.
    const uploadResult = await uploadDocument(selectedFile);

    // --> ADD LOGGING HERE <--
    console.log('Received upload result in component:', uploadResult);

    // Check the full result structure for success and extracted text
    if (uploadResult?.success && uploadResult.data?.documentId && typeof uploadResult.data.extractedText === 'string') {
      const docId = uploadResult.data.documentId;
      const text = uploadResult.data.extractedText; // Get text directly from result data
      
      console.log("Upload successful, Document ID:", docId);
      console.log("Extracted Text available (length):", text.length); 

      // Now call analyzeDocument with the extracted text from the result
      await analyzeDocument({
        documentId: docId,
        query: "Analyze this document for construction compliance issues.",
        documentText: text, // <-- Pass the text from uploadResult.data
        responseFormat: 'json'
      });
      setSelectedFile(null); // Clear selection after successful analysis start
    } else if (uploadResult?.success) {
        // Handle case where upload succeeded but OCR might have failed or text was empty/not string
        console.warn('Upload succeeded but no valid extracted text was found in the response.');
        toast.error('Document uploaded, but text could not be extracted for analysis.');
        setSelectedFile(null); // Still clear selection
    } 
    // If uploadResult is null or success is false, the hook already showed an error toast
  };
  
  const isLoading = isUploading || isAnalyzing;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-6 md:py-12 px-4 md:px-6 w-full max-w-[var(--container-max-width,1400px)]">
          <ComplianceCheckSkeleton />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6 md:py-12 px-4 md:px-6 w-full max-w-[var(--container-max-width,1400px)]">
        <h1 className="text-2xl md:text-3xl font-bold mb-3 md:mb-6">Compliance Check</h1>
        <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8 max-w-3xl">
          Enter your question about construction compliance regulations or upload a document to analyze for compliance issues.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
          {/* Text Prompt Card */}
          <Card className="flex flex-col">
            <CardHeader className="py-3 md:py-4">
              <CardTitle className="text-lg md:text-xl mb-1 md:mb-2">Text Prompt</CardTitle>
              <CardDescription className="text-sm">
                Ask a question about construction compliance regulations
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4 md:space-y-6 px-4 md:px-6">
              <form className="flex flex-col">
                <div className="space-y-3 md:space-y-4">
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="prompt" className="text-sm font-medium">
                      Your Question
                    </Label>
                    <Textarea
                      id="prompt"
                      placeholder="Example: What are the current regulations for residential bathroom ventilation in California?"
                      className="min-h-[100px] w-full text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="location" className="text-sm font-medium">
                      Location (optional)
                    </Label>
                    <Input
                      id="location"
                      placeholder="Example: California"
                      className="w-full text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="project-type" className="text-sm font-medium">
                      Project Type (optional)
                    </Label>
                    <Input
                      id="project-type"
                      placeholder="Example: Residential Remodel"
                      className="w-full text-sm md:text-base"
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="pt-3 md:pt-4 border-t px-4 md:px-6 mt-auto">
              <Button 
                variant="default" 
                size="default" 
                className="w-full text-sm md:text-base"
                onClick={handleSubmitPrompt}
              >
                Check Compliance
              </Button>
            </CardFooter>
          </Card>

          {/* Document Upload Card */}
          <Card className="flex flex-col">
            <CardHeader className="py-3 md:py-4">
              <CardTitle className="text-lg md:text-xl mb-1 md:mb-2">Document Upload</CardTitle>
              <CardDescription className="text-sm">
                Upload a document to check for compliance issues
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow py-4 md:py-6 px-4 md:px-6">
              <div 
                className={cn(
                  "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 md:p-8 text-center transition-colors min-h-[200px]",
                  isDragActive ? "border-primary bg-primary/5" : "border-gray-300",
                  selectedFile ? "border-green-500 bg-green-50" : ""
                )}
                onDragEnter={() => setIsDragActive(true)}
                onDragLeave={() => setIsDragActive(false)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragActive(true);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    setSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mb-2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <p className="text-sm font-medium mb-1">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-4 text-red-500 hover:text-red-700 hover:bg-red-50 text-xs md:text-sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-xs md:text-sm text-gray-500 mb-4">
                      {isDragActive ? "Drop your file here" : "Drag and drop your file here, or click to browse"}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mb-2 text-xs md:text-sm px-2 py-1 md:px-4 md:py-2"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.pdf,.docx,.txt';
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement;
                          if (target.files && target.files[0]) {
                            setSelectedFile(target.files[0]);
                          }
                        };
                        input.click();
                      }}
                    >
                      Browse Files
                    </Button>
                    <p className="text-xs text-gray-400 mt-4">
                      Supported formats: PDF, DOCX, TXT (Max 10MB)
                    </p>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-3 md:pt-4 border-t px-4 md:px-6 mt-auto">
              <Button 
                variant="default" 
                size="default" 
                className="w-full text-sm md:text-base"
                disabled={!selectedFile || isLoading}
                onClick={handleAnalyzeDocument}
              >
                {isUploading ? "Uploading..." : isAnalyzing ? "Analyzing..." : (selectedFile ? "Analyze Document" : "Upload and Analyze")}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Results Section */}
        <div className="mt-8 md:mt-12 w-full">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Results</h2>
          <Card className="flex flex-col">
            <CardHeader className="py-3 md:py-4">
              <CardTitle className="text-lg md:text-xl mb-1 md:mb-2">Compliance Analysis</CardTitle>
              <CardDescription className="text-sm">
                Results will appear here after submission
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4 md:py-6 px-4 md:px-6">
              <div 
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-8 text-center min-h-[200px]"
              >
                {uploadError && (
                  <p className="text-xs md:text-sm text-red-500 mb-4">
                    Upload Error: {uploadError}
                  </p>
                )}
                {analysisError && (
                  <p className="text-xs md:text-sm text-red-500 mb-4">
                    Analysis Error: {analysisError}
                  </p>
                )}
                
                {!isLoading && !analysisResult && !uploadError && !analysisError && (
                  <p className="text-xs md:text-sm text-gray-500">
                    Submit a question or upload a document to see compliance analysis results here.
                  </p>
                )}

                {analysisResult && (
                  <div className="text-left w-full">
                    <h3 className="font-bold mb-2">Analysis Results ({analysisResult.format}):</h3>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {typeof analysisResult.data === 'string' ? analysisResult.data : JSON.stringify(analysisResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 