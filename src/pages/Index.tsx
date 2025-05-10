
import React, { useState, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import MediaPlayer from '@/components/MediaPlayer';
import Transcript from '@/components/Transcript';
import Summary from '@/components/Summary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MockAIService, TranscriptionResult, SummaryResult } from '@/services/AIService';
import { toast } from 'sonner';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isProcessingTranscript, setIsProcessingTranscript] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [mediaReady, setMediaReady] = useState<boolean>(false);

  // Initialize AI service
  const aiService = new MockAIService();

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setIsProcessingFile(true);
    setTranscription(null);
    setSummary(null);
    setCurrentTime(0);
    setMediaReady(false);
    
    try {
      // Get transcription
      const result = await aiService.transcribeAudio(file);
      setTranscription(result);
      toast.success('Transcription completed!');
      
      // Once we have the transcription, generate a summary
      setIsProcessingTranscript(true);
      const summaryResult = await aiService.generateSummary(result.text);
      setSummary(summaryResult);
      toast.success('Summary generated!');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file. Please try again.');
    } finally {
      setIsProcessingFile(false);
      setIsProcessingTranscript(false);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleTimestampClick = (time: number) => {
    setCurrentTime(time);
  };

  const handleMediaReady = () => {
    setMediaReady(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container py-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-meeting-dark">AI Meeting Companion</h1>
        </div>
      </header>
      
      <main className="container py-6 space-y-6">
        {!selectedFile && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-meeting-dark mb-4">Get Started</h2>
            <FileUploader 
              onFileSelected={handleFileSelected}
              isProcessing={isProcessingFile}
            />
          </div>
        )}
        
        {selectedFile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <MediaPlayer 
                file={selectedFile}
                currentTime={currentTime}
                onTimeUpdate={handleTimeUpdate}
                onReady={handleMediaReady}
                className="mb-4"
              />
              
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-meeting-dark">
                  {selectedFile.name}
                </h2>
                <button 
                  onClick={() => setSelectedFile(null)} 
                  className="text-sm text-meeting-primary hover:underline"
                >
                  Upload a different file
                </button>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <Tabs defaultValue="transcript" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>
                <TabsContent value="transcript">
                  <Transcript 
                    transcription={transcription}
                    currentTime={currentTime}
                    onTimestampClick={handleTimestampClick}
                  />
                </TabsContent>
                <TabsContent value="summary">
                  <Summary 
                    summary={summary} 
                    isLoading={isProcessingTranscript}
                  />
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <h2 className="text-xl font-semibold text-meeting-dark mb-4">Meeting Notes</h2>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-sm text-gray-500 italic">
                    This area would be used for displaying key insights, action items, and other extracted information from the meeting.
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium text-meeting-dark">Action Items</h3>
                    <ul className="list-disc list-inside text-sm text-meeting-dark">
                      <li>Follow up with marketing team on campaign timeline</li>
                      <li>Review budget allocation for Q3</li>
                      <li>Schedule follow-up meeting for next week</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-white border-t py-4">
        <div className="container text-center text-sm text-gray-500">
          <p>AI Meeting Companion - A smart tool for processing meeting recordings</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
