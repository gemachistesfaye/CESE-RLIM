# Research Documents, Reports & Publications Management

## 1. Module Overview

This module provides a complete research document and publication management system for the CESE-RLIM platform. It allows authorized users to upload, manage, version, and track research documents and publications associated with research projects and researchers.

## 2. Database Models

### ResearchDocument
- `id` - UUID primary key
- `researchProjectId` - Optional FK to ResearchProject
- `uploadedById` - FK to User
- `title` - Document title
- `description` - Optional description
- `documentType` - DocumentType enum
- `fileName` - Original file name
- `filePath` - File path on disk/storage
- `storageKey` - Unique storage key (UUID-based for security)
- `mimeType` - MIME type
- `fileSize` - File size in bytes
- `version` - Current version number
- `status` - DocumentStatus enum
- `archivedAt` - Optional archive timestamp
- `createdAt` / `updatedAt` - Timestamps

### ResearchDocumentVersion
- `id` - UUID primary key
- `documentId` - FK to ResearchDocument
- `versionNumber` - Version number (unique per document)
- `fileName` - File name for this version
- `filePath` - File path for this version
- `storageKey` - Unique storage key
- `mimeType` - MIME type
- `fileSize` - File size in bytes
- `uploadedById` - FK to User
- `changeDescription` - Optional description of changes
- `createdAt` - Timestamp

### ResearchPublication
- `id` - UUID primary key
- `researchProjectId` - Optional FK to ResearchProject
- `title` - Publication title
- `abstract` - Optional abstract
- `publicationType` - PublicationType enum
- `journalName` - Optional (for journal articles)
- `conferenceName` - Optional (for conference papers)
- `publisher` - Optional publisher
- `doi` - Optional unique DOI
- `isbn` - Optional ISBN
- `publicationDate` - Optional publication date
- `url` - Optional URL
- `status` - PublicationStatus enum
- `citationCount` - Optional citation count
- `createdById` - FK to User
- `createdAt` / `updatedAt` - Timestamps

### PublicationAuthor
- `id` - UUID primary key
- `publicationId` - FK to ResearchPublication
- `researcherId` - FK to Researcher
- `authorOrder` - Author ordering position
- `isCorrespondingAuthor` - Boolean flag
- `createdAt` - Timestamp

## 3. Relationships

- ResearchDocument → ResearchProject (optional, SetNull)
- ResearchDocument → User (uploadedBy, Restrict)
- ResearchDocument → ResearchDocumentVersion[] (Cascade)
- ResearchDocumentVersion → ResearchDocument (Cascade)
- ResearchDocumentVersion → User (uploadedBy, Restrict)
- ResearchPublication → ResearchProject (optional, SetNull)
- ResearchPublication → User (createdBy, Restrict)
- ResearchPublication → PublicationAuthor[] (Cascade)
- PublicationAuthor → ResearchPublication (Cascade)
- PublicationAuthor → Researcher (Cascade)
- User → ResearchDocument[] (uploadedDocuments)
- User → ResearchDocumentVersion[] (uploadedDocumentVersions)
- User → ResearchPublication[] (createdPublications)
- Researcher → PublicationAuthor[] (publicationAuthors)
- ResearchProject → ResearchDocument[] (documents)
- ResearchProject → ResearchPublication[] (publications)

## 4. Document Types

| Enum Value | Label |
|---|---|
| PROPOSAL | Proposal |
| RESEARCH_PLAN | Research Plan |
| PROGRESS_REPORT | Progress Report |
| FINAL_REPORT | Final Report |
| TECHNICAL_REPORT | Technical Report |
| DATASET | Dataset |
| PRESENTATION | Presentation |
| THESIS | Thesis |
| MANUSCRIPT | Manuscript |
| PAPER | Paper |
| OTHER | Other |

## 5. Document Statuses

| Enum Value | Label |
|---|---|
| DRAFT | Draft |
| SUBMITTED | Submitted |
| UNDER_REVIEW | Under Review |
| APPROVED | Approved |
| REJECTED | Rejected |
| PUBLISHED | Published |
| ARCHIVED | Archived |

### Document Status Lifecycle
```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → PUBLISHED
                              ↘ REJECTED → (can resubmit)
ARCHIVED (terminal, prevents normal modification)
```

## 6. Publication Types

| Enum Value | Label |
|---|---|
| JOURNAL_ARTICLE | Journal Article |
| CONFERENCE_PAPER | Conference Paper |
| BOOK | Book |
| BOOK_CHAPTER | Book Chapter |
| THESIS | Thesis |
| TECHNICAL_REPORT | Technical Report |
| WORKING_PAPER | Working Paper |
| PATENT | Patent |
| OTHER | Other |

## 7. Publication Statuses

| Enum Value | Label |
|---|---|
| DRAFT | Draft |
| SUBMITTED | Submitted |
| UNDER_REVIEW | Under Review |
| ACCEPTED | Accepted |
| PUBLISHED | Published |
| REJECTED | Rejected |

### Publication Status Lifecycle
```
DRAFT → SUBMITTED → UNDER_REVIEW → ACCEPTED → PUBLISHED
                              ↘ REJECTED → DRAFT (resubmit)
```

## 8. Versioning

Each document supports multiple versions:
- Creating a document creates version 1
- Uploading a new version increments the version number
- Previous versions are preserved and accessible
- Version numbers are unique per document
- Archived documents cannot accept new versions

## 9. API Endpoints

