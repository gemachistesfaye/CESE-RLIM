# Notifications & Alerts Management

## Overview

The Notifications & Alerts system provides centralized in-app notification management for the CESE-RLIM platform. Notifications are generated automatically from backend business events and actions, not from the frontend.

## Architecture

### Backend

```
apps/api/src/notifications/
├── notifications.module.ts
├── notifications.service.ts
├── notifications.controller.ts
└── dto/
    └── notification-query.dto.ts
```

- **Module**: `NotificationsModule` - imports `PrismaModule` and `AuthModule`
- **Service**: `NotificationsService` - handles notification CRUD, user lookups, role-based queries
- **Controller**: `NotificationsController` - REST API endpoints with JWT authentication

### Frontend

```
apps/web/src/hooks/useNotifications.ts    - TanStack Query hooks
apps/web/src/pages/notifications/         - NotificationsList page
apps/web/src/layouts/AppLayout.tsx         - Notification bell with dropdown
```

## Database Schema

### NotificationType Enum

```
INFO, WARNING, SUCCESS, ERROR, REQUEST, MAINTENANCE,
ACTION_REQUIRED, ASSIGNMENT, STATUS_CHANGE, DEADLINE
```

### Notification Model

| Field      | Type             | Description                          |
|------------|------------------|--------------------------------------|
| id         | UUID             | Primary key                          |
| userId     | String (FK)      | Owner user ID                        |
| title      | String           | Notification title                   |
| message    | String           | Notification message                 |
| type       | NotificationType | Notification category                |
| entityType | String?          | Related entity type (e.g., "EquipmentRequest") |
| entityId   | String?          | Related entity ID                    |
| isRead     | Boolean          | Read status                          |
| createdAt  | DateTime         | Creation timestamp                   |
| readAt     | DateTime?        | When marked as read                  |
| updatedAt  | DateTime         | Last update timestamp                |

### Indexes

- `(userId)` - Primary user lookup
- `(userId, isRead)` - Unread notifications per user
- `(userId, createdAt)` - User notifications by date
- `(entityType, entityId)` - Entity-based lookups
- `(createdAt)` - Global date ordering

## API Endpoints

### Get Notifications
```
GET /notifications?page=1&limit=20&unreadOnly=true&type=ACTION_REQUIRED
```
JWT required. Returns paginated notifications for the authenticated user.

### Get Unread Count
```
GET /notifications/unread-count
```
Returns `{ count: number }`.

### Get Notification by ID
```
GET /notifications/:id
```
Only the notification owner can access it.

### Mark as Read
```
PATCH /notifications/:id/read
```
Only the owner can modify.

### Mark All as Read
```
PATCH /notifications/read-all
```
Marks all user's notifications as read.

### Delete Notification
```
DELETE /notifications/:id
```
Only the owner can delete.

## Notification Types

| Type             | Description                        | Priority |
|------------------|------------------------------------|----------|
| INFO             | General information                | Normal   |
| WARNING          | Warnings, approaching deadlines    | Important|
| SUCCESS          | Approvals, completions             | Normal   |
| ERROR            | Errors, failures                   | Critical |
| ACTION_REQUIRED  | Items needing user action          | Critical |
| ASSIGNMENT       | New assignments                    | Important|
| STATUS_CHANGE    | Status transitions                 | Normal   |
| DEADLINE         | Deadline reminders                 | Important|
| REQUEST          | New requests                       | Normal   |
| MAINTENANCE      | Maintenance-related                | Normal   |

## Business Workflows Integrated

### Equipment Requests
- **Created**: Notify ADMIN + COORDINATOR (ACTION_REQUIRED)
- **Approved**: Notify requester (SUCCESS)
- **Rejected**: Notify requester (WARNING)
- **Cancelled**: Notify ADMIN + COORDINATOR (INFO)

### Equipment Assignments
- **Assigned**: Notify researcher (SUCCESS)

