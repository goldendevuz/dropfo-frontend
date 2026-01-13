package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// FileHandler handles file listing and downloads
type FileHandler struct {
	uploadDir string
}

// NewFileHandler creates a new FileHandler
func NewFileHandler(uploadDir string) *FileHandler {
	return &FileHandler{uploadDir: uploadDir}
}

// FileInfo represents file metadata for API responses
type FileInfo struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Size      int64  `json:"size"`
	MimeType  string `json:"mimeType"`
	Path      string `json:"path,omitempty"`
	Completed bool   `json:"completed"`
}

// TusInfo represents the structure of .info files created by tusd
type TusInfo struct {
	ID       string            `json:"ID"`
	Size     int64             `json:"Size"`
	Offset   int64             `json:"Offset"`
	MetaData map[string]string `json:"MetaData"`
}

// ListFiles returns a JSON list of all completed uploads
func (h *FileHandler) ListFiles(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	files := []FileInfo{}

	entries, err := os.ReadDir(h.uploadDir)
	if err != nil {
		http.Error(w, "Failed to read directory", http.StatusInternalServerError)
		return
	}

	for _, entry := range entries {
		if !strings.HasSuffix(entry.Name(), ".info") {
			continue
		}

		infoPath := filepath.Join(h.uploadDir, entry.Name())
		info, err := h.readTusInfo(infoPath)
		if err != nil {
			continue
		}

		// Check if the actual file exists and get its size
		fileID := strings.TrimSuffix(entry.Name(), ".info")
		filePath := filepath.Join(h.uploadDir, fileID)
		stat, err := os.Stat(filePath)
		if err != nil {
			continue
		}

		// Check if upload is complete by comparing actual file size with expected
		actualSize := stat.Size()
		if actualSize != info.Size {
			continue
		}

		filename := info.MetaData["filename"]
		if filename == "" {
			filename = fileID
		}

		mimeType := info.MetaData["filetype"]
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}

		files = append(files, FileInfo{
			ID:        fileID,
			Name:      filename,
			Size:      actualSize,
			MimeType:  mimeType,
			Path:      info.MetaData["relativePath"],
			Completed: true,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(files)
}

// DownloadFile streams a file for download
func (h *FileHandler) DownloadFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract ID from path: /api/files/{id}
	id := strings.TrimPrefix(r.URL.Path, "/api/files/")
	if id == "" {
		http.Error(w, "File ID required", http.StatusBadRequest)
		return
	}

	// Read metadata to get original filename
	infoPath := filepath.Join(h.uploadDir, id+".info")
	info, err := h.readTusInfo(infoPath)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	// Open the actual file
	filePath := filepath.Join(h.uploadDir, id)
	file, err := os.Open(filePath)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	// Get file stats
	stat, err := file.Stat()
	if err != nil {
		http.Error(w, "Failed to stat file", http.StatusInternalServerError)
		return
	}

	// Check if upload is complete by comparing actual file size with expected
	if stat.Size() != info.Size {
		http.Error(w, "File upload not complete", http.StatusBadRequest)
		return
	}

	// Set headers for download
	filename := info.MetaData["filename"]
	if filename == "" {
		filename = id
	}

	mimeType := info.MetaData["filetype"]
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.Header().Set("Content-Type", mimeType)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", stat.Size()))

	// Stream the file
	io.Copy(w, file)
}

// StreamFile serves a file inline for preview/playback with range support
func (h *FileHandler) StreamFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract ID from path: /api/stream/{id}
	id := strings.TrimPrefix(r.URL.Path, "/api/stream/")
	if id == "" {
		http.Error(w, "File ID required", http.StatusBadRequest)
		return
	}

	// Read metadata
	infoPath := filepath.Join(h.uploadDir, id+".info")
	info, err := h.readTusInfo(infoPath)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	// Open the file
	filePath := filepath.Join(h.uploadDir, id)
	file, err := os.Open(filePath)
	if err != nil {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	defer file.Close()

	// Get file stats
	stat, err := file.Stat()
	if err != nil {
		http.Error(w, "Failed to stat file", http.StatusInternalServerError)
		return
	}

	fileSize := stat.Size()

	// Check if upload is complete by comparing actual file size with expected
	if fileSize != info.Size {
		http.Error(w, "File upload not complete", http.StatusBadRequest)
		return
	}

	// Get mime type
	mimeType := info.MetaData["filetype"]
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	// Set headers for inline display
	filename := info.MetaData["filename"]
	if filename == "" {
		filename = id
	}

	w.Header().Set("Content-Type", mimeType)
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, filename))

	// Handle range requests for video/audio seeking
	rangeHeader := r.Header.Get("Range")
	if rangeHeader != "" {
		// Parse range header: bytes=start-end
		rangeHeader = strings.TrimPrefix(rangeHeader, "bytes=")
		parts := strings.Split(rangeHeader, "-")

		start := int64(0)
		end := fileSize - 1

		if parts[0] != "" {
			start, _ = strconv.ParseInt(parts[0], 10, 64)
		}
		if len(parts) > 1 && parts[1] != "" {
			end, _ = strconv.ParseInt(parts[1], 10, 64)
		}

		// Validate range
		if start > end || start >= fileSize {
			w.Header().Set("Content-Range", fmt.Sprintf("bytes */%d", fileSize))
			http.Error(w, "Range not satisfiable", http.StatusRequestedRangeNotSatisfiable)
			return
		}

		if end >= fileSize {
			end = fileSize - 1
		}

		contentLength := end - start + 1

		// Seek to start position
		file.Seek(start, 0)

		w.Header().Set("Content-Range", fmt.Sprintf("bytes %d-%d/%d", start, end, fileSize))
		w.Header().Set("Content-Length", fmt.Sprintf("%d", contentLength))
		w.WriteHeader(http.StatusPartialContent)

		// Stream the requested range
		io.CopyN(w, file, contentLength)
	} else {
		// Full file
		w.Header().Set("Content-Length", fmt.Sprintf("%d", fileSize))
		io.Copy(w, file)
	}
}

// DeleteFile removes a file and its metadata
func (h *FileHandler) DeleteFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract ID from path: /api/files/{id}
	id := strings.TrimPrefix(r.URL.Path, "/api/files/")
	if id == "" {
		http.Error(w, "File ID required", http.StatusBadRequest)
		return
	}

	// Validate ID to prevent path traversal
	if strings.Contains(id, "/") || strings.Contains(id, "..") {
		http.Error(w, "Invalid file ID", http.StatusBadRequest)
		return
	}

	filePath := filepath.Join(h.uploadDir, id)
	infoPath := filepath.Join(h.uploadDir, id+".info")

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}

	// Remove the data file
	if err := os.Remove(filePath); err != nil {
		http.Error(w, "Failed to delete file", http.StatusInternalServerError)
		return
	}

	// Remove the info file (ignore error if it doesn't exist)
	os.Remove(infoPath)

	w.WriteHeader(http.StatusNoContent)
}

// readTusInfo reads and parses a .info file
func (h *FileHandler) readTusInfo(path string) (*TusInfo, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var info TusInfo
	if err := json.Unmarshal(data, &info); err != nil {
		return nil, err
	}

	return &info, nil
}
