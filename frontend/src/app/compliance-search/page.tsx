import { Metadata } from "next"
import { OptimizedSearch } from "../../components/ui/optimized-search"

export const metadata: Metadata = {
  title: "Compliance Search | Construction Compliance System",
  description: "Search for construction compliance information with AI-optimized queries",
}

export default function ComplianceSearchPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Compliance Search</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Get accurate compliance information with AI-optimized search queries tailored for the construction industry.
        </p>
      </div>
      
      <OptimizedSearch />
      
      <div className="mt-10 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">How Optimized Search Works</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              1
            </div>
            <h3 className="font-medium">Entity Extraction</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The system identifies regulations, organizations, locations, and dates from your prompt.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              2
            </div>
            <h3 className="font-medium">Query Optimization</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your search is enhanced with industry-specific terms and contextual information.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              3
            </div>
            <h3 className="font-medium">Source Prioritization</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Results from government sources are prioritized over other information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 