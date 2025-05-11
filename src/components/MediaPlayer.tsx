import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/lib/utils';
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface MediaPlayerProps {
  src: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onSeek: (time: number) => void;
  className?: string;
  autoPlay?: boolean;
}

export interface MediaPlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
}

const MediaPlayer = forwardRef<MediaPlayerHandle, MediaPlayerProps>(({
  src,
  currentTime: externalCurrentTime,
  onTimeUpdate,
  onSeek,
  className,
  autoPlay = false,
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const playerRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef(0);
  const updateIntervalRef = useRef<NodeJS.Timeout>();

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    play: () => {
      if (videoRef.current) {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    },
    seekTo: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
  }));

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        setVolume(0);
      } else {
        setVolume(videoRef.current.volume);
      }
    }
  };

  // Handle time update from video element
  const handleTimeUpdate = () => {
    if (videoRef.current && !isSeeking) {
      const now = Date.now();
      // Throttle the updates to prevent too many re-renders
      if (now - lastUpdateTimeRef.current > 100) {
        onTimeUpdate(videoRef.current.currentTime);
        lastUpdateTimeRef.current = now;
      }
    }
  };

  // Handle seek from slider
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      onSeek(newTime);
    }
  };

  // Handle slider value change (during drag)
  const handleSliderValueChange = (value: number[]) => {
    setIsSeeking(true);
  };

  // Handle slider commit (after drag)
  const handleSliderCommit = (value: number[]) => {
    handleSeek(value);
    setTimeout(() => setIsSeeking(false), 100);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  // Format time in HH:MM:SS
  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Sync with external currentTime
  useEffect(() => {
    if (videoRef.current && !isSeeking) {
      // Only update if the difference is significant to prevent jitter
      if (Math.abs(videoRef.current.currentTime - externalCurrentTime) > 0.1) {
        videoRef.current.currentTime = externalCurrentTime;
      }
    }
  }, [externalCurrentTime, isSeeking]);

  // Set up time update interval
  useEffect(() => {
    if (isPlaying) {
      updateIntervalRef.current = setInterval(() => {
        if (videoRef.current && !isSeeking) {
          onTimeUpdate(videoRef.current.currentTime);
        }
      }, 100);
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [isPlaying, isSeeking, onTimeUpdate]);

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5);
          break;
        case 'arrowup':
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case 'arrowdown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const percent = parseInt(e.key) / 10;
          if (videoRef.current) {
            const seekTime = percent * duration;
            videoRef.current.currentTime = seekTime;
            onSeek(seekTime);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [volume, duration, onSeek]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Set up controls auto-hide
  useEffect(() => {
    const resetControlsTimeout = () => {
      setShowControls(true);
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    if (isPlaying) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
    }

    return () => {
      clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, isHovering]);

  return (
    <div 
      ref={playerRef}
      className={cn(
        'relative w-full bg-black rounded-lg overflow-hidden group',
        className
      )}
      onMouseEnter={() => {
        setIsHovering(true);
        setShowControls(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        if (isPlaying) {
          setShowControls(false);
        }
      }}
      onMouseMove={() => {
        if (!showControls) setShowControls(true);
      }}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
            if (autoPlay) {
              videoRef.current.play().catch(console.error);
            }
          }
        }}
        onPlay={() => {
          setIsPlaying(true);
          setShowControls(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
      />

      {/* Controls overlay */}
      <div 
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300',
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Progress bar */}
        <div className="mb-2">
          <Slider
            value={[externalCurrentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSliderValueChange}
            onValueCommit={handleSliderCommit}
            className="w-full cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="text-white hover:bg-white/20"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : volume > 0.5 ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24 cursor-pointer"
              />
            </div>

            <div className="text-white text-sm ml-2">
              {formatTime(externalCurrentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

MediaPlayer.displayName = 'MediaPlayer';

export default MediaPlayer;
