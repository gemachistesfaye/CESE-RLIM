# Audit Logs & System Activity Management

## Overview
The Audit Logs module provides a professional management layer on top of the existing audit logging system. It enables administrators and coordinators to search, filter, inspect, and understand system-wide activity across all platform modules.

The existing audit logging (fire-and-forget `AuditService.log()` calls in 18+ domain modules) remains untouched. This module only adds query/read capabilities.

## Architecture

### Backend (`apps/api/src/audit-logs/`)
- **DTO**: `dto/audit-log-query.dto.ts` — Validated query parameters for search, filter, pagination, sorting
- **Service**: `audit-logs.service.ts` — Query methods with Prisma aggregation for summary statistics
- **Controller**: `audit-logs.controller.ts` — REST endpoints with JWT + role guards
- **Module**: `audit-logs.module.ts` — NestJS module registration

### Existing Audit System (`apps/api/src/audit/`)
- **Service**: `audit.service.ts` — Fire-and-forget `log()` method used by 18+ domain modules
- **Module**: `audit.module.ts` — Imported by all feature modules that create audit records

### Frontend (`apps/web/src/`)
- **Hook**: `hooks/useAuditLogs.ts` — TanStack Query hooks for all audit endpoints
- **Pages**: `pages/audit-logs/`
  - `AuditLogsList.tsx` — List page with summary cards, search, filters, table
  - `AuditLogDetails.tsx` — Detail page with metadata viewer
- **Route**: Added `/audit-logs` and `/audit-logs/:id` to `router.tsx`
- **Sidebar**: Added "Audit Logs" nav item (ADMIN/COORDINATOR only)

## Prisma Schema

No schema changes required. The existing `AuditLog` model already has all necessary fields and indexes:

```prisma
model AuditLog {
  id          String      @id @default(uuid())
  userId      String?     @map("user_id")
  action      AuditAction
  entityType  String      @map("entity_type")
  entityId    String?     @map("entity_id")
  description String?
  metadata    Json?
  ipAddress   String?     @map("ip_address")
  userAgent   String?     @map("user_agent")
  createdAt   DateTime    @default(now()) @map("created_at")
  user        User?       @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([entityType])
  @@index([entityId])
  @@index([action])
  @@index([createdAt])
}
```

**Existing indexes (5):** userId, entityType, entityId, action, createdAt — covering all common query patterns.

## API Endpoints

### `GET /api/v1/audit-logs`
List all audit logs with filtering and pagination.

**Query Parameters:**
| Param     | Type   | Default    | Description                    |
|-----------|--------|------------|--------------------------------|
| `page`    | number | 1          | Page number                    |
| `limit`   | number | 20         | Results per page (max 100)     |
| `search`  | string | —          | Search descriptions, entities, users |
| `userId`  | string | —          | Filter by user ID              |
| `action`  | string | —          | Filter by AuditAction enum     |
| `entityType` | string | —       | Filter by entity type          |
| `entityId`| string | —          | Filter by entity ID            |
| `startDate` | string | —        | ISO date, filter from          |
| `endDate` | string | —          | ISO date, filter to            |
| `sortBy`  | string | createdAt  | Sort field: createdAt, action, entityType |
| `sortOrder` | string | desc     | Sort direction: asc, desc      |

### `GET /api/v1/audit-logs/summary`
Returns administrative statistics (ADMIN/COORDINATOR only).

**Response includes:**
- totalEvents, todayEvents, weekEvents, monthEvents
- actionsByType (grouped count)
- entityByType (top 10)
- recentActivity (last 10 events)

### `GET /api/v1/audit-logs/user/:userId`
Activity performed by a specific user. Supports pagination, date filtering, action filtering.

### `GET /api/v1/audit-logs/entity/:entityType/:entityId`
Complete audit history of a specific entity. Supports pagination, date filtering, sorting.

### `GET /api/v1/audit-logs/:id`
Detailed audit log record with sanitized metadata.

## Authorization

| Action               | ADMIN | COORDINATOR | RESEARCHER | TECHNICIAN |
|----------------------|:-----:|:-----------:|:----------:|:----------:|
| View all audit logs  |  Yes  |     Yes     |     No     |     No     |
| View audit details   |  Yes  |     Yes     |     No     |     No     |
| View user activity   |  Yes  |     Yes     |     No     |     No     |
| View entity activity |  Yes  |     Yes     |     No     |     No     |
| View audit summary   |  Yes  |     Yes     |     No     |     No     |

