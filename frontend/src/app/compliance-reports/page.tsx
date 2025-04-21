"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ComplianceReportsSkeleton } from "@/components/ui/skeleton";

// Mock data type for reports
interface ComplianceReport {
  id: string;
  title: string;
  date: string;
  status: 'compliant' | 'non-compliant' | 'pending';
  projectType: string;
  summary: string;
}

export default function ComplianceReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  
  useEffect(() => {
    // Simulate fetching reports
    const loadReports = async () => {
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock data
        setReports([
          {
            id: '1',
            title: 'Residential Building Code Analysis',
            date: '2023-11-15',
            status: 'compliant',
            projectType: 'Residential',
            summary: 'All aspects of the residential building plan comply with current California building codes.',
          },
          {
            id: '2',
            title: 'Commercial Plumbing Inspection',
            date: '2023-10-22',
            status: 'non-compliant',
            projectType: 'Commercial',
            summary: 'Several issues identified with backflow prevention systems. Corrections needed before approval.',
          },
          {
            id: '3',
            title: 'Industrial Electrical Safety',
            date: '2023-09-30',
            status: 'pending',
            projectType: 'Industrial',
            summary: 'Pending final review of updated electrical diagrams and load calculations.',
          },
          {
            id: '4',
            title: 'Municipal Infrastructure Analysis',
            date: '2023-11-05',
            status: 'compliant',
            projectType: 'Infrastructure',
            summary: 'Road construction plans comply with all current municipal regulations.',
          },
          {
            id: '5',
            title: 'Accessibility Compliance Report',
            date: '2023-10-18',
            status: 'non-compliant',
            projectType: 'Commercial',
            summary: 'ADA compliance issues found in bathroom designs. Adjustments required.',
          },
          {
            id: '6',
            title: 'Fire Safety Assessment',
            date: '2023-11-10',
            status: 'compliant',
            projectType: 'Residential',
            summary: 'All fire safety requirements met including sprinkler systems and emergency exits.',
          },
        ]);
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadReports();
  }, []);
  
  // Render status badge with appropriate color
  const renderStatusBadge = (status: ComplianceReport['status']) => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-500 hover:bg-green-600">Compliant</Badge>;
      case 'non-compliant':
        return <Badge className="bg-red-500 hover:bg-red-600">Non-Compliant</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      default:
        return null;
    }
  };
  
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
          <ComplianceReportsSkeleton />
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-4">Compliance Reports</h1>
            <p className="text-gray-500 mb-8 max-w-3xl">
              Review and manage compliance reports for your construction projects.
            </p>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center mb-8" style={{ contain: 'layout', minHeight: '40px' }}>
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Project Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="ml-auto">
                <Button variant="default">
                  New Report
                </Button>
              </div>
            </div>
            
            {/* Reports Grid */}
            <div 
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" 
              style={{ contain: 'layout', minHeight: '400px' }}
            >
              {reports.map(report => (
                <Card 
                  key={report.id} 
                  className="flex flex-col h-full" 
                  style={{ contain: 'layout', height: '200px' }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg mb-1">{report.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          {renderStatusBadge(report.status)}
                          <Badge variant="outline">{report.projectType}</Badge>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{report.date}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 flex-grow">
                    <p className="text-sm text-gray-600">{report.summary}</p>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between border-t">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    <Button variant="ghost" size="sm">
                      Download PDF
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex justify-center mt-8" style={{ contain: 'layout', height: '40px' }}>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" disabled>
                  &lt;
                </Button>
                <Button variant="default" size="icon">1</Button>
                <Button variant="outline" size="icon">2</Button>
                <Button variant="outline" size="icon">3</Button>
                <Button variant="outline" size="icon">&gt;</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
} 