### Research Documents
| Method | Endpoint | Description |
|---|---|---|
| GET | /research-documents | List documents with pagination, search, filters |
| GET | /research-documents/summary | Document summary statistics |
| GET | /research-documents/my | Current user's documents |
| GET | /research-documents/:id | Get document details |
| POST | /research-documents | Create a new document |
| PATCH | /research-documents/:id | Update document metadata |
| PATCH | /research-documents/:id/status | Change document status |
| POST | /research-documents/:id/versions | Upload new version |
| GET | /research-documents/:id/versions | Get version history |
| GET | /research-documents/:id/download | Download document |
| PATCH | /research-documents/:id/archive | Archive document |

### Research Publications
| Method | Endpoint | Description |
|---|---|---|
| GET | /research-publications | List publications with pagination, search, filters |
| GET | /research-publications/summary | Publication summary statistics |
| GET | /research-publications/my | Current user's publications |
| GET | /research-publications/:id | Get publication details |
| POST | /research-publications | Create a new publication |
| PATCH | /research-publications/:id | Update publication |
| PATCH | /research-publications/:id/status | Change publication status |
| PATCH | /research-publications/:id/authors | Manage publication authors |

## 10. Authorization

| Role | Documents | Publications |
|---|---|---|
| ADMIN | Full access to all | Full access to all |
| COORDINATOR | Manage project documents | Full publication management |
| RESEARCHER | View project documents, upload to own projects | Create/update own publications |
| TECHNICIAN | View only (where project permissions allow) | No publication administration |

## 11. File Security

- Storage keys are UUID-based (never use original filename as path)
- File MIME types are validated
- File sizes are limited (100MB max)
- Private documents are protected by authorization
- Archived documents reject new version uploads
- No public file exposure

## 12. Audit Logging

### Document Events
| Action | Description |
|---|---|
| CREATE | Document created |
| UPDATE | Document metadata updated |
| VERSION_UPLOAD | New version uploaded |
| STATUS_CHANGE | Document status changed |
| DOWNLOAD | Document downloaded |
| ARCHIVE | Document archived |

### Publication Events
| Action | Description |
|---|---|
| CREATE | Publication created |
| UPDATE | Publication updated |
| STATUS_CHANGE | Publication status changed |
| AUTHOR_UPDATE | Publication authors modified |

## 13. Frontend Routes

| Route | Page |
|---|---|
| /research-documents | Research Documents List |
| /research-documents/:id | Research Document Details |
| /research-publications | Research Publications List |
| /research-publications/:id | Research Publication Details |

## 14. Frontend Components

### Hooks
- `useResearchDocuments` - List documents with pagination/filters
- `useResearchDocument` - Get single document
- `useResearchDocumentSummary` - Get summary statistics
- `useMyDocuments` - Get current user's documents
- `useCreateResearchDocument` - Create document mutation
- `useUpdateResearchDocument` - Update document mutation
- `useUploadDocumentVersion` - Upload new version mutation
- `useDocumentVersions` - Get version history
- `useUpdateDocumentStatus` - Change status mutation
- `useArchiveDocument` - Archive document mutation
- `useDownloadResearchDocument` - Download document
- `useResearchPublications` - List publications with pagination/filters
- `useResearchPublication` - Get single publication
- `useResearchPublicationSummary` - Get summary statistics
- `useMyPublications` - Get current user's publications
- `useCreateResearchPublication` - Create publication mutation
- `useUpdateResearchPublication` - Update publication mutation
- `useUpdatePublicationStatus` - Change status mutation
- `useManagePublicationAuthors` - Manage authors mutation

### Pages
- `ResearchDocumentsList` - Document list with search, filters, summary cards
- `ResearchDocumentDetails` - Document details with version history
- `ResearchPublicationsList` - Publication list with search, filters, summary cards
- `ResearchPublicationDetails` - Publication details with authors

### Forms
- `ResearchDocumentForm` - Create/edit document form
- `ResearchPublicationForm` - Create/edit publication form

## 15. Research Project Integration

The ResearchProjectDetails page includes:
- **Research Documents section** with summary cards (total, pending review, approved, published)
- **Publications section** with summary cards (total, under review, published, accepted)
- Links to view all documents and publications

## 16. Researcher Integration

The ResearcherProfile page includes:
- **Publications section** showing publications where the researcher is an author
- Each publication shows title, type, and status

## 17. Search & Filtering

### Documents
- Search: title, description, file name, project title, project code
- Filters: project, document type, status, uploaded by, date range
- Sort: any field, ascending/descending

### Publications
- Search: title, abstract, journal, conference, publisher, DOI
- Filters: project, researcher/author, type, status, year
- Sort: any field, ascending/descending

## 18. Pagination

Standard pagination format:
```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## 19. Testing

### Backend Tested
- Document CRUD operations
- Document version management
- Document status lifecycle
- Document archive
- Publication CRUD operations
- Publication status lifecycle
- Publication author management
- Summary endpoints
- Authorization checks

### Frontend Tested
- Document list page with search/filters
- Document details page with version history
- Publication list page with search/filters
- Publication details page with authors
- Research project integration
- Researcher profile integration

## 20. Build Results

- Prisma validation: PASSED
- Prisma generate: PASSED
- Backend build: PASSED
- Frontend build: PASSED

## 21. Migration Requirements

A database migration is required to create the new tables:
```bash
npx prisma migrate dev --name add_research_documents_publications
```

## 22. Remaining Issues

- File upload currently accepts metadata only (no actual file upload to storage)
- Download endpoint returns a placeholder URL
- Cloud/object storage integration can be added later without rewriting business logic
- Dashboard integration for document/publication statistics can be added when dashboard module is extended
