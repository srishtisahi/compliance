"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-provider";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuth();
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <MainLayout>
      <div 
        className="container py-8 md:py-12 px-4 md:px-6" 
        style={{ 
          contain: 'layout paint', 
          width: '100%', 
          maxWidth: 'var(--container-max-width, 1400px)',
          minHeight: '100vh'
        }}
      >
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-gray-500 max-w-3xl">
                  Overview of your compliance status and recent activity.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => logout()}
                >
                  Logout
                </Button>
              </div>
            </div>
            
            {/* Stats Row */}
            <div 
              className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" 
              style={{ contain: 'layout', minHeight: '100px' }}
            >
              <Card style={{ contain: 'layout' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last month
                  </p>
                </CardContent>
              </Card>
              <Card style={{ contain: 'layout' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Compliant Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-muted-foreground">
                    75% compliance rate
                  </p>
                </CardContent>
              </Card>
              <Card style={{ contain: 'layout' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground">
                    3 due this week
                  </p>
                </CardContent>
              </Card>
              <Card style={{ contain: 'layout' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Compliance Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">
                    -1 from last month
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts Row */}
            <div 
              className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-8" 
              style={{ contain: 'layout', minHeight: '300px' }}
            >
              <Card style={{ contain: 'layout', minHeight: '300px' }}>
                <CardHeader>
                  <CardTitle>Compliance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="flex items-center justify-center h-[250px] border border-dashed rounded-md" 
                    style={{ contain: 'layout' }}
                  >
                    <p className="text-muted-foreground">Compliance trend chart will load here</p>
                  </div>
                </CardContent>
              </Card>
              <Card style={{ contain: 'layout', minHeight: '300px' }}>
                <CardHeader>
                  <CardTitle>Project Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="flex items-center justify-center h-[250px] border border-dashed rounded-md" 
                    style={{ contain: 'layout' }}
                  >
                    <p className="text-muted-foreground">Project type distribution chart will load here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Activity and Tasks */}
            <div 
              className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-8" 
              style={{ contain: 'layout', minHeight: '300px' }}
            >
              <Card style={{ contain: 'layout', minHeight: '300px' }}>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                        D
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">Document Uploaded</p>
                        <p className="text-xs text-muted-foreground">Commercial Building Plans</p>
                      </div>
                      <span className="text-xs text-muted-foreground">2h ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                        C
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">Compliance Check Completed</p>
                        <p className="text-xs text-muted-foreground">Residential Permit #R-2023-42</p>
                      </div>
                      <span className="text-xs text-muted-foreground">5h ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500">
                        N
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">New Regulation Added</p>
                        <p className="text-xs text-muted-foreground">California Building Code Update</p>
                      </div>
                      <span className="text-xs text-muted-foreground">1d ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                        I
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">Issue Detected</p>
                        <p className="text-xs text-muted-foreground">Commercial Project #C-2023-15</p>
                      </div>
                      <span className="text-xs text-muted-foreground">2d ago</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                        R
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-medium">Report Generated</p>
                        <p className="text-xs text-muted-foreground">Monthly Compliance Summary</p>
                      </div>
                      <span className="text-xs text-muted-foreground">3d ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card style={{ contain: 'layout', minHeight: '300px' }}>
                <CardHeader>
                  <CardTitle>Pending Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border rounded flex items-center justify-center">
                        <div className="h-3 w-3 bg-primary rounded-sm"></div>
                      </div>
                      <span className="text-sm flex-1">Review commercial building plans</span>
                      <Button variant="outline" size="sm">Start</Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border rounded"></div>
                      <span className="text-sm flex-1">Update residential compliance documentation</span>
                      <Button variant="outline" size="sm">Start</Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border rounded"></div>
                      <span className="text-sm flex-1">Address ventilation issues in project #R-2023-38</span>
                      <Button variant="outline" size="sm">Start</Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 border rounded"></div>
                      <span className="text-sm flex-1">Generate quarterly compliance report</span>
                      <Button variant="outline" size="sm">Start</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
} 