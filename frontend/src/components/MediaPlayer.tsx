import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadedFile } from '@/hooks/useUploadedFiles';

interface MediaPlayerProps {
  file: UploadedFile;
  streamUrl: string;
  downloadUrl: string;
  onClose: () => void;
  onDownload: () => void;
}

const getMediaType = (mimeType: string): 'video' | 'audio' | 'image' | 'pdf' | 'unknown' => {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'unknown';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  file,
  streamUrl,
  onClose,
  onDownload,
}) => {
  const { t } = useTranslation();
  const mediaType = getMediaType(file.mimeType);

  const openFullscreen = () => {
    window.open(streamUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Close on backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] mx-4 bg-card rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="font-semibold text-foreground truncate">{file.name}</h3>
            <p className="text-sm text-muted-foreground">
              {formatFileSize(file.size)} • {file.mimeType}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={openFullscreen} className="gap-2">
              <Maximize2 className="w-4 h-4" />
              {t('actions.fullscreen')}
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload} className="gap-2">
              <Download className="w-4 h-4" />
              {t('actions.download')}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="relative bg-black flex items-center justify-center overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {mediaType === 'video' && (
            <video
              src={streamUrl}
              controls
              autoPlay
              className="max-w-full max-h-[70vh]"
              style={{ outline: 'none' }}
            >
              Your browser does not support video playback.
            </video>
          )}

          {mediaType === 'audio' && (
            <div className="p-12 w-full">
              <div className="max-w-md mx-auto">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-5xl">🎵</span>
                </div>
                <p className="text-center text-white mb-6 truncate">{file.name}</p>
                <audio
                  src={streamUrl}
                  controls
                  autoPlay
                  className="w-full"
                  style={{ outline: 'none' }}
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            </div>
          )}

          {mediaType === 'image' && (
            <img
              src={streamUrl}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain"
            />
          )}

          {mediaType === 'pdf' && (
            <iframe
              src={streamUrl}
              title={file.name}
              className="w-full h-[70vh]"
              style={{ border: 'none' }}
            />
          )}

          {mediaType === 'unknown' && (
            <div className="p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-xl bg-muted flex items-center justify-center">
                <span className="text-4xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t('mediaPlayer.previewNotAvailable')}
              </h3>
              <p className="text-gray-400 mb-6">
                {t('mediaPlayer.previewNotAvailableDesc')}
              </p>
              <Button onClick={onDownload} className="gap-2">
                <Download className="w-4 h-4" />
                {t('mediaPlayer.downloadFile')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
