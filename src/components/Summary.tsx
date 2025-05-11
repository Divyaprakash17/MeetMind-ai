import React from 'react';
import { format } from 'date-fns';
import { SummaryResult } from '@/services/AIService';
import { cn } from '@/lib/utils';

interface SummaryProps {
  summary: SummaryResult | null;
  isLoading: boolean;
  className?: string;
}

const Summary: React.FC<SummaryProps> = ({ summary, isLoading, className }) => {
  if (isLoading) {
    return (
      <div className={cn('p-4 space-y-4', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={cn('p-4 text-gray-500', className)}>
        No summary available. Process a meeting to generate a summary.
      </div>
    );
  }

  const structuredSummary = getStructuredSummary(summary);
  if (!structuredSummary) {
    return (
      <div className={cn('p-4 text-gray-500', className)}>
        No summary available. Process a meeting to generate a summary.
      </div>
    );
  }

  const { 
    title, 
    date, 
    keyPoints, 
    actionItems, 
    participants, 
    status,
    executiveSummary
  } = structuredSummary;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className={cn('p-6 space-y-8 overflow-y-auto h-full', className)}>
      {/* Header with Title and Date */}
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        {date && (
          <p className="text-gray-600 text-sm">
            {formatDate(date)}
          </p>
        )}
      </div>

      <div className="space-y-8">
        {/* Executive Summary */}
        {executiveSummary && (
          <section className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Executive Summary</h2>
            <p className="text-gray-700">{executiveSummary}</p>
          </section>
        )}

        {/* Key Points */}
        {keyPoints?.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Key Points</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              {keyPoints.map((point, i) => (
                <li key={i} className="text-gray-700">{point}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Action Items */}
        {actionItems?.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Action Items</h2>
            <ul className="space-y-3">
              {actionItems.map((item, i) => (
                <li key={i} className="flex items-start">
                  <input 
                    type="checkbox" 
                    id={`action-${i}`}
                    className="mt-1 mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  <label htmlFor={`action-${i}`} className="text-gray-700">
                    {item}
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Participants */}
        {participants?.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Participants</h2>
            <div className="flex flex-wrap gap-2">
              {participants.map((participant, i) => (
                <span 
                  key={i}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {participant}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// Parse the raw summary to extract the JSON part
const parseRawSummary = (rawSummary: string) => {
  try {
    // Try to find JSON in the response
    const jsonMatch = rawSummary.match(/```(?:json\n)?([\s\S]*?)\n```/) || 
                     rawSummary.match(/```([\s\S]*?)```/);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[1].trim();
      return JSON.parse(jsonString);
    }
    
    // If no code blocks found, try to parse the entire response as JSON
    return JSON.parse(rawSummary);
  } catch (e) {
    console.error('Failed to parse summary:', e);
    return null;
  }
};

// Format date to be more readable
const formatDate = (dateString: string) => {
  try {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
};

// Get the structured data from the summary
const getStructuredSummary = (summary: SummaryResult) => {
  try {
    // If we already have a structured summary, use it
    if (summary.structuredSummary) {
      return summary.structuredSummary;
    }
    
    // Otherwise, try to parse it from the raw summary
    if (summary.rawSummary) {
      const parsed = parseRawSummary(summary.rawSummary);
      if (parsed) {
        return {
          title: parsed.title || 'Meeting Summary',
          date: parsed.date || new Date().toISOString().split('T')[0],
          keyPoints: parsed.keyPoints || [],
          status: parsed.status || 'Completed',
          participants: parsed.participants || [],
          actionItems: parsed.actionItems || [],
          executiveSummary: parsed.executiveSummary || ''
        };
      }
    }
    
    return null;
  } catch (e) {
    console.error('Error getting structured summary:', e);
    return null;
  }
};

export default Summary;
