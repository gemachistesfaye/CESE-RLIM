# File Storage & Document Management

## Architecture

The file storage system uses a **provider-agnostic abstraction** that decouples business logic from storage implementation.

```
StorageModule
├── IStorageService (interface)
│   ├── upload(file, storageKey)
│   ├── download(storageKey)
│   ├── delete(storageKey)
│   ├── exists(storageKey)
│   ├── getSignedUrl(storageKey, expiresInMinutes)
│   └── getMetadata(storageKey)
├── SupabaseStorageService (production)
└── LocalStorageService (development fallback)
```

The provider is selected at runtime via the `STORAGE_PROVIDER` environment variable.

## Storage Providers

### Local Storage (Default for Development)

Files are stored on the local filesystem under the directory specified by `LOCAL_STORAGE_DIR`.

### Supabase Storage (Production)

Uses Supabase Storage with the `@supabase/supabase-js` client. Requires:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STORAGE_BUCKET`

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STORAGE_PROVIDER` | No | `local` | `local` or `supabase` |
| `LOCAL_STORAGE_DIR` | No | `./storage` | Local filesystem directory |
| `SUPABASE_URL` | If supabase | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | If supabase | — | Supabase service role key |
| `STORAGE_BUCKET` | No | `research-documents` | Storage bucket name |

## Upload Flow

1. Client sends `multipart/form-data` with file and metadata
2. Backend validates:
   - File extension against allowlist
   - MIME type against allowlist
   - File size against configured maximum (100MB default)
3. Storage key is generated: `research-documents/{uuid}.{ext}`
4. Original filename is sanitized and stored as metadata only
5. File is uploaded to storage provider
6. SHA-256 checksum is calculated and stored
7. Database records are created (ResearchDocument + ResearchDocumentVersion)
8. Audit log entry is created

## Download Flow

1. Client requests download URL via `GET /research-documents/:id/download`
2. Backend verifies authorization (role + project membership)
3. Storage provider generates a signed URL (60-minute expiry)
4. Signed URL is returned to client
5. Client redirects to signed URL to download

## Supported File Types

- PDF (`.pdf`)
- Word (`.doc`, `.docx`)
- Excel (`.xls`, `.xlsx`)
- PowerPoint (`.ppt`, `.pptx`)
- CSV (`.csv`)
- Text (`.txt`)
- Images (`.png`, `.jpg`, `.jpeg`, `.gif`)
- Archive (`.zip`)
- Markdown (`.md`)

## File Size Limits

Default maximum: **100 MB** (configurable in service code)

## Secure File Naming

Original filenames are never used as storage keys. Instead:
- A UUID is generated for each file
- The original extension is preserved
- The original filename is stored as metadata only
- Path traversal characters are stripped

## Version Management

Each document upload creates a version record:
- Version 1 is created with the initial document
- Subsequent uploads increment the version number
- All versions are stored independently
- Version metadata includes file size, MIME type, checksum, and change description

## Authorization Rules

| Role | Create | Read | Download | Update | Delete | Archive |
|------|--------|------|----------|--------|--------|---------|
| ADMIN | Yes | All | All | All | All | All |
| COORDINATOR | Yes | Project | Project | Project | DRAFT | Project |
| RESEARCHER | Yes | Own/Project | Own/Project | Own DRAFT/REJECTED | Own DRAFT | Own |
| TECHNICIAN | No | All | All | No | No | No |

## Audit Logging

The following actions are logged:
- `CREATE` — Document created with file upload
- `UPDATE` — Document metadata updated
- `VERSION_UPLOAD` — New version uploaded
- `DOWNLOAD` — Document download URL generated
- `ARCHIVE` — Document archived
- `DELETE` — Document deleted
- `STATUS_CHANGE` — Document status changed

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/research-documents` | Create document with file upload | ADMIN, COORDINATOR, RESEARCHER |
| GET | `/research-documents` | List documents (paginated, filtered) | All roles |
| GET | `/research-documents/my` | Current user's documents | ADMIN, COORDINATOR, RESEARCHER |
| GET | `/research-documents/summary` | Document statistics | All roles |
| GET | `/research-documents/:id` | Get document details | All roles |
| GET | `/research-documents/:id/versions` | Get version history | All roles |
| GET | `/research-documents/:id/download` | Get signed download URL | All roles |
| PATCH | `/research-documents/:id` | Update document metadata | ADMIN, COORDINATOR, RESEARCHER |
| PATCH | `/research-documents/:id/status` | Change document status | ADMIN, COORDINATOR, RESEARCHER |
| PATCH | `/research-documents/:id/archive` | Archive document | ADMIN, COORDINATOR, RESEARCHER |
| POST | `/research-documents/:id/versions` | Upload new version | ADMIN, COORDINATOR, RESEARCHER |
| DELETE | `/research-documents/:id` | Delete document (DRAFT only) | ADMIN, COORDINATOR, RESEARCHER |

## Deployment

### Development

```env
STORAGE_PROVIDER=local
LOCAL_STORAGE_DIR=./storage
```

### Production (Supabase)

```env
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
STORAGE_BUCKET=research-documents
```

Create the storage bucket in Supabase Dashboard:
1. Go to Storage
2. Create new bucket: `research-documents`
3. Set bucket to private (not public)

## Troubleshooting

### "Supabase storage is not configured"
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Or switch to `STORAGE_PROVIDER=local`

### "File upload failed"
- Check file size against limit
- Check file type against allowlist
- Check storage provider availability

### "Signed URL generation failed"
- Verify storage bucket exists
- Verify service role key has proper permissions
- Check storage provider logs
