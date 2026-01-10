import React from 'react';
import { 
  Pause, 
  Play, 
  X, 
  Check, 
  AlertCircle, 
  RefreshCw,
  File,
  Folder
} from 'lucide-react';
import { UploadFile } from '@/types/upload';

interface FileProgressProps {
  file: UploadFile;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const FileProgress: React.FC<FileProgressProps> = ({
  file,
  onPause,
  onResume,
  onCancel,
  onRetry,
}) => {
  const isUploading = file.status === 'uploading';
  const isPaused = file.status === 'paused';
  const isCompleted = file.status === 'completed';
  const isError = file.status === 'error';
  const isQueued = file.status === 'queued';

  const getStatusColor = () => {
    if (isCompleted) return 'bg-success';
    if (isError) return 'bg-destructive';
    if (isPaused) return 'bg-warning';
    return 'bg-progress-fill';
  };

  const getStatusIcon = () => {
    if (isCompleted) {
      return (
        <div className="p-2 rounded-full bg-success/10">
          <Check className="w-4 h-4 text-success" />
        </div>
      );
    }
    if (isError) {
      return (
        <div className="p-2 rounded-full bg-destructive/10">
          <AlertCircle className="w-4 h-4 text-destructive" />
        </div>
      );
    }
    return (
      <div className="p-2 rounded-full bg-primary/10">
        {file.path ? (
          <Folder className="w-4 h-4 text-primary" />
        ) : (
          <File className="w-4 h-4 text-primary" />
        )}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-slide-up hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {getStatusIcon()}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="truncate">
              <p className="font-medium text-foreground truncate">
                {file.path || file.name}
              </p>
              {file.path && (
                <p className="text-xs text-muted-foreground truncate">
                  {file.name}
                </p>
              )}
            </div>
            <span className="text-sm text-muted-foreground ml-2 whitespace-nowrap">
              {formatSize(file.uploadedBytes)} / {formatSize(file.size)}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-2 bg-progress-bg rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${file.progress}%` }}
            />
            {isUploading && (
              <div 
                className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
                style={{ width: `${file.progress}%` }}
              />
            )}
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">
              {isCompleted && 'Completed'}
              {isPaused && 'Paused'}
              {isUploading && 'Uploading...'}
              {isQueued && 'Queued'}
              {isError && (file.error || 'Upload failed')}
            </span>
            <span className="text-xs font-medium text-foreground">
              {file.progress}%
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {(isUploading || isPaused) && (
            <button
              onClick={isPaused ? onResume : onPause}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-4 h-4 text-primary" />
              ) : (
                <Pause className="w-4 h-4 text-warning" />
              )}
            </button>
          )}
          
          {isError && (
            <button
              onClick={onRetry}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4 text-primary" />
            </button>
          )}
          
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
            title="Remove"
          >
            <X className="w-4 h-4 text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
};