### Maintenance
- **Created + Assigned**: Notify technician (ASSIGNMENT)
- **Status Changed**: Notify reporter (STATUS_CHANGE)
- **Completed**: Notify reporter (SUCCESS)

### Research Projects
- **Created**: Notify ADMIN + COORDINATOR (INFO)
- **Status Changed**: Notify project members (STATUS_CHANGE)

### Project Activities
- **Created + Assigned**: Notify assigned member (ASSIGNMENT), project members (INFO)
- **Status Changed**: Notify project members (STATUS_CHANGE)
- **Cancelled**: Notify assigned member (WARNING)

### Innovations
- **Submitted**: Notify ADMIN + COORDINATOR (INFO)
- **Approved/Rejected/Status Change**: Notify submitter (SUCCESS/WARNING/STATUS_CHANGE)

### Publications
- **Accepted**: Notify all authors (SUCCESS)
- **Rejected**: Notify all authors (WARNING)
- **Published**: Notify all authors (SUCCESS)

### Grant Applications
- **Submitted**: Notify ADMIN + COORDINATOR (ACTION_REQUIRED)
- **Approved/Rejected**: Notify applicant (SUCCESS/WARNING)
- **Withdrawn**: Notify ADMIN + COORDINATOR (INFO)

### Research Expenses
- **Submitted**: Notify ADMIN + COORDINATOR (ACTION_REQUIRED)
- **Approved/Rejected**: Notify submitter (SUCCESS/WARNING)
- **Recorded**: Notify submitter (SUCCESS)

### Ethics Applications
- **Submitted**: Notify ADMIN + COORDINATOR (ACTION_REQUIRED)
- **Resubmitted**: Notify assigned reviewers (ACTION_REQUIRED)
- **Approved/Rejected/Revision Required**: Notify applicant (SUCCESS/WARNING/ACTION_REQUIRED)
- **Reviewer Assigned**: Notify reviewer + applicant (ASSIGNMENT)

### Research Events
- **Published**: Notify all researchers (INFO)
- **Cancelled**: Notify registered participants (WARNING)
- **Completed**: Notify registered participants (SUCCESS)

### Milestones
- **Created + Assigned**: Notify responsible member (ASSIGNMENT)
- **Completed/Blocked/In Progress**: Notify project members + responsible member (SUCCESS/WARNING/STATUS_CHANGE)

### Reports
- **Submitted**: Notify project members (INFO)
- **Submitted for Review**: Notify reviewer (ACTION_REQUIRED), project members (INFO)
- **Approved/Revision Required/Rejected**: Notify author (SUCCESS/ACTION_REQUIRED/WARNING)

## Deduplication Strategy

Notifications are created only from business events/actions, not from frontend rendering. Each notification is created once per event occurrence. The system does not prevent duplicate notifications across different events (e.g., multiple status changes will generate multiple notifications, which is expected behavior).

## Security

- JWT authentication required for all endpoints
- Users can only access their own notifications (ownership check in service)
- Role-based recipient selection for targeted notifications
- No sensitive internal information exposed in notification messages

## Frontend Integration

### Header Notification Bell
- Shows real unread count badge (auto-refreshes every 30 seconds)
- Dropdown with latest 5 unread notifications
- Click to mark as read and navigate to entity
- "View all notifications" link

### Sidebar Navigation
- Notifications link in SYSTEM section
- Visible to all authenticated users

### Dashboard
- Unread notification count card (clickable, navigates to /notifications)

### Notifications Page (`/notifications`)
- All notifications with pagination
- Unread filter
- Type filter
- Mark as read / Mark all as read
- Delete notification
- Click to navigate to related entity
- Loading skeleton, empty state, error state
- Responsive design

## Future Enhancements

- Email notifications
- Push notifications (Firebase/APNs)
- SMS notifications
- Background scheduler for overdue/deadline notifications
- Notification preferences per user
- Batch/bulk operations
- Notification categories/folders
