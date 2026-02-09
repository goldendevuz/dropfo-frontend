import { useState, useCallback, useRef } from 'react';
import * as tus from 'tus-js-client';
import { UploadFile, UploadStatus } from '@/types/upload';

const TUS_ENDPOINT = '/api/uploads/';
const API_ENDPOINT = '/api';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useFileUpload = () => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const uploadsRef = useRef<Map<string, tus.Upload>>(new Map());
  const speedTrackersRef = useRef<Map<string, { lastBytes: number; lastTime: number }>>(new Map());

  const updateFile = useCallback((id: string, updates: Partial<UploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }, []);

  const calculateSpeedAndEta = useCallback((fileId: string, uploadedBytes: number, totalBytes: number) => {
    const tracker = speedTrackersRef.current.get(fileId);
    const now = Date.now();

    if (!tracker) {
      speedTrackersRef.current.set(fileId, { lastBytes: uploadedBytes, lastTime: now });
      return { speed: 0, eta: 0 };
    }

    const timeDiff = (now - tracker.lastTime) / 1000; // seconds
    const bytesDiff = uploadedBytes - tracker.lastBytes;

    // Update tracker every 500ms to smooth out speed calculations
    if (timeDiff >= 0.5) {
      speedTrackersRef.current.set(fileId, { lastBytes: uploadedBytes, lastTime: now });
    }

    const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
    const remainingBytes = totalBytes - uploadedBytes;
    const eta = speed > 0 ? remainingBytes / speed : 0;

    return { speed, eta };
  }, []);

  const startUpload = useCallback(
    (fileId: string, file: File, path?: string) => {
      // Initialize speed tracker
      speedTrackersRef.current.set(fileId, { lastBytes: 0, lastTime: Date.now() });

      const upload = new tus.Upload(file, {
        endpoint: TUS_ENDPOINT,
        retryDelays: [0, 1000, 3000, 5000],
        chunkSize: CHUNK_SIZE,
        metadata: {
          filename: file.name,
          filetype: file.type || 'application/octet-stream',
          relativePath: path || '',
        },

        onError: (error) => {
          console.error('Upload error:', error);
          updateFile(fileId, {
            status: 'error',
            error: error.message || 'Upload failed',
            speed: 0,
            eta: 0,
          });
        },

        onProgress: (bytesUploaded, bytesTotal) => {
          const progress = Math.round((bytesUploaded / bytesTotal) * 100);
          const { speed, eta } = calculateSpeedAndEta(fileId, bytesUploaded, bytesTotal);

          updateFile(fileId, {
            progress,
            uploadedBytes: bytesUploaded,
            status: 'uploading',
            speed,
            eta,
          });
        },

        onSuccess: () => {
          // Extract file ID from upload URL
          const uploadUrl = upload.url;
          const tusId = uploadUrl?.split('/').pop() || '';

          updateFile(fileId, {
            progress: 100,
            status: 'completed',
            url: `${API_ENDPOINT}/files/${tusId}`,
            speed: 0,
            eta: 0,
          });

          uploadsRef.current.delete(fileId);
          speedTrackersRef.current.delete(fileId);
        },
      });

      // Store reference for pause/resume/cancel
      uploadsRef.current.set(fileId, upload);

      // Check for previous uploads (resume support)
      upload.findPreviousUploads().then((previousUploads) => {
        // Filter to only resume uploads matching current protocol
        const currentProtocol = window.location.protocol;
        const validUploads = previousUploads.filter(
          (prev) => prev.uploadUrl?.startsWith(currentProtocol)
        );
        if (validUploads.length > 0) {
          upload.resumeFromPreviousUpload(validUploads[0]);
        }
        upload.start();
      });
    },
    [updateFile, calculateSpeedAndEta]
  );

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);

      const uploadFiles: UploadFile[] = fileArray.map((file) => {
        const path = (file as any).webkitRelativePath || undefined;
        const id = generateId();

        return {
          id,
          file,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'uploading' as UploadStatus,
          path,
          uploadedBytes: 0,
          speed: 0,
          eta: 0,
        };
      });

      setFiles((prev) => [...prev, ...uploadFiles]);

      // Start uploads
      uploadFiles.forEach((uploadFile) => {
        startUpload(uploadFile.id, uploadFile.file, uploadFile.path);
      });
    },
    [startUpload]
  );

  const pauseUpload = useCallback(
    (fileId: string) => {
      const upload = uploadsRef.current.get(fileId);
      if (upload) {
        upload.abort();
        updateFile(fileId, { status: 'paused', speed: 0, eta: 0 });
      }
    },
    [updateFile]
  );

  const resumeUpload = useCallback(
    (fileId: string) => {
      const upload = uploadsRef.current.get(fileId);
      if (upload) {
        updateFile(fileId, { status: 'uploading' });
        // Reset speed tracker for fresh calculation
        speedTrackersRef.current.set(fileId, {
          lastBytes: 0,
          lastTime: Date.now(),
        });
        upload.start();
      } else {
        // Need to recreate upload - find the file and restart
        setFiles((prev) => {
          const file = prev.find((f) => f.id === fileId);
          if (file) {
            startUpload(fileId, file.file, file.path);
          }
          return prev.map((f) =>
            f.id === fileId ? { ...f, status: 'uploading' as UploadStatus } : f
          );
        });
      }
    },
    [updateFile, startUpload]
  );

  const cancelUpload = useCallback((fileId: string) => {
    const upload = uploadsRef.current.get(fileId);
    if (upload) {
      upload.abort(true); // true = terminate on server
    }
    uploadsRef.current.delete(fileId);
    speedTrackersRef.current.delete(fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const retryUpload = useCallback(
    (fileId: string) => {
      setFiles((prev) => {
        const file = prev.find((f) => f.id === fileId);
        if (file) {
          // Remove old upload reference
          uploadsRef.current.delete(fileId);
          speedTrackersRef.current.delete(fileId);
          // Start fresh upload
          startUpload(fileId, file.file, file.path);
        }
        return prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                status: 'uploading' as UploadStatus,
                progress: 0,
                uploadedBytes: 0,
                error: undefined,
                speed: 0,
                eta: 0,
              }
            : f
        );
      });
    },
    [startUpload]
  );

  const removeFile = useCallback(
    (fileId: string) => {
      cancelUpload(fileId);
    },
    [cancelUpload]
  );

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
