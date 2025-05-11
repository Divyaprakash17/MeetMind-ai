import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Word, formatTranscript, TranscriptSegment, convertToHHMMSS } from '../utils/transcriptUtils';

interface TranscriptProps {
  transcription: {
    text: string;
    words: Word[];
  } | null;
  currentTime: number;
  onSeek: (time: number) => void;
  className?: string;
  isProcessing?: boolean;
}

// Memoize the timeToSeconds function to prevent recreation on each render
const timeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number).reverse();
  return parts.reduce((total, part, index) => {
    return total + (part * Math.pow(60, index));
  }, 0);
};

// Memoized segment component to prevent unnecessary re-renders
const TranscriptSegmentItem = React.memo(({ 
  segment, 
  isActive, 
  onClick 
}: { 
  segment: TranscriptSegment; 
  isActive: boolean; 
  onClick: (time: string) => void 
}) => {
  // Format the timestamp using convertToHHMMSS
  const formattedTime = useMemo(() => convertToHHMMSS(segment.startTime), [segment.startTime]);
  
  return (
    <div 
      className={cn(
        'mb-2 p-2 rounded-md transition-colors cursor-pointer',
        isActive 
          ? 'bg-blue-50 border-l-4 border-blue-500' 
          : 'hover:bg-gray-50'
      )}
      onClick={() => onClick(segment.startTime)}
    >
      <button 
        className={cn(
          'text-sm font-mono mr-2 focus:outline-none',
          isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-blue-600'
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClick(segment.startTime);
        }}
        aria-label={`Jump to ${formattedTime}`}
      >
        [{formattedTime}]
      </button>
      <span className="text-sm">
        {segment.text}
      </span>
    </div>
  );
});

TranscriptSegmentItem.displayName = 'TranscriptSegmentItem';

const Transcript: React.FC<TranscriptProps> = ({
  transcription,
  currentTime,
  onSeek,
  className,
  isProcessing = false,
}) => {
  const [formattedSegments, setFormattedSegments] = useState<TranscriptSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastProcessedId = useRef<string>('');
  const lastActiveIndex = useRef<number>(-1);

  // Generate a unique ID for the current transcription to prevent reprocessing
  const transcriptionId = useMemo(() => {
    if (!transcription?.words?.length) return '';
    return JSON.stringify(transcription.words.map(w => `${w.start}-${w.end}-${w.text}`));
  }, [transcription]);

  // Process transcript when transcription changes
  const processTranscript = useCallback(async (words: Word[]) => {
    if (!words || !words.length) {
      setFormattedSegments([]);
      setIsLoading(false);
      return;
    }

    const currentId = JSON.stringify(words.map(w => `${w.start}-${w.end}-${w.text}`));
    if (currentId === lastProcessedId.current) {
      return; // Skip if we've already processed this exact transcription
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const segments = await formatTranscript(words);
      setFormattedSegments(segments);
      segmentRefs.current = segments.map((_, i) => segmentRefs.current[i] || null);
      lastProcessedId.current = currentId;
    } catch (err) {
      console.error('Error formatting transcript:', err);
      setError('Failed to load transcript. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Process transcript when transcription changes
  useEffect(() => {
    if (transcription?.words) {
      processTranscript(transcription.words);
    } else {
      setFormattedSegments([]);
      setIsLoading(false);
    }
  }, [transcription, processTranscript]);

  // Memoize the segments to prevent unnecessary re-renders
  const memoizedSegments = useMemo(() => formattedSegments, [formattedSegments]);

  // Find active segment based on current time
  useEffect(() => {
    if (memoizedSegments.length === 0) return;

    const currentTimeInSeconds = currentTime;
    
    // Find the segment that contains the current time
    let activeIndex = -1;
    
    // Only update if we have segments and the time has meaningfully changed
    if (memoizedSegments.length > 0) {
      activeIndex = memoizedSegments.findIndex((segment, index) => {
        const segmentStart = timeToSeconds(segment.startTime);
        const nextSegmentStart = index < memoizedSegments.length - 1 
          ? timeToSeconds(memoizedSegments[index + 1].startTime) 
          : Infinity;
        
        return currentTimeInSeconds >= segmentStart && currentTimeInSeconds < nextSegmentStart;
      });
    }

    // Only update state if the active index has actually changed
    if (activeIndex !== lastActiveIndex.current) {
      setActiveSegmentIndex(activeIndex);
      lastActiveIndex.current = activeIndex;
    }
  }, [currentTime, memoizedSegments]);

  // Scroll active segment into view
  useEffect(() => {
    if (activeSegmentIndex >= 0 && segmentRefs.current[activeSegmentIndex]) {
      const activeElement = segmentRefs.current[activeSegmentIndex];
      const container = containerRef.current;
      
      if (activeElement && container) {
        const containerRect = container.getBoundingClientRect();
        const activeRect = activeElement.getBoundingClientRect();
        
        // Only scroll if the element is not in view
        if (
          activeRect.top < containerRect.top + 100 || // 100px from top
          activeRect.bottom > containerRect.bottom - 100 // 100px from bottom
        ) {
          // Use requestAnimationFrame for smoother scrolling
          requestAnimationFrame(() => {
            activeElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          });
        }
      }
    }
  }, [activeSegmentIndex]);

  // Memoize the click handler to prevent unnecessary re-renders
  const handleTimestampClick = useCallback((timeStr: string) => {
    const timeInSeconds = timeToSeconds(timeStr);
    onSeek(timeInSeconds);
  }, [onSeek]);

  // Show loading state
  if (isProcessing) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return <div className={cn('p-4 text-red-500', className)}>{error}</div>;
  }

  // Show empty state
  if (!memoizedSegments || memoizedSegments.length === 0) {
    return (
      <div className={cn('p-4 text-gray-500 text-center', className)}>
        {isLoading ? 'Loading transcript...' : 'No transcript available. Upload an audio file to generate a transcript.'}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn('overflow-y-auto h-full p-2', className)}
    >
      {memoizedSegments.map((segment, index) => (
        <div 
          key={`${segment.startTime}-${index}`}
          ref={el => segmentRefs.current[index] = el}
        >
          <TranscriptSegmentItem 
            segment={segment} 
            isActive={index === activeSegmentIndex}
            onClick={handleTimestampClick}
          />
        </div>
      ))}
    </div>
  );
};

export default React.memo(Transcript, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.currentTime === nextProps.currentTime &&
    prevProps.isProcessing === nextProps.isProcessing &&
    JSON.stringify(prevProps.transcription) === JSON.stringify(nextProps.transcription)
  );
});
