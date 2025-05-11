import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  disabled?: boolean;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected, isProcessing, disabled = false, className }) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check if file is audio or video
    if (!file.type.includes('audio/') && !file.type.includes('video/')) {
      toast.error('Please upload only audio or video files');
      return;
    }
    
    setSelectedFile(file);
    onFileSelected(file);
  };

  const onButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div 
      className={cn("relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-all", className, {
        'opacity-50 cursor-not-allowed': disabled,
      })}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      
      {selectedFile ? (
        <div className="flex flex-col items-center space-y-3">
          <FileCheck2 className="w-12 h-12 text-meeting-primary" />
          <div className="text-center">
            <p className="font-medium text-meeting-dark">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-meeting-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-sm text-meeting-dark">Processing...</p>
            </div>
          ) : (
            <Button 
              variant="outline"
              onClick={onButtonClick}
              className="text-meeting-primary border-meeting-primary hover:bg-meeting-accent"
            >
              Choose a different file
            </Button>
          )}
        </div>
      ) : (
        <>
          <Upload className="w-12 h-12 mb-4 text-meeting-primary" />
          <h3 className="mb-2 text-lg font-medium text-meeting-dark">
            Drag and drop your file here
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Support for audio and video files (MP3, MP4, etc.)
          </p>
          <Button 
            onClick={onButtonClick}
            className="bg-meeting-primary hover:bg-meeting-secondary text-white"
            disabled={disabled}
          >
            Browse Files
          </Button>
        </>
      )}
      {disabled && (
        <div className="mt-2 text-sm text-gray-500 text-center">
          Processing your file...
        </div>
      )}
    </div>
  );
};

export default FileUploader;
