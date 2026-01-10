import { DropZone } from '@/components/DropZone';
import { FileList } from '@/components/FileList';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Cloud } from 'lucide-react';

const Index = () => {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 mb-6">
            <Cloud className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            File Uploader
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Upload files and folders with ease. Track progress, pause, and resume uploads anytime.
          </p>
        </div>

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
                <h3 className="font-semibold text-foreground mb-2">Folder Support</h3>
                <p className="text-sm text-muted-foreground">
                  Upload entire folders with directory structure preserved
                </p>
              </div>
              
              <div className="p-6 bg-card border border-border rounded-xl">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">⏸️</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Pause & Resume</h3>
                <p className="text-sm text-muted-foreground">
                  Control uploads with pause and resume functionality
                </p>
              </div>
              
              <div className="p-6 bg-card border border-border rounded-xl">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Progress Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time progress bars for each file upload
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
