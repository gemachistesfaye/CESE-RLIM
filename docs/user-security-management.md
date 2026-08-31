# Security, User Management & Access Control

## Overview
The Security, User Management & Access Control module provides administrators with professional tools for managing users, roles, account status, permissions, security activity, and access control. It builds on top of the existing authentication architecture without duplicating it.

## Architecture

### Database Changes
Added `UserStatus` enum and `status` field to User model:
```prisma
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model User {
  // ... existing fields ...
  status  UserStatus @default(ACTIVE)
  // ...
}
```

Migration: `add_user_security_management`

### Backend (`apps/api/src/user-management/`)
- **DTOs**: `dto/user-management.dto.ts` — Query, status update, password reset DTOs
- **Service**: `user-management.service.ts` — User list, details, status management, password reset, activity, summary, security summary
- **Controller**: `user-management.controller.ts` — 7 REST endpoints
- **Module**: `user-management.module.ts` — Module registration

### Frontend (`apps/web/src/`)
- **Hook**: `hooks/useUserManagement.ts` — TanStack Query hooks for all user management endpoints
- **Page**: `pages/user-management/SecurityDashboard.tsx` — Security overview with stats, recent logins, status changes, activity
- **Route**: `/administration/security`
- **Sidebar**: Added "Security" link in ADMINISTRATION section (ADMIN only)

## API Endpoints

### `GET /api/v1/user-management/users`
List users with search, filter, pagination (ADMIN only).

**Query Parameters:**
| Param    | Type   | Default | Description           |
|----------|--------|---------|-----------------------|
| `page`   | number | 1       | Page number           |
| `limit`  | number | 20      | Results per page      |
| `search` | string | —       | Name/email/phone search |
| `role`   | string | —       | Filter by role        |
| `status` | string | —       | Filter by status      |

### `GET /api/v1/user-management/users/:id`
Get user details with researcher profile, counts, and activity (ADMIN only).

### `PATCH /api/v1/user-management/users/:id/status`
Update user account status (ADMIN only).

**Body:**
```json
{ "status": "ACTIVE" | "INACTIVE" | "SUSPENDED" }
```

**Rules:**
- Cannot change your own status
- Cannot suspend/deactivate the last active admin
- Generates audit log
- Sends notification to affected user

### `PATCH /api/v1/user-management/users/:id/reset-password`
Reset user password (ADMIN only).

**Body:**
```json
{ "password": "newPassword123" }
```

**Rules:**
- Password hashed with bcrypt (10 rounds)
- Generates audit log
- Sends notification to affected user

### `GET /api/v1/user-management/users/:id/activity`
Get user's audit activity with pagination (ADMIN only).

### `GET /api/v1/user-management/summary`
Get user statistics (ADMIN only).

**Returns:**
- totalUsers, activeUsers, inactiveUsers, suspendedUsers
- admins, coordinators, researchers, technicians
- recentRegistrations (last 30 days)

### `GET /api/v1/user-management/security-summary`
Get security overview (ADMIN only).

**Returns:**
- User counts by status
- Admin count
- Recent role changes
- Recent status changes
- Recent logins
- Recent activity

## Authorization Matrix

| Action                | ADMIN | COORDINATOR | RESEARCHER | TECHNICIAN |
|-----------------------|:-----:|:-----------:|:----------:|:----------:|
| View users            |  Yes  |     No      |     No     |     No     |
| View user details     |  Yes  |     No      |     No     |     No     |
| Update user status    |  Yes  |     No      |     No     |     No     |
| Reset user password   |  Yes  |     No      |     No     |     No     |
| View user activity    |  Yes  |     No      |     No     |     No     |
| View security summary |  Yes  |     No      |     No     |     No     |

**Note:** The existing `GET /users` and `GET /users/:id` endpoints still allow COORDINATOR access. The new `user-management` endpoints are ADMIN-only for enhanced security operations.

## User Lifecycle

### Account Status Transitions
```
ACTIVE → INACTIVE (deactivation)
ACTIVE → SUSPENDED (suspension)
INACTIVE → ACTIVE (re-activation)
SUSPENDED → ACTIVE (re-activation)
```

### Security Rules
1. **Self-protection**: Users cannot change their own status
2. **Last admin protection**: Cannot deactivate/suspend the last active admin
3. **Password security**: Passwords hashed with bcrypt, never exposed in API responses
4. **Audit trail**: All status changes, password resets, and role changes are logged
5. **Notifications**: Affected users receive notifications for account changes

## Frontend Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/administration/security` | SecurityDashboard | ADMIN |

## Sidebar Navigation

```
ADMINISTRATION
├── Overview (ADMIN, COORDINATOR)
├── Security (ADMIN)
├── System Settings (ADMIN)
├── Roles & Permissions (ADMIN)
└── System Information (ADMIN, COORDINATOR)
```

## Security Features

### Authentication Checks
- JWT validation on every request
- `isActive` check in JWT strategy
- `status` check in JWT strategy (SUSPENDED users blocked)
- Status check in login flow

### Authorization Enforcement
- Backend role guards on all endpoints
- Frontend visibility is not a security boundary
- All mutations require ADMIN role

### Data Protection
- Passwords never returned in API responses
- `passwordHash` excluded from all user queries
- No sensitive authentication data exposed
- Audit metadata excludes secrets

### Audit Logging
All administrative actions generate audit events:
- Status changes → `STATUS_CHANGE` action
- Password resets → `UPDATE` action
- Role changes → `UPDATE` action (existing)

### Notifications
Users receive notifications for:
- Account activation
- Account deactivation
- Account suspension
- Password reset

## Existing Integration

### Reused Modules
| Module | Usage |
|--------|-------|
| UsersModule | Existing CRUD, role management |
| AuditModule | Audit logging for all changes |
| NotificationsModule | User notifications |
| PrismaModule | Database queries |
| AuthModule | JWT strategy, guards |

### Existing Endpoints Preserved
- `GET /users` — Still works with existing COORDINATOR access
- `GET /users/:id` — Still works
- `POST /users` — Still works for user creation
- `PATCH /users/:id` — Still works for profile updates
- `PATCH /users/:id/role` — Still works for role changes
- `PATCH /users/:id/status` — Still works (boolean isActive)

## Build Verification

- Prisma schema: valid
- Prisma migration: applied successfully (`add_user_security_management`)
- Prisma generate: completed
- Backend TypeScript: compiles cleanly (0 errors)
- Frontend TypeScript: compiles cleanly from new code
