  import { GoogleGenerativeAI } from '@google/generative-ai';

interface TranscriptionResult {
  id: string;
  text: string;
  words: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker: string | null;
  }>;
}

export interface SummaryResult {
  rawSummary: string;
  structuredSummary: {
    title: string;
    dateTime: string;
    executiveSummary: string;
    keyPoints: string[];
    highlights: string[];
    actionItems: string[];
    participants: string[];
    futureMeetingDates: string[];
  };
}

class AIService {
  private assemblyAiApiKey: string;
  private genAI: GoogleGenerativeAI | null = null;
  private geminiApiKey: string;

  constructor() {
    // Get API keys from environment variables
    this.assemblyAiApiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY || '';
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    
    console.log('Loaded AssemblyAI Key:', this.assemblyAiApiKey ? '***' + this.assemblyAiApiKey.slice(-4) : 'Not set');
    console.log('Loaded Gemini Key:', this.geminiApiKey ? '***' + this.geminiApiKey.slice(-4) : 'Not set');

    if (!this.assemblyAiApiKey) {
      console.error('AssemblyAI API key is not set');
    }

    if (!this.geminiApiKey) {
      console.error('Gemini API key is not set');
    } else {
      try {
        this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
        console.log('Gemini API initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Gemini API:', error);
      }
    }
  }

  async transcribeAudio(audioFile: File): Promise<TranscriptionResult> {
    try {
      // First upload the file to AssemblyAI
      const uploadResponse = await this.uploadFile(audioFile);
      
      if (!uploadResponse.upload_url) {
        throw new Error('Failed to get upload URL from AssemblyAI');
      }

      console.log('File uploaded successfully, starting transcription...');
      
      // Start the transcription with enhanced settings
      const transcriptionResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': this.assemblyAiApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: uploadResponse.upload_url,
          speaker_labels: true,  // Keep speaker_labels for speaker diarization
          language_code: 'en_us',
          punctuate: true,
          format_text: true,
          dual_channel: false,   // Disable dual_channel as it conflicts with speaker_labels
          word_boost: ['financial', 'budget', 'council', 'meeting', 'Springfield'],
          speech_threshold: 0.5,
          auto_highlights: false,
          filter_profanity: true,
          speakers_expected: 5
        })
      });

      if (!transcriptionResponse.ok) {
        const error = await transcriptionResponse.json();
        throw new Error(`Transcription request failed: ${JSON.stringify(error)}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      
      if (!transcriptionData.id) {
        throw new Error('No transcription ID received from AssemblyAI');
      }

      console.log('Transcription started with ID:', transcriptionData.id);
      
      // Poll for the transcription result
      let result;
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 3 seconds = 90 seconds max
      
      while (attempts < maxAttempts) {
        attempts++;
        
        const response = await fetch(
          `https://api.assemblyai.com/v2/transcript/${transcriptionData.id}`,
          {
            headers: {
              'authorization': this.assemblyAiApiKey,
              'content-type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Failed to get transcription status: ${JSON.stringify(error)}`);
        }
        
        result = await response.json();
        
        if (result.status === 'completed') {
          console.log('Transcription completed successfully');
          break;
        }
        
        if (result.status === 'error') {
          throw new Error(`Transcription failed: ${result.error}`);
        }
        
        console.log(`Transcription status: ${result.status} (attempt ${attempts}/${maxAttempts})`);
        
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Transcription timed out');
      }
      
      // Process the words to ensure they have proper timing
      const processedWords = result.words?.map((word: any) => ({
        text: word.text,
        start: word.start / 1000, // Convert to seconds
        end: word.end / 1000,     // Convert to seconds
        confidence: word.confidence || 1,
        speaker: word.speaker || null
      })) || [];
      
      return {
        id: result.id,
        text: result.text || '',
        words: processedWords
      };
    } catch (error) {
      console.error('Error in transcribeAudio:', error);
      throw error;
    }
  }

  private async uploadFile(file: File): Promise<{ upload_url: string }> {
    try {
      // First get the upload URL
      const response = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': this.assemblyAiApiKey,
        },
        body: file
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`File upload failed: ${JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw error;
    }
  }

  async generateSummary(transcript: string): Promise<SummaryResult> {
    if (!this.genAI) {
      throw new Error('Gemini API is not properly configured');
    }

    try {
      const prompt = `You are a meeting–summarization assistant. Given a raw transcript, output **only** a JSON object matching the following schema, with no extra text, comments, or markdown:

\`\`\`json
{
  "title": "Meeting Title",
  "dateTime": "YYYY-MM-DDTHH:mm:ss",
  "executiveSummary": "A concise 8-10 sentence summary of the entire meeting including key decisions and outcomes.",
  "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4", "Highlight 5"],
  "actionItems": ["Action 1", "Action 2", "Action 3",],
  "participants": ["Name 1", "Name 2"],
  "futureMeetingDates": ["YYYY-MM-DD"]
}
\`\`\`

**Guidelines**:
1. **executiveSummary** should be a brief but comprehensive overview of the entire meeting.
2. **keyPoints** should list the 5 most important discussion points or decisions.
3. **highlights** should capture 5 key moments or notable statements.
4. **actionItems** must be specific, actionable tasks with clear ownership if mentioned.
5. **participants** should list all speakers and mentioned attendees.
6. **futureMeetingDates** should include any mentioned follow-up dates.
      
      Transcript: ${transcript}`;

      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent([prompt, transcript]);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse summary response');
      }
      
      const structuredSummary = JSON.parse(jsonMatch[0]);
      
      return {
        rawSummary: text,
        structuredSummary: {
          title: structuredSummary.title || 'Meeting Summary',
          dateTime: structuredSummary.dateTime || new Date().toISOString(),
          executiveSummary: structuredSummary.executiveSummary || '',
          keyPoints: structuredSummary.keyPoints || [],
          highlights: structuredSummary.highlights || [],
          actionItems: structuredSummary.actionItems || [],
          participants: structuredSummary.participants || [],
          futureMeetingDates: structuredSummary.futureMeetingDates || []
        }
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();