import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileProgress } from './FileProgress';
import { UploadFile } from '@/types/upload';
import { Pause, Play, Trash2 } from 'lucide-react';

interface FileListProps {
  files: UploadFile[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onPauseAll: () => void;
  onResumeAll: () => void;
  onClearCompleted: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onPauseAll,
  onResumeAll,
  onClearCompleted,
}) => {
  const { t } = useTranslation();
  const uploadingCount = files.filter((f) => f.status === 'uploading').length;
  const pausedCount = files.filter((f) => f.status === 'paused').length;
  const completedCount = files.filter((f) => f.status === 'completed').length;
  const totalCount = files.length;

  const totalProgress = files.length > 0
    ? Math.round(files.reduce((acc, f) => acc + f.progress, 0) / files.length)
    : 0;

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in">
      {/* Summary Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t('fileList.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalCount} {t('fileList.files')} • {completedCount} {t('fileProgress.completed').toLowerCase()} • {uploadingCount} {t('fileProgress.uploading').toLowerCase()}
            {pausedCount > 0 && ` • ${pausedCount} ${t('fileProgress.paused').toLowerCase()}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {uploadingCount > 0 && (
            <button
              onClick={onPauseAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors text-sm font-medium"
            >
              <Pause className="w-4 h-4" />
              {t('fileList.pauseAll')}
            </button>
          )}

          {pausedCount > 0 && (
            <button
              onClick={onResumeAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Play className="w-4 h-4" />
              {t('fileList.resumeAll')}
            </button>
          )}

          {completedCount > 0 && (
            <button
              onClick={onClearCompleted}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              {t('fileList.clearCompleted')}
            </button>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6 p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{t('fileList.overallProgress')}</span>
          <span className="text-sm font-semibold text-primary">{totalProgress}%</span>
        </div>
        <div className="h-3 bg-progress-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* File List */}
      <div className="space-y-3">
        {files.map((file) => (
          <FileProgress
            key={file.id}
            file={file}
            onPause={() => onPause(file.id)}
            onResume={() => onResume(file.id)}
            onCancel={() => onCancel(file.id)}
            onRetry={() => onRetry(file.id)}
          />
        ))}
      </div>
    </div>
  );
};
