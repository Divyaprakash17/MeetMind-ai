
export interface TranscriptionResult {
  id: string;
  text: string;
  words: {
    text: string;
    start: number;
    end: number;
    confidence: number;
  }[];
}

export interface SummaryResult {
  summary: string;
}

// This is a placeholder interface that will be implemented later
export interface AIService {
  transcribeAudio: (file: File) => Promise<TranscriptionResult>;
  generateSummary: (transcript: string) => Promise<SummaryResult>;
}

// Placeholder implementation for now
export class MockAIService implements AIService {
  async transcribeAudio(file: File): Promise<TranscriptionResult> {
    // This is a mock implementation that returns a sample transcript
    console.log("Transcribing file:", file.name);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      id: "mock-transcript-id",
      text: "This is a sample transcript. The meeting started with a discussion about the new product launch. The team then talked about marketing strategies and budget allocation. Finally, they agreed on next steps and action items.",
      words: [
        { text: "This", start: 0, end: 0.5, confidence: 0.98 },
        { text: "is", start: 0.5, end: 0.7, confidence: 0.99 },
        { text: "a", start: 0.7, end: 0.8, confidence: 0.99 },
        { text: "sample", start: 0.8, end: 1.2, confidence: 0.97 },
        { text: "transcript.", start: 1.2, end: 2, confidence: 0.96 },
        { text: "The", start: 2.2, end: 2.4, confidence: 0.99 },
        { text: "meeting", start: 2.4, end: 2.9, confidence: 0.98 },
        { text: "started", start: 2.9, end: 3.4, confidence: 0.97 },
        { text: "with", start: 3.4, end: 3.6, confidence: 0.99 },
        { text: "a", start: 3.6, end: 3.7, confidence: 0.99 },
        { text: "discussion", start: 3.7, end: 4.5, confidence: 0.96 },
        { text: "about", start: 4.5, end: 4.8, confidence: 0.98 },
        { text: "the", start: 4.8, end: 4.9, confidence: 0.99 },
        { text: "new", start: 4.9, end: 5.1, confidence: 0.99 },
        { text: "product", start: 5.1, end: 5.6, confidence: 0.97 },
        { text: "launch.", start: 5.6, end: 6.2, confidence: 0.96 },
        { text: "The", start: 6.4, end: 6.6, confidence: 0.99 },
        { text: "team", start: 6.6, end: 6.9, confidence: 0.98 },
        { text: "then", start: 6.9, end: 7.1, confidence: 0.98 },
        { text: "talked", start: 7.1, end: 7.5, confidence: 0.97 },
        { text: "about", start: 7.5, end: 7.8, confidence: 0.98 },
        { text: "marketing", start: 7.8, end: 8.4, confidence: 0.96 },
        { text: "strategies", start: 8.4, end: 9.0, confidence: 0.95 },
        { text: "and", start: 9.0, end: 9.2, confidence: 0.99 },
        { text: "budget", start: 9.2, end: 9.7, confidence: 0.97 },
        { text: "allocation.", start: 9.7, end: 10.5, confidence: 0.94 },
        { text: "Finally,", start: 10.8, end: 11.3, confidence: 0.96 },
        { text: "they", start: 11.3, end: 11.5, confidence: 0.98 },
        { text: "agreed", start: 11.5, end: 11.9, confidence: 0.97 },
        { text: "on", start: 11.9, end: 12.0, confidence: 0.99 },
        { text: "next", start: 12.0, end: 12.3, confidence: 0.98 },
        { text: "steps", start: 12.3, end: 12.7, confidence: 0.97 },
        { text: "and", start: 12.7, end: 12.9, confidence: 0.99 },
        { text: "action", start: 12.9, end: 13.3, confidence: 0.97 },
        { text: "items.", start: 13.3, end: 13.8, confidence: 0.96 }
      ]
    };
  }

  async generateSummary(transcript: string): Promise<SummaryResult> {
    // This is a mock implementation that returns a sample summary
    console.log("Generating summary for transcript length:", transcript.length);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      summary: "The team discussed the new product launch, including marketing strategies and budget allocation. They agreed on next steps and assigned action items to team members."
    };
  }
}
