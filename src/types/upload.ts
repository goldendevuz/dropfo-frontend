export type UploadStatus = 'queued' | 'uploading' | 'paused' | 'completed' | 'error';

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  path?: string; // For folder uploads
  uploadedBytes: number;
  error?: string;
}
