import {useCallback, useEffect, useState} from 'react';

const API_ENDPOINT = "/api";

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    path?: string;
    completed: boolean;
}

export const useUploadedFiles = () => {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_ENDPOINT}/files`);
            if (!response.ok) {
                throw new Error('Failed to fetch files');
            }
            const data = await response.json();
            setFiles(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch files');
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const getDownloadUrl = useCallback((fileId: string) => {
        return `${API_ENDPOINT}/files/${fileId}`;
    }, []);

    const getStreamUrl = useCallback((fileId: string) => {
        return `${API_ENDPOINT}/stream/${fileId}`;
    }, []);

    const downloadFile = useCallback((file: UploadedFile) => {
        const url = getDownloadUrl(file.id);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, [getDownloadUrl]);

    const deleteFile = useCallback(async (fileId: string) => {
        try {
            const response = await fetch(`${API_ENDPOINT}/files/${fileId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete file');
            }
            // Remove file from local state
            setFiles((prev) => prev.filter((f) => f.id !== fileId));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete file');
            return false;
        }
    }, []);

    // Fetch files on mount
    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    return {
        files,
        loading,
        error,
        fetchFiles,
        downloadFile,
        deleteFile,
        getDownloadUrl,
        getStreamUrl,
    };
};