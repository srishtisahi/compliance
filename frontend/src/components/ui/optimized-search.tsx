"use client"

import { useState } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card"
import { Label } from "./label"
import { Badge } from "./badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { toast } from "sonner"

interface SearchResult {
  query: string
  sources: {
    title: string
    url: string
    snippet: string
    isGovernment: boolean
    source: string
  }[]
  summary: string
  optimizationMetadata?: {
    originalPrompt: string
    optimizedQuery: string
    alternativeQueries: string[]
    extractedEntities: {
      regulations?: string[]
      locations?: string[]
      organizations?: string[]
      dates?: string[]
      other?: string[]
    }
  }
}

export function OptimizedSearch() {
  const [userPrompt, setUserPrompt] = useState("")
  const [industry, setIndustry] = useState("construction")
  const [location, setLocation] = useState("")
  const [documentContext, setDocumentContext] = useState("")
  const [complianceDomains, setComplianceDomains] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult | null>(null)

  const handleSearch = async () => {
    if (!userPrompt) {
      toast.error("Please enter a search prompt")
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch("/api/perplexity/optimized-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userPrompt,
          industry,
          location: location || undefined,
          documentContext: documentContext || undefined,
          complianceDomains: complianceDomains.length > 0 ? complianceDomains : undefined,
          prioritizeRecent: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
      toast.success("Search completed successfully")
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Failed to complete search")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDomainChange = (domain: string) => {
    setComplianceDomains((prev) => 
      prev.includes(domain) 
        ? prev.filter((d) => d !== domain) 
        : [...prev, domain]
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Optimized Compliance Search</CardTitle>
          <CardDescription>
            Get compliance information using AI-optimized search queries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userPrompt">What compliance information are you looking for?</Label>
            <Textarea
              id="userPrompt"
              placeholder="E.g., What are the recent safety requirements for scaffolding in construction sites?"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              className="h-24"
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="E.g., California, New York, Texas"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Compliance Domains (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {["Safety", "Environmental", "Labor", "Building Codes", "Permits", "Licensing"].map((domain) => (
                <Badge
                  key={domain}
                  variant={complianceDomains.includes(domain) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleDomainChange(domain)}
                >
                  {domain}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="documentContext">Document Context (optional)</Label>
            <Textarea
              id="documentContext"
              placeholder="Paste relevant text from your documents here"
              value={documentContext}
              onChange={(e) => setDocumentContext(e.target.value)}
              className="h-20"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSearch} disabled={isLoading} className="w-full">
            {isLoading ? "Searching..." : "Search for Compliance Information"}
          </Button>
        </CardFooter>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            {results.optimizationMetadata && (
              <CardDescription>
                Optimized query: <span className="font-medium">{results.optimizationMetadata.optimizedQuery}</span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Summary</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">{results.summary}</p>
            </div>
            
            {/* Extracted Entities */}
            {results.optimizationMetadata?.extractedEntities && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Extracted Information</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {results.optimizationMetadata.extractedEntities.regulations?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Regulations</h4>
                      <ul className="mt-1 space-y-1">
                        {results.optimizationMetadata.extractedEntities.regulations.map((reg, i) => (
                          <li key={i} className="text-sm">{reg}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {results.optimizationMetadata.extractedEntities.organizations?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Organizations</h4>
                      <ul className="mt-1 space-y-1">
                        {results.optimizationMetadata.extractedEntities.organizations.map((org, i) => (
                          <li key={i} className="text-sm">{org}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {results.optimizationMetadata.extractedEntities.locations?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Locations</h4>
                      <ul className="mt-1 space-y-1">
                        {results.optimizationMetadata.extractedEntities.locations.map((loc, i) => (
                          <li key={i} className="text-sm">{loc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {results.optimizationMetadata.extractedEntities.dates?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dates</h4>
                      <ul className="mt-1 space-y-1">
                        {results.optimizationMetadata.extractedEntities.dates.map((date, i) => (
                          <li key={i} className="text-sm">{date}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Alternative Queries */}
            {results.optimizationMetadata?.alternativeQueries?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Alternative Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {results.optimizationMetadata.alternativeQueries.map((query, i) => (
                    <Badge key={i} variant="secondary">{query}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Sources */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Sources</h3>
              <div className="space-y-4">
                {results.sources.map((source, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{source.title}</h4>
                      {source.isGovernment && (
                        <Badge variant="success" className="bg-green-500">Government Source</Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{source.snippet}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{source.source}</span>
                      <Button variant="link" size="sm" asChild className="p-0">
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          View Source
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 