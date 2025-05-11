export interface Word {
  text: string;
  start?: number;
  end?: number;
  confidence?: number;
  speaker?: string;
}

export interface TranscriptSegment {
  text: string;
  startTime: string;
}

// Format time in seconds to HH:MM:SS
export const formatTime = (seconds: number): string => {
  const secs = Math.max(0, isNaN(Number(seconds)) ? 0 : Number(seconds));
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const remainingSecs = Math.floor(secs % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
};

/**
 * Converts a timestamp to HH:MM:SS format
 * @param timeStr Time string in MM:SS or seconds format
 * @returns Time string in HH:MM:SS format
 */
export const convertToHHMMSS = (timeStr: string | number): string => {
  if (!timeStr && timeStr !== 0) return '00:00:00';

  // If it's a number, treat as seconds
  if (typeof timeStr === 'number' || !isNaN(Number(timeStr))) {
    const totalSeconds = Number(timeStr);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  }

  // If it's already in HH:MM:SS format, return as is
  if (typeof timeStr === 'string' && timeStr.split(':').length === 3) {
    return timeStr;
  }

  // If it's in MM:SS format
  if (typeof timeStr === 'string' && timeStr.includes(':')) {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    const totalSeconds = minutes * 60 + seconds;
    return convertToHHMMSS(totalSeconds);
  }

  // If we get here, return default
  return '00:00:00';
};

/**
 * Processes a transcript text with [MM:SS] timestamps and converts them to [HH:MM:SS] format
 * @param transcriptText The raw transcript text with [MM:SS] timestamps
 * @returns Processed text with [HH:MM:SS] timestamps
 */
export const processTranscriptTimestamps = (transcriptText: string): string => {
  if (!transcriptText) return '';
  
  // This regex matches [MM:SS] timestamps in the transcript
  // It looks for patterns like [00:23], [1:45], etc.
  return transcriptText.replace(/\[(\d{1,2}):(\d{2})\]/g, (match, minutes, seconds) => {
    const mins = parseInt(minutes, 10);
    const secs = parseInt(seconds, 10);
    const totalSeconds = (mins * 60) + secs;
    
    const hours = Math.floor(totalSeconds / 3600);
    const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;
    
    return `[${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}]`;
  });
};

// Clean text by removing extra spaces and normalizing
const cleanText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')      // Replace multiple spaces with one
    .replace(/^\s+|\s+$/g, '') // Trim spaces from start/end
    .replace(/\s+([.,!?])/g, '$1') // Remove space before punctuation
    .replace(/([.,!?])([^\s])/g, '$1 $2') // Add space after punctuation if missing
    .trim();
};

// Group words into segments with timestamps
export const formatTranscript = async (words: Word[] = []): Promise<TranscriptSegment[]> => {
  try {
    if (!words || !Array.isArray(words) || words.length === 0) {
      return [];
    }

    const segments: TranscriptSegment[] = [];
    let currentSegment: string[] = [];
    let segmentStart = words[0]?.start || 0;
    const PAUSE_THRESHOLD = 2; // seconds
    
    // Process each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word?.text?.trim()) continue;
      
      const prevWord = i > 0 ? words[i - 1] : null;
      
      // Check for long pause
      const isLongPause = prevWord && 
                        (word.start || 0) > 0 && 
                        (prevWord.end || 0) > 0 &&
                        ((word.start || 0) - (prevWord.end || 0)) > PAUSE_THRESHOLD;
      
      // Start new segment if needed
      if ((isLongPause || i === 0) && currentSegment.length > 0) {
        const segmentText = cleanText(currentSegment.join(' '));
        if (segmentText) {
          segments.push({
            text: segmentText,
            startTime: formatTime(segmentStart)
          });
        }
        currentSegment = [];
        segmentStart = word.start || 0;
      }
      
      // Add word to current segment
      currentSegment.push(word.text.trim());
    }
    
    // Add the last segment if not empty
    if (currentSegment.length > 0) {
      const segmentText = cleanText(currentSegment.join(' '));
      if (segmentText) {
        segments.push({
          text: segmentText,
          startTime: formatTime(segmentStart)
        });
      }
    }
    
    return segments;
  } catch (error) {
    console.error('Error in formatTranscript:', error);
    return [];
  }
};

// Format transcript for display - just returns the text with timestamps
export const formatTranscriptForDisplay = async (words: Word[] = []): Promise<string> => {
  try {
    const segments = await formatTranscript(words);
    return segments
      .map(segment => `[${convertToHHMMSS(segment.startTime)}] ${segment.text}`)
      .join('\n\n');
  } catch (error) {
    console.error('Error in formatTranscriptForDisplay:', error);
    return '';
  }
};