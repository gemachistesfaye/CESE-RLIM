# Global Search & Discovery Management

## Overview
The Global Search system provides a unified, platform-wide search interface across all entity types in the CESE-RLIM platform. Users can search from the header bar (autocomplete suggestions) or navigate to the dedicated `/search` page for full results with filtering and pagination.

## Architecture

### Backend (`apps/api/src/global-search/`)
- **DTO**: `dto/global-search.dto.ts` — Validation for search and suggestion query parameters
- **Service**: `global-search.service.ts` — Core search logic across 15 entity types using ILIKE queries
- **Controller**: `global-search.controller.ts` — REST endpoints for search and suggestions
- **Module**: `global-search.module.ts` — NestJS module registration

### Frontend (`apps/web/src/`)
- **Hook**: `hooks/useGlobalSearch.ts` — TanStack Query hooks for search + suggestions
- **Components**: `components/global-search/`
  - `HeaderSearch.tsx` — Header autocomplete with debounced suggestions, keyboard navigation, recent searches
  - `SearchResultItem.tsx` — Search result card with entity type badge and icon
  - `SearchFilters.tsx` — Entity type filter tabs and sort selector
- **Page**: `pages/search/GlobalSearchPage.tsx` — Dedicated search results page
- **Route**: Added `/search` route to `router.tsx`
- **Layout**: Updated `AppLayout.tsx` header to use functional `HeaderSearch` component

## API Endpoints

### `GET /api/v1/global-search`
Search across all platform entities.

**Query Parameters:**
| Param   | Type   | Default    | Description                    |
|---------|--------|------------|--------------------------------|
| `q`     | string | (required) | Search query (min 1 char)      |
| `page`  | number | 1          | Page number                    |
| `limit` | number | 20         | Results per page (max 50)      |
| `type`  | string | ALL        | Entity type filter             |
| `sort`  | string | relevance  | Sort by: `relevance` or `recent` |

**Entity Types:** `ALL`, `RESEARCHER`, `LABORATORY`, `EQUIPMENT`, `PROJECT`, `INNOVATION`, `PUBLICATION`, `DOCUMENT`, `FUNDING`, `GRANT`, `RESEARCH_GRANT`, `ETHICS`, `EVENT`, `MILESTONE`, `REPORT`, `ACTIVITY`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "RESEARCHER",
        "title": "John Doe",
        "description": "Senior Researcher",
        "subtitle": "RESEARCHER-001",
        "status": "ACTIVE",
        "url": "/researchers/uuid",
        "metadata": {},
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  },
  "message": "Search results retrieved successfully"
}
```

### `GET /api/v1/global-search/suggestions`
Get autocomplete suggestions for the header search.

**Query Parameters:**
| Param   | Type   | Default    | Description                    |
|---------|--------|------------|--------------------------------|
| `q`     | string | (required) | Search query (min 2 chars)     |
| `limit` | number | 8          | Max suggestions                |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "RESEARCHER",
      "title": "John Doe",
      "subtitle": "RESEARCHER-001",
      "url": "/researchers/uuid"
    }
  ],
  "message": "Suggestions retrieved successfully"
}
```

## Searchable Entities

| Entity Type     | Table        | Search Fields                              | URL Pattern                    |
|-----------------|--------------|--------------------------------------------|--------------------------------|
| Researcher      | Researcher   | firstName, lastName, code, specialization  | /researchers/:id               |
| Laboratory      | Laboratory   | name, code, description                    | /laboratories/:id              |
| Equipment       | Equipment    | name, code, model, manufacturer            | /equipment/:id                 |
| Project         | ResearchProject | title, code, description               | /research-projects/:id         |
| Innovation      | Innovation   | title, code, description                   | /innovations/:id               |
| Publication     | ResearchPublication | title, authors, journal, doi      | /research-publications/:id     |
| Document        | ResearchDocument | title, description, file_name         | /research-documents/:id        |
| Funding         | FundingOpportunity | title, description, source         | /funding-opportunities/:id     |
| Grant           | GrantApplication | title, description                    | /grant-applications/:id        |
| Research Grant  | ResearchGrant | title, amount                              | /research-grants/:id           |
| Ethics          | EthicsApplication | title, description, protocol_number | /ethics/applications/:id      |
| Event           | ResearchEvent | title, description                        | /research-events/:id           |
| Milestone       | ResearchMilestone | title, description                    | /research-milestones/:id       |
| Report          | ResearchReport | title, description                       | /research-reports/:id          |
| Activity        | ProjectActivity | title, description                      | /project-activities/:id        |

## Frontend Features

### Header Search (Autocomplete)
- **Ctrl+K / Cmd+K** keyboard shortcut to focus search
- Debounced suggestions (300ms) after 2+ characters
- Recent searches stored in localStorage (up to 8)
- Arrow key navigation through suggestions
- Enter to select suggestion or submit search
- Escape to close dropdown
- Click outside to close

### Search Page (`/search`)
- Full-page search with URL query parameter `?q=...`
- Entity type filter tabs (All, Researchers, Projects, etc.)
- Sort by relevance or most recent
- Paginated results (20 per page)
- Click result to navigate to entity detail page

## Access Control
All authenticated users (ADMIN, COORDINATOR, RESEARCHER, TECHNICIAN) can access search endpoints. Results are not filtered by role — all publicly stored entities are searchable.

## Performance Considerations
- Search uses PostgreSQL ILIKE queries with wildcards (`%query%`)
- Indexes on searchable columns recommended for large datasets
- Suggestions limited to 8 results, search limited to 50 per page
- Frontend uses TanStack Query with 30s stale time for search, 60s for suggestions
- No audit logging of search queries (per spec)
