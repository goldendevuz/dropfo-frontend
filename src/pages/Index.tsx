import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DropZone } from '@/components/DropZone';
import { FileList } from '@/components/FileList';
import { UploadedFiles } from '@/components/UploadedFiles';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useUploadedFiles } from '@/hooks/useUploadedFiles';
import { Button } from '@/components/ui/button';
import { Cloud, Upload, FolderOpen } from 'lucide-react';

const Index = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<'upload' | 'files'>('upload');

  const {
    files,
    addFiles,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    pauseAll,
    resumeAll,
    clearCompleted,
  } = useFileUpload();

  const {
    files: uploadedFiles,
    loading: loadingFiles,
    error: filesError,
    fetchFiles,
    downloadFile,
    deleteFile,
    getStreamUrl,
    getDownloadUrl,
  } = useUploadedFiles();

    return (
    <div className="min-h-screen bg-background">
      {/* Theme & Language Toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-6">
            <Cloud className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('app.title')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t('app.description')}
          </p>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            variant={view === 'upload' ? 'default' : 'outline'}
            onClick={() => setView('upload')}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {t('nav.upload')}
          </Button>
          <Button
            variant={view === 'files' ? 'default' : 'outline'}
            onClick={() => {
              setView('files');
              fetchFiles();
            }}
            className="gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            {t('nav.viewUploaded')}
            {uploadedFiles.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary-foreground/20">
                {uploadedFiles.length}
              </span>
            )}
          </Button>
        </div>

        {/* Upload View */}
        {view === 'upload' && (
          <>
            {/* Drop Zone */}
            <DropZone onFilesSelected={addFiles} />

            {/* File List */}
            <FileList
              files={files}
              onPause={pauseUpload}
              onResume={resumeUpload}
              onCancel={cancelUpload}
              onRetry={retryUpload}
              onPauseAll={pauseAll}
              onResumeAll={resumeAll}
              onClearCompleted={clearCompleted}
            />

            {/* Empty State Info */}
            {files.length === 0 && (
              <div className="mt-12 text-center">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-card border border-border rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">📁</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {t('features.folderSupport.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('features.folderSupport.description')}
                    </p>
                  </div>

                  <div className="p-6 bg-card border border-border rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">⏸️</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {t('features.pauseResume.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('features.pauseResume.description')}
                    </p>
                  </div>

                  <div className="p-6 bg-card border border-border rounded-xl">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {t('features.progressTracking.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('features.progressTracking.description')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Files View */}
        {view === 'files' && (
          <UploadedFiles
            files={uploadedFiles}
            loading={loadingFiles}
            error={filesError}
            onRefresh={fetchFiles}
            onDownload={downloadFile}
            onDelete={deleteFile}
            getStreamUrl={getStreamUrl}
            getDownloadUrl={getDownloadUrl}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
