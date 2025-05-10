
import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface MediaPlayerProps {
  file: File | null;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onReady: () => void;
  className?: string;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ 
  file, 
  currentTime,
  onTimeUpdate,
  onReady,
  className 
}) => {
  const mediaRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Create object URL when file changes
  useEffect(() => {
    if (file) {
      setIsLoading(true);
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      
      // Reset player state
      setIsPlaying(false);
      if (mediaRef.current) {
        mediaRef.current.currentTime = 0;
      }

      // Clean up function
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setMediaUrl(null);
    }
  }, [file]);

  // Handle metadata loaded
  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
      setIsLoading(false);
      onReady();
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      onTimeUpdate(mediaRef.current.currentTime);
    }
  };

  // Sync with external currentTime changes
  useEffect(() => {
    if (mediaRef.current && Math.abs(mediaRef.current.currentTime - currentTime) > 0.5) {
      mediaRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Toggle play/pause
  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Reset to beginning
  const resetPosition = () => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = 0;
      onTimeUpdate(0);
    }
  };

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    if (mediaRef.current) {
      const newTime = (value[0] / 100) * duration;
      mediaRef.current.currentTime = newTime;
      onTimeUpdate(newTime);
    }
  };

  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {file && file.type.includes('video/') ? (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
              <div className="w-10 h-10 border-4 border-meeting-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <video
            ref={mediaRef}
            src={mediaUrl || undefined}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      ) : (
        <div className="relative w-full aspect-[4/1] bg-gradient-to-r from-meeting-light to-meeting-accent rounded-lg overflow-hidden flex items-center justify-center">
          {isLoading ? (
            <div className="w-10 h-10 border-4 border-meeting-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <div className="flex flex-col items-center justify-center text-meeting-dark">
              <div className="w-16 h-16 mb-2 rounded-full bg-meeting-primary bg-opacity-10 flex items-center justify-center">
                <div className="w-8 h-8 animate-pulse-subtle">
                  {isPlaying ? (
                    <div className="w-3 h-8 mx-auto bg-meeting-primary rounded-sm"></div>
                  ) : (
                    <div className="w-0 h-0 mx-auto border-t-8 border-b-8 border-l-12 border-t-transparent border-b-transparent border-l-meeting-primary"></div>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium">{file?.name || "Audio Player"}</p>
            </div>
          )}
          <audio
            ref={mediaRef}
            src={mediaUrl || undefined}
            className="hidden"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      )}

      <div className="flex flex-col space-y-2 w-full">
        <div className="flex items-center space-x-2">
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={resetPosition}
            disabled={!mediaUrl}
            className="rounded-full hover:bg-meeting-accent hover:text-meeting-primary"
          >
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" 
            onClick={togglePlay} 
            disabled={!mediaUrl}
            className={cn(
              "rounded-full w-10 h-10", 
              isPlaying 
                ? "bg-meeting-primary hover:bg-meeting-secondary text-white" 
                : "bg-meeting-primary hover:bg-meeting-secondary text-white"
            )}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          <div className="text-sm font-medium text-meeting-dark">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        <Slider
          disabled={!mediaUrl}
          value={[duration ? (currentTime / duration) * 100 : 0]}
          max={100}
          step={0.1}
          onValueChange={handleSliderChange}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
};

export default MediaPlayer;
