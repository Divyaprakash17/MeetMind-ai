import React, { useState, useEffect, useRef, useCallback } from 'react';
import FileUploader from '@/components/FileUploader';
import MediaPlayer, { MediaPlayerHandle } from '@/components/MediaPlayer';
import Transcript from '@/components/Transcript';
import Summary from '@/components/Summary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { aiService } from '@/services/AIService';
import type { TranscriptionResult, SummaryResult } from '@/services/AIService';
import { toast } from 'sonner';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionResult | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [mediaReady, setMediaReady] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const mediaPlayerRef = useRef<MediaPlayerHandle>(null);
  const lastUpdateTime = useRef<number>(0);

  const handleFileSelected = async (file: File) => {
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setError('');

    try {
      // Create a URL for the selected file
      const fileUrl = URL.createObjectURL(file);
      setAudioUrl(fileUrl);

      // Show toast notification
      toast('Transcription Started', {
        description: 'Your audio is being processed. This may take a few minutes...',
        duration: 5000,
      });

      console.log('Starting transcription for file:', file.name);
      
      // Start the transcription
      const result = await aiService.transcribeAudio(file);
      
      console.log('Transcription completed:', {
        textLength: result.text?.length,
        wordCount: result.words?.length
      });

      setTranscriptionData(result);
      
      // Generate summary
      const summaryResult = await aiService.generateSummary(result.text);
      setSummary(summaryResult);
      
      // Show success toast
      toast.success('Transcription Complete', {
        description: 'The audio has been transcribed successfully!',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error in handleFileSelected:', error);
      
      // Show error toast
      toast.error('Transcription Failed', {
        description: error.message || 'An error occurred during transcription',
        duration: 5000,
      });
      
      setError(error.message || 'Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTimestampClick = useCallback((time: number) => {
    if (mediaPlayerRef.current) {
      mediaPlayerRef.current.seekTo(time);
    }
    setCurrentTime(time);
  }, []);

  const handleMediaTimeUpdate = useCallback((time: number) => {
    const now = Date.now();
    // Throttle updates to prevent too many re-renders
    if (now - lastUpdateTime.current > 100) {
      setCurrentTime(time);
      lastUpdateTime.current = now;
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (mediaPlayerRef.current) {
      mediaPlayerRef.current.seekTo(time);
    }
    setCurrentTime(time);
  }, []);

  // Process transcription data when it's available
  useEffect(() => {
    if (transcriptionData?.words) {
      // Ensure words are sorted by start time
      const sortedWords = [...transcriptionData.words].sort((a, b) => a.start - b.start);
      
      // Process words to ensure proper format
      const processedWords = sortedWords.map(word => ({
        text: word.text || '',
        start: word.start,
        end: word.end,
        confidence: word.confidence || 1,
        speaker: word.speaker || null
      }));

      setTranscriptionData({
        ...transcriptionData,
        words: processedWords
      });
    }
  }, [transcriptionData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container py-6 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 bg-meeting-primary rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-meeting-dark">MeetMind AI</h1>
            <p className="text-meeting-muted mt-2 text-center">Your intelligent meeting assistant</p>
          </div>
        </div>
      </header>
      
      <main className="container py-6 space-y-6">
        {!selectedFile ? (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-meeting-dark mb-4">Get Started</h2>
            <FileUploader 
              onFileSelected={handleFileSelected}
              isProcessing={isProcessing}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <MediaPlayer
                  ref={mediaPlayerRef}
                  src={audioUrl}
                  currentTime={currentTime}
                  onTimeUpdate={handleMediaTimeUpdate}
                  onSeek={handleSeek}
                  autoPlay={false}
                />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <Tabs defaultValue="transcript" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>
                  <TabsContent value="transcript">
                    <Transcript
                      transcription={transcriptionData}
                      currentTime={currentTime}
                      onSeek={handleTimestampClick}
                      isProcessing={isProcessing}
                      className="h-[400px]"
                    />
                  </TabsContent>
                  <TabsContent value="summary">
                    <Summary 
                      summary={summary} 
                      className="h-[400px]" 
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="text-lg font-semibold text-meeting-dark mb-4">File Information</h2>
                {selectedFile && (
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {selectedFile.name}</p>
                    <p><span className="font-medium">Size:</span> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p><span className="font-medium">Type:</span> {selectedFile.type}</p>
                    <p><span className="font-medium">Last Modified:</span> {new Date(selectedFile.lastModified).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Restored Meeting Notes Section */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="text-lg font-semibold text-meeting-dark mb-3">Meeting Notes</h2>
                
                {/* Key Decisions */}
                <div className="mb-4">
                  <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                    <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Key Decisions
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {summary?.structuredSummary?.keyPoints?.slice(0, 3).map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {point}
                      </li>
                    )) || (
                      <li className="text-gray-500 italic text-sm">No key decisions recorded</li>
                    )}
                  </ul>
                </div>

                {/* Action Items */}
                <div className="mb-4">
                  <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                    <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Action Items
                  </h3>
                  <ul className="space-y-2">
                    {summary?.structuredSummary?.actionItems?.length > 0 ? (
                      summary.structuredSummary.actionItems.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <input 
                            type="checkbox" 
                            id={`sidebar-action-${index}`}
                            className="mt-0.5 mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
                          />
                          <label htmlFor={`sidebar-action-${index}`} className="text-sm text-gray-700">
                            {item}
                          </label>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500 italic text-sm">No action items found</li>
                    )}
                  </ul>
                </div>

                {/* Participants */}
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Participants</h3>
                  <div className="flex flex-wrap gap-2">
                    {summary?.structuredSummary?.participants?.length > 0 ? (
                      summary.structuredSummary.participants.map((participant, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {participant}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 italic text-sm">No participants listed</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="text-lg font-semibold text-meeting-dark mb-4">Actions</h2>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setTranscriptionData(null);
                      setSummary(null);
                      setAudioUrl('');
                      setCurrentTime(0);
                    }}
                    className="w-full px-4 py-2 bg-meeting-primary text-white rounded-md hover:bg-meeting-secondary transition-colors"
                  >
                    Upload New File
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
