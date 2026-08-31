# System Administration, Roles, Permissions & Configuration Management

## Overview
The System Administration module provides a central administration area for managing roles, permissions, system configuration, and platform information. It builds on top of existing user management, audit logging, and health check functionality without duplicating them.

## Architecture

### Backend (`apps/api/src/administration/`)
- **DTOs**: `dto/system-settings.dto.ts` — Create/Update system setting DTOs with validation
- **Service**: `administration.service.ts` — Overview stats, settings CRUD, system info, health
- **Controller**: `administration.controller.ts` — REST endpoints with JWT + role guards
- **Module**: `administration.module.ts` — NestJS module registration

### Frontend (`apps/web/src/`)
- **Hook**: `hooks/useAdministration.ts` — TanStack Query hooks for all administration endpoints
- **Pages**: `pages/administration/`
  - `AdministrationDashboard.tsx` — Platform overview with stats, pending ops, user distribution, recent activity
  - `SystemSettings.tsx` — Settings management with categories, inline editing, create/delete
  - `RolePermissions.tsx` — Read-only permission matrix showing all role access levels
  - `SystemInformation.tsx` — Application info, health status, database connectivity
- **Routes**: `/administration`, `/administration/settings`, `/administration/permissions`, `/administration/system`
- **Sidebar**: Added ADMINISTRATION section (ADMIN/COORDINATOR only)

### Database Changes
Added `SystemSetting` model to Prisma schema:
```prisma
model SystemSetting {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String
  description String?
  category    String   @default("general")
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  updatedById String?
  updatedBy   User?    @relation(fields: [updatedById], references: [id], onDelete: SetNull)
  @@index([key])
  @@index([category])
}
```

Migration applied: `20260831192521_add_system_administration`

## API Endpoints

### `GET /api/v1/administration/overview`
Returns platform-wide statistics (ADMIN/COORDINATOR only):
- Users (total, active, inactive, by role)
- Researchers, laboratories, equipment, projects, publications, documents, innovations
- Pending operations (ethics, equipment requests, grant applications)
- Active grants
- Recent admin activity (from audit logs)

### `GET /api/v1/administration/system-info`
Returns safe system information:
- Application name, version, environment
- API version, Node.js version
- Server time, uptime

### `GET /api/v1/administration/health`
Returns system health status:
- Overall status (healthy/degraded)
- Database connectivity
- API status
- Timestamp

### `GET /api/v1/administration/settings`
Returns all system settings (ADMIN/COORDINATOR only).

### `GET /api/v1/administration/settings/public`
Returns public settings (no auth required).

### `GET /api/v1/administration/settings/:key`
Returns a specific setting by key (ADMIN/COORDINATOR only).

### `POST /api/v1/administration/settings`
Creates a new system setting (ADMIN only).

### `PATCH /api/v1/administration/settings/:key`
Updates a system setting (ADMIN only). Generates audit log.

### `DELETE /api/v1/administration/settings/:key`
Deletes a system setting (ADMIN only). Generates audit log.

## Existing Endpoints Reused

### User Management (existing `UsersModule`)
- `PATCH /users/:id/role` — Change user role (ADMIN only)
- `PATCH /users/:id/status` — Activate/deactivate user (ADMIN/COORDINATOR)

### Health Check (existing `HealthModule`)
- `GET /health` — Public health check endpoint

## Authorization Matrix

| Endpoint | ADMIN | COORDINATOR | RESEARCHER | TECHNICIAN |
|----------|:-----:|:-----------:|:----------:|:----------:|
| Overview | Yes | Yes | No | No |
| System Info | Yes | Yes | No | No |
| Health | Yes | Yes | No | No |
| Settings (list) | Yes | Yes | No | No |
| Settings (get) | Yes | Yes | No | No |
| Settings (create) | Yes | No | No | No |
| Settings (update) | Yes | No | No | No |
| Settings (delete) | Yes | No | No | No |
| Public Settings | Yes | Yes | Yes | Yes |

## Frontend Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/administration` | AdministrationDashboard | ADMIN, COORDINATOR |
| `/administration/settings` | SystemSettings | ADMIN only |
| `/administration/permissions` | RolePermissions | ADMIN only |
| `/administration/system` | SystemInformation | ADMIN, COORDINATOR |

## Sidebar Navigation

```
ADMINISTRATION
├── Overview (ADMIN, COORDINATOR)
├── System Settings (ADMIN)
├── Roles & Permissions (ADMIN)
└── System Information (ADMIN, COORDINATOR)
```

## System Settings Categories

### General
- `organization_name` — Organization full name
- `organization_short_name` — Short name/abbreviation
- `organization_email` — Contact email
- `organization_phone` — Contact phone

### Research
- `default_project_duration` — Default project duration in months
- `ethics_review_deadline_days` — Ethics review deadline

### Equipment
- `equipment_request_expiry_days` — Request expiry period
- `maintenance_reminder_days` — Maintenance reminder lead time

### Finance
- `expense_review_deadline_days` — Expense review deadline

### Documents
- `maximum_document_size_mb` — Max upload file size

## Security Measures

- JWT authentication required on all administration endpoints
- Role-based authorization enforced by backend (ADMIN for mutations, ADMIN+COORDINATOR for reads)
- Self-role escalation prevention (existing in UsersService)
- Last admin protection (existing in UsersService)
- System settings validated with class-validator
- No secrets stored in SystemSetting model
- Audit logging for all setting changes
- Metadata sanitized to redact sensitive fields

## Audit Integration

All administrative changes generate audit events:
- Setting creation → `CREATE` on `SystemSetting`
- Setting update → `UPDATE` on `SystemSetting` (includes previous/new values)
- Setting deletion → `DELETE` on `SystemSetting`
- Role changes → `UPDATE` on `User` (existing)
- Status changes → `STATUS_CHANGE` on `User` (existing)

## Existing Modules Reused

| Module | Reuse |
|--------|-------|
| UsersModule | Role/status management endpoints |
| AuditModule | Audit logging for all changes |
| PrismaModule | Database queries |
| HealthModule | Health check endpoint |

## Build Verification

- Prisma schema: valid
- Prisma migration: applied successfully
- Prisma generate: completed
- Backend TypeScript: compiles cleanly (0 errors)
- Frontend TypeScript: compiles cleanly from new code (pre-existing errors in research-events/research-finance only)
