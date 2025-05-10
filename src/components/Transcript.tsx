
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TranscriptionResult } from '@/services/AIService';
import { cn } from '@/lib/utils';

interface TranscriptProps {
  transcription: TranscriptionResult | null;
  currentTime: number;
  onTimestampClick: (time: number) => void;
  className?: string;
}

const Transcript: React.FC<TranscriptProps> = ({ 
  transcription, 
  currentTime,
  onTimestampClick,
  className 
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredWords, setFilteredWords] = useState<typeof transcription.words>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (transcription) {
      if (searchQuery.trim() === '') {
        setFilteredWords(transcription.words);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = transcription.words.filter(word => 
          word.text.toLowerCase().includes(query)
        );
        setFilteredWords(filtered);
      }
    }
  }, [searchQuery, transcription]);

  // Scroll to current word
  useEffect(() => {
    if (currentWordRef.current && containerRef.current) {
      // Calculate the position to scroll to
      const containerHeight = containerRef.current.clientHeight;
      const wordTop = currentWordRef.current.offsetTop;
      const wordHeight = currentWordRef.current.clientHeight;
      
      // Scroll to position word in the middle of the container
      containerRef.current.scrollTop = wordTop - (containerHeight / 2) + (wordHeight / 2);
    }
  }, [currentTime]);

  if (!transcription) {
    return (
      <div className={cn("flex flex-col space-y-4", className)}>
        <div className="flex items-center p-4 bg-meeting-light rounded-lg">
          <p className="text-meeting-dark text-center w-full">
            No transcript available. Upload a file to get started.
          </p>
        </div>
      </div>
    );
  }

  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Find the current word based on the current time
  const currentWordIndex = transcription.words.findIndex(
    word => currentTime >= word.start && currentTime <= word.end
  );

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-meeting-primary"
          placeholder="Search transcript..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div 
        ref={containerRef}
        className="bg-white border rounded-lg p-4 overflow-y-auto max-h-[400px]"
      >
        {filteredWords.length > 0 ? (
          filteredWords.map((word, index) => {
            const isCurrentWord = transcription.words.indexOf(word) === currentWordIndex;
            const isFirst = index === 0 || (filteredWords[index - 1].start !== word.start);
            
            return (
              <React.Fragment key={`${word.start}-${word.end}-${index}`}>
                {isFirst && (
                  <button 
                    onClick={() => onTimestampClick(word.start)}
                    className="inline-flex items-center justify-center px-2 py-0.5 mr-2 text-xs font-medium text-meeting-primary bg-meeting-accent rounded hover:bg-meeting-primary hover:text-white transition-colors"
                  >
                    {formatTime(word.start)}
                  </button>
                )}
                <span
                  ref={isCurrentWord ? currentWordRef : null}
                  className={cn(
                    "inline mx-0.5", 
                    isCurrentWord ? "bg-meeting-primary text-white px-1 rounded" : "",
                    searchQuery && word.text.toLowerCase().includes(searchQuery.toLowerCase()) 
                      ? "bg-yellow-200" 
                      : ""
                  )}
                >
                  {word.text}
                </span>
                {word.text.endsWith('.') && <br />}
              </React.Fragment>
            );
          })
        ) : (
          <p className="text-center text-gray-500">No matching results found</p>
        )}
      </div>
    </div>
  );
};

export default Transcript;