## Frontend Routes

| Route              | Component        | Access           |
|--------------------|------------------|------------------|
| `/audit-logs`      | AuditLogsList    | ADMIN, COORDINATOR |
| `/audit-logs/:id`  | AuditLogDetails  | ADMIN, COORDINATOR |

## Sidebar Navigation

Added under SYSTEM section:
```
SYSTEM
├── Users (ADMIN, COORDINATOR)
├── Notifications (All)
└── Audit Logs (ADMIN, COORDINATOR)
```

## Features

### Audit Logs List Page (`/audit-logs`)
- **Summary cards**: Total Events, Today, This Week, This Month
- **Search**: Search descriptions, entity types, entity IDs, user names/emails
- **Filters**: Action type, Entity type, Date From, Date To
- **Sorting**: Newest/Oldest, Action A-Z/Z-A, Entity A-Z
- **Table**: Timestamp, User, Action, Entity Type, Entity ID, Description
- **Pagination**: Server-side with page controls

### Audit Log Details Page (`/audit-logs/:id`)
- **Event Information**: Action, Timestamp, User (with email/role), Entity Type, Entity ID
- **Entity Navigation**: External link to navigate to the related entity
- **Metadata Viewer**: Structured display of all metadata (sensitive values redacted)
- **IP Address & User Agent** display
- **Back navigation** to list

## Security Measures

- JWT authentication required on all endpoints
- Role-based authorization enforced by backend (ADMIN/COORDINATOR only)
- Metadata sanitized to redact sensitive fields (passwords, tokens, secrets, API keys, JWT, credentials)
- No arbitrary Prisma filtering from user input
- Validated query parameters with class-validator
- No secret/token exposure in responses

## Existing Audit Integrations

The following modules already create audit records via `AuditService.log()`:

| Module | Actions Logged |
|--------|---------------|
| Users | CREATE, UPDATE (profile, role, status) |
| Laboratories | CREATE, UPDATE |
| Equipment | CREATE, UPDATE, STATUS_CHANGE |
| Equipment Requests | CREATE, APPROVE/REJECT, UPDATE |
| Equipment Assignments | ISSUE, RETURN |
| Maintenance | CREATE, UPDATE, STATUS_CHANGE |
| Research Projects | CREATE, UPDATE |
| Project Activities | CREATE, UPDATE, STATUS_CHANGE, PROGRESS_UPDATE, DELETE |
| Innovations | CREATE, UPDATE |
| Research Publications | CREATE, UPDATE, STATUS_CHANGE, AUTHOR_UPDATE, DELETE |
| Research Documents | CREATE, UPDATE, DOWNLOAD, STATUS_CHANGE, ARCHIVE, VERSION_UPLOAD, DELETE |
| Funding Opportunities | CREATE, UPDATE, STATUS_CHANGE, DELETE |
| Grant Applications | CREATE, UPDATE, STATUS_CHANGE, APPROVE/REJECT, WITHDRAW |
| Research Grants | CREATE, UPDATE, STATUS_CHANGE, SPENDING_UPDATE |
| Research Expenses | CREATE, UPDATE, SUBMIT, APPROVE/REJECT, STATUS_CHANGE |
| Ethics | CREATE, UPDATE, SUBMIT, WITHDRAW, APPROVE/REJECT, REQUEST_REVISION, ASSIGN_REVIEWER |
| Research Events | CREATE, UPDATE, STATUS_CHANGE |
| Event Participations | CREATE, STATUS_CHANGE |
| Budget Allocations | CREATE, UPDATE, DELETE |
| Research Milestones | CREATE, UPDATE, STATUS_CHANGE, PROGRESS_UPDATE, DELETE |
| Research Reports | CREATE, UPDATE, STATUS_CHANGE, DELETE |

## Build Verification

- Prisma schema: valid
- Backend TypeScript: compiles cleanly (no errors)
- Frontend TypeScript: compiles cleanly (pre-existing errors in research-events/research-finance modules only)
