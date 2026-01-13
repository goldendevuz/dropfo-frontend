# Drop Go Files

A simple file upload and download system with resumable uploads, crash recovery, and media preview support.

## Features

- **Resumable Uploads**: Pause and resume uploads at any time using tus.io protocol
- **Crash Recovery**: Uploads automatically resume after page refresh or browser crash
- **Folder Support**: Upload entire folders with directory structure preserved
- **Media Preview**: Built-in player for video, audio, images, and PDF files
- **Multi-language**: Support for Uzbek, Russian, and English
- **No Authentication**: Simple drop-and-go file sharing

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, tus-js-client
- **Backend**: Go, tusd (tus.io server implementation)
- **Deployment**: Docker, nginx

## Quick Start

```bash
# Start services
make up

# Access the app
open http://localhost:8080
```

## Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all services |
| `make down` | Stop all services |
| `make rebuild` | Rebuild and restart services |
| `make logs` | View container logs |
| `make clean` | Remove containers and volumes |
| `make backup` | Backup uploaded files |
| `make restore` | Restore uploaded files |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│    Frontend     │────▶│    Backend      │
│   (React/TS)    │     │   (Go/tusd)     │
│   Port: 8080    │     │   Port: 1080    │
│                 │     │                 │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │   File Storage  │
                        │   ./uploads/    │
                        │                 │
                        └─────────────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/files/` | POST | tus upload endpoint |
| `/api/files` | GET | List uploaded files |
| `/api/files/{id}` | GET | Download file |
| `/api/stream/{id}` | GET | Stream file (supports range requests) |

## Development

### Prerequisites

- Docker and Docker Compose
- Make

### Local Development

```bash
# Frontend only (requires backend running)
cd frontend
npm install
npm run dev

# Backend only (requires Go)
cd backend
go run cmd/server/main.go
```

## File Structure

```
.
├── backend/
│   ├── cmd/server/main.go    # Main server entry
│   ├── internal/handler/     # HTTP handlers
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   └── i18n/             # Translations
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── Makefile
└── README.md
```
