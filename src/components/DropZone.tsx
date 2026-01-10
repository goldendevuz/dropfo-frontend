import React, { useState, useCallback, useRef } from 'react';
import { Upload, FolderUp } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const items = e.dataTransfer.items;
      const files: File[] = [];

      const processEntry = async (entry: FileSystemEntry): Promise<void> => {
        if (entry.isFile) {
          const fileEntry = entry as FileSystemFileEntry;
          return new Promise((resolve) => {
            fileEntry.file((file) => {
              // Preserve the path
              Object.defineProperty(file, 'webkitRelativePath', {
                value: entry.fullPath.substring(1),
                writable: false,
              });
              files.push(file);
              resolve();
            });
          });
        } else if (entry.isDirectory) {
          const dirEntry = entry as FileSystemDirectoryEntry;
          const reader = dirEntry.createReader();
          
          return new Promise((resolve) => {
            const readEntries = () => {
              reader.readEntries(async (entries) => {
                if (entries.length === 0) {
                  resolve();
                  return;
                }
                for (const subEntry of entries) {
                  await processEntry(subEntry);
                }
                readEntries();
              });
            };
            readEntries();
          });
        }
      };

      const processItems = async () => {
        const entries: FileSystemEntry[] = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry();
          if (entry) {
            entries.push(entry);
          }
        }

        for (const entry of entries) {
          await processEntry(entry);
        }

        if (files.length > 0) {
          onFilesSelected(files);
        }
      };

      processItems();
    },
    [onFilesSelected]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(e.target.files);
      }
    },
    [onFilesSelected]
  );

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ease-out
        ${isDragActive 
          ? 'border-primary bg-dropzone-bg-active scale-[1.02] shadow-lg shadow-primary/10' 
          : 'border-border bg-dropzone-bg hover:border-primary/50 hover:bg-dropzone-bg-active/50'
        }
      `}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        <div className={`
          p-6 rounded-full bg-primary/10 transition-transform duration-300
          ${isDragActive ? 'scale-110 animate-pulse-gentle' : ''}
        `}>
          <Upload className="w-12 h-12 text-primary" />
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {isDragActive ? 'Drop files here' : 'Drag & drop files or folders'}
          </h3>
          <p className="text-muted-foreground">
            or use the buttons below to select
          </p>
        </div>

        <div className="flex gap-4 mt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="
              flex items-center gap-2 px-6 py-3 rounded-lg
              bg-primary text-primary-foreground font-medium
              hover:bg-primary/90 transition-colors duration-200
              shadow-md hover:shadow-lg
            "
          >
            <Upload className="w-5 h-5" />
            Select Files
          </button>
          
          <button
            onClick={() => folderInputRef.current?.click()}
            className="
              flex items-center gap-2 px-6 py-3 rounded-lg
              bg-secondary text-secondary-foreground font-medium
              hover:bg-secondary/80 transition-colors duration-200
              border border-border
            "
          >
            <FolderUp className="w-5 h-5" />
            Select Folder
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          {...{ webkitdirectory: '', directory: '' } as any}
        />
      </div>
    </div>
  );
};
