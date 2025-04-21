import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-800", className)}
      {...props}
    />
  );
}

// Card skeleton with header, content and footer
export function CardSkeleton({
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div 
      className={cn("flex flex-col border rounded-lg shadow-sm", className)}
      {...props}
    >
      {/* Card Header */}
      <div className="p-4 md:p-6 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Card Content */}
      <div className="p-4 md:p-6 space-y-4 flex-grow">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      
      {/* Card Footer */}
      <div className="p-4 md:p-6 border-t mt-auto">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

// Form input field skeleton
export function InputSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

// Textarea skeleton
export function TextareaSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-24 w-full rounded-md" />
    </div>
  );
}

// Document upload area skeleton
export function UploadAreaSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 min-h-[200px] w-full">
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-10 w-1/4 mb-4 rounded-md" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

// Results area skeleton
export function ResultsSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <Skeleton className="h-6 w-1/4 mb-2" />
      <div className="border rounded-lg p-6 space-y-4 min-h-[200px]">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <div className="space-y-2 mt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-2 mt-6">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

// Section skeleton for home page feature cards
export function FeatureCardsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-3 w-full py-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col border rounded-lg shadow-sm">
          <div className="p-6 pb-4 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="p-6 pt-0 pb-6 flex-grow space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="p-6 pt-4 border-t mt-auto">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Compliance check page skeleton with dual cards layout
export function ComplianceCheckSkeleton() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 w-full">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      
      <ResultsSkeleton />
    </div>
  );
}

// Document upload page skeleton with 2-column layout
export function DocumentUploadSkeleton() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2">
          <CardSkeleton />
        </div>
        <div>
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

// Report card skeleton for compliance reports page
export function ReportCardSkeleton({
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div 
      className={cn("flex flex-col border rounded-lg shadow-sm min-h-[200px]", className)}
      {...props}
    >
      {/* Card Header */}
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4 space-y-3 flex-grow">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Card Footer */}
      <div className="p-4 border-t mt-auto flex justify-between">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}

// Compliance reports page skeleton
export function ComplianceReportsSkeleton() {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Skeleton className="h-10 w-40 rounded-md" />
        <Skeleton className="h-10 w-40 rounded-md" />
        <Skeleton className="h-10 w-40 rounded-md" />
        <div className="ml-auto">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
      
      {/* Report Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-h-[400px]">
        {[...Array(6)].map((_, i) => (
          <ReportCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-8">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>
    </div>
  );
}

// Stat card skeleton for dashboard
export function StatCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-2" style={{ contain: 'layout' }}>
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

// Chart placeholder skeleton
export function ChartSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-2" style={{ contain: 'layout', minHeight: '300px' }}>
      <Skeleton className="h-5 w-1/3 mb-6" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-40 w-6" />
          <Skeleton className="h-24 w-6" />
          <Skeleton className="h-32 w-6" />
          <Skeleton className="h-16 w-6" />
          <Skeleton className="h-36 w-6" />
          <Skeleton className="h-28 w-6" />
          <Skeleton className="h-20 w-6" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
    </div>
  );
}

// Recent activity skeleton
export function ActivitySkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4" style={{ contain: 'layout', minHeight: '300px' }}>
      <Skeleton className="h-5 w-1/3" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Dashboard page skeleton
export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-8" style={{ contain: 'layout' }}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Stats Row */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ contain: 'layout', minHeight: '100px' }}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      
      {/* Charts Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2" style={{ contain: 'layout', minHeight: '300px' }}>
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      
      {/* Activity and Tasks Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2" style={{ contain: 'layout', minHeight: '300px' }}>
        <ActivitySkeleton />
        <div className="border rounded-lg p-6 space-y-4" style={{ contain: 'layout' }}>
          <Skeleton className="h-5 w-1/3" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 