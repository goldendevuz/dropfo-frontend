import { useState, useCallback, useRef } from 'react';
import { UploadFile, UploadStatus } from '@/types/upload';

const generateId = () => Math.random().toString(36).substring(2, 15);

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for simulated upload
const UPLOAD_SPEED = 500; // ms per chunk (simulated)

export const useFileUpload = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const uploadControllers = useRef<Map<string, { paused: boolean; cancelled: boolean }>>(new Map());

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    const uploadFiles: UploadFile[] = fileArray.map((file) => {
      // Get relative path for folder uploads
      const path = (file as any).webkitRelativePath || undefined;
      
      return {
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'queued' as UploadStatus,
        path,
        uploadedBytes: 0,
      };
    });

    setFiles((prev) => [...prev, ...uploadFiles]);
    
    // Start uploading new files
    uploadFiles.forEach((uploadFile) => {
      startUpload(uploadFile.id);
    });
  }, []);

  const simulateUpload = useCallback(async (fileId: string) => {
    const controller = { paused: false, cancelled: false };
    uploadControllers.current.set(fileId, controller);

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'uploading' as UploadStatus } : f
      )
    );

    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    let uploadedBytes = file.uploadedBytes;
    const totalBytes = file.size;
    const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE);

    for (let chunk = Math.floor(uploadedBytes / CHUNK_SIZE); chunk < totalChunks; chunk++) {
      // Check if paused or cancelled
      const currentController = uploadControllers.current.get(fileId);
      if (currentController?.cancelled) {
        return;
      }
      
      while (currentController?.paused) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const stillPaused = uploadControllers.current.get(fileId)?.paused;
        if (!stillPaused) break;
      }

      // Simulate network delay with some randomness
      await new Promise((resolve) => 
        setTimeout(resolve, UPLOAD_SPEED + Math.random() * 200)
      );

      uploadedBytes = Math.min((chunk + 1) * CHUNK_SIZE, totalBytes);
      const progress = Math.round((uploadedBytes / totalBytes) * 100);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, progress, uploadedBytes, status: 'uploading' as UploadStatus }
            : f
        )
      );
    }

    // Mark as completed
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, progress: 100, status: 'completed' as UploadStatus }
          : f
      )
    );

    uploadControllers.current.delete(fileId);
  }, [files]);

  const startUpload = useCallback((fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file && (file.status === 'queued' || file.status === 'paused' || file.status === 'error')) {
        simulateUpload(fileId);
      }
      return prev;
    });
  }, [simulateUpload]);

  const pauseUpload = useCallback((fileId: string) => {
    const controller = uploadControllers.current.get(fileId);
    if (controller) {
      controller.paused = true;
    }
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId && f.status === 'uploading'
          ? { ...f, status: 'paused' as UploadStatus }
          : f
      )
    );
  }, []);

  const resumeUpload = useCallback((fileId: string) => {
    const controller = uploadControllers.current.get(fileId);
    if (controller) {
      controller.paused = false;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId && f.status === 'paused'
            ? { ...f, status: 'uploading' as UploadStatus }
            : f
        )
      );
    } else {
      // Restart upload from where it left off
      simulateUpload(fileId);
    }
  }, [simulateUpload]);

  const cancelUpload = useCallback((fileId: string) => {
    const controller = uploadControllers.current.get(fileId);
    if (controller) {
      controller.cancelled = true;
    }
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    uploadControllers.current.delete(fileId);
  }, []);

  const retryUpload = useCallback((fileId: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, status: 'queued' as UploadStatus, progress: 0, uploadedBytes: 0, error: undefined }
          : f
      )
    );
    simulateUpload(fileId);
  }, [simulateUpload]);

  const removeFile = useCallback((fileId: string) => {
    cancelUpload(fileId);
  }, [cancelUpload]);

  const pauseAll = useCallback(() => {
    files.forEach((file) => {
      if (file.status === 'uploading') {
        pauseUpload(file.id);
      }
    });
  }, [files, pauseUpload]);

  const resumeAll = useCallback(() => {
    files.forEach((file) => {
      if (file.status === 'paused') {
        resumeUpload(file.id);
      }
    });
  }, [files, resumeUpload]);

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== 'completed'));
  }, []);

  return {
    files,
    addFiles,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    removeFile,
    pauseAll,
    resumeAll,
    clearCompleted,
  };
};
