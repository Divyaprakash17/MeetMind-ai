
import React from 'react';
import { SummaryResult } from '@/services/AIService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SummaryProps {
  summary: SummaryResult | null;
  isLoading: boolean;
  className?: string;
}

const Summary: React.FC<SummaryProps> = ({ summary, isLoading, className }) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="bg-meeting-light rounded-t-lg">
        <CardTitle className="text-meeting-dark">Meeting Summary</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>
        ) : summary ? (
          <p className="text-meeting-dark">{summary.summary}</p>
        ) : (
          <p className="text-gray-500 italic">
            Upload and process a file to generate a summary.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default Summary;
