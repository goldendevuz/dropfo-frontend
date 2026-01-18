import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, RefreshCw, FolderOpen, Play, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileIcon } from '@/components/FileIcon';
import { MediaPlayer } from '@/components/MediaPlayer';
import { UploadedFile } from '@/hooks/useUploadedFiles';

interface UploadedFilesProps {
  files: UploadedFile[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDownload: (file: UploadedFile) => void;
  onDelete: (fileId: string) => void;
  getStreamUrl: (fileId: string) => string;
  getDownloadUrl: (fileId: string) => string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const canPreview = (mimeType: string): boolean => {
  return (
    mimeType.startsWith('video/') ||
    mimeType.startsWith('audio/') ||
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf'
  );
};

const getPreviewIcon = (mimeType: string) => {
  if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
    return Play;
  }
  return Eye;
};

export const UploadedFiles: React.FC<UploadedFilesProps> = ({
  files,
  loading,
  error,
  onRefresh,
  onDownload,
  onDelete,
  getStreamUrl,
  getDownloadUrl,
}) => {
  const { t } = useTranslation();
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t('uploadedFiles.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {files.length} {t('uploadedFiles.filesOnServer')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('actions.refresh')}
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && files.length === 0 && (
        <div className="p-8 text-center bg-card border border-border rounded-xl">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">{t('uploadedFiles.loading')}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && files.length === 0 && (
        <div className="p-8 text-center bg-card border border-border rounded-xl">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold text-foreground mb-1">{t('uploadedFiles.noFiles')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('uploadedFiles.noFilesDesc')}
          </p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const PreviewIcon = getPreviewIcon(file.mimeType);
            const showPreview = canPreview(file.mimeType);

            return (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
              >
                {/* File Icon */}
                <FileIcon fileName={file.name} size="md" />

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{file.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span className="truncate">{file.mimeType}</span>
                    {file.path && (
                      <>
                        <span>•</span>
                        <span className="truncate">{file.path}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {showPreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewFile(file)}
                      className="gap-2"
                    >
                      <PreviewIcon className="w-4 h-4" />
                      {t('actions.preview')}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownload(file)}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {t('actions.download')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(file.id)}
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('actions.delete')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media Player Modal */}
      {previewFile && (
        <MediaPlayer
          file={previewFile}
          streamUrl={getStreamUrl(previewFile.id)}
          downloadUrl={getDownloadUrl(previewFile.id)}
          onClose={() => setPreviewFile(null)}
          onDownload={() => {
            onDownload(previewFile);
          }}
        />
      )}
    </div>
  );
};
