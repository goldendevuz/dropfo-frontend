package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/tus/tusd/v2/pkg/filestore"
	tusd "github.com/tus/tusd/v2/pkg/handler"

	"drop-go-backend/internal/handler"
)

func main() {
	// Configuration
	uploadDir := getEnv("UPLOAD_DIR", "./uploads")
	port := getEnv("PORT", "1080")

	// Ensure upload directory exists
	absUploadDir, _ := filepath.Abs(uploadDir)
	if err := os.MkdirAll(absUploadDir, 0755); err != nil {
		log.Fatalf("Failed to create upload directory: %v", err)
	}

	// Create tusd file store
	store := filestore.New(absUploadDir)

	composer := tusd.NewStoreComposer()
	store.UseIn(composer)

	// Configure tusd handler
	tusConfig := tusd.Config{
		BasePath:                "/files/",
		StoreComposer:           composer,
		NotifyCompleteUploads:   true,
		NotifyCreatedUploads:    true,
		NotifyTerminatedUploads: true,
		RespectForwardedHeaders: true, // Use X-Forwarded-Host from nginx
	}

	tusHandler, err := tusd.NewHandler(tusConfig)
	if err != nil {
		log.Fatalf("Failed to create tusd handler: %v", err)
	}

	// Handle tusd events in background
	go handleTusEvents(tusHandler)

	// Create file handler for custom API endpoints
	fileHandler := handler.NewFileHandler(absUploadDir)

	// Set up routes
	mux := http.NewServeMux()

	// Mount tusd handler at /files/
	mux.Handle("/files/", http.StripPrefix("/files/", tusHandler))
	mux.Handle("/files", http.StripPrefix("/files", tusHandler))

	// Custom API endpoints
	mux.HandleFunc("/api/files", fileHandler.ListFiles)
	mux.HandleFunc("/api/files/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			fileHandler.DownloadFile(w, r)
		case http.MethodDelete:
			fileHandler.DeleteFile(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/stream/", fileHandler.StreamFile)

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	// Apply CORS middleware
	corsHandler := handler.CORSMiddleware(mux)

	log.Printf("=== Drop Go Files Server ===")
	log.Printf("Upload directory: %s", absUploadDir)
	log.Printf("tus endpoint: http://localhost:%s/files/", port)
	log.Printf("API endpoint: http://localhost:%s/api/", port)
	log.Printf("Server starting on :%s", port)

	if err := http.ListenAndServe(":"+port, corsHandler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func handleTusEvents(h *tusd.Handler) {
	for {
		select {
		case event := <-h.CompleteUploads:
			log.Printf("Upload completed: %s (filename: %s, size: %d bytes)",
				event.Upload.ID,
				event.Upload.MetaData["filename"],
				event.Upload.Size)

		case event := <-h.CreatedUploads:
			log.Printf("Upload started: %s (filename: %s)",
				event.Upload.ID,
				event.Upload.MetaData["filename"])

		case event := <-h.TerminatedUploads:
			log.Printf("Upload terminated: %s", event.Upload.ID)
		}
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
