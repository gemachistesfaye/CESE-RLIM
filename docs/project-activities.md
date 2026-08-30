# Project Activities Module

## Overview

The Project Activities module enables research teams to manage tasks and activities within their research projects. It provides a structured way to create, assign, track, and report on project activities with proper role-based authorization.

## Database Model

### ProjectActivity

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| researchProjectId | String | Foreign key to ResearchProject |
| assignedMemberId | String? | Foreign key to ProjectMember (optional) |
| title | String | Activity title |
| description | String? | Activity description |
| priority | RequestPriority | LOW, MEDIUM, HIGH, URGENT |
| status | ActivityStatus | TODO, IN_PROGRESS, BLOCKED, COMPLETED, CANCELLED |
| startDate | DateTime? | Activity start date |
| dueDate | DateTime? | Activity due date |
| completedAt | DateTime? | Completion timestamp |
| progress | Int | Progress percentage (0-100) |
| notes | String? | Additional notes |
| createdById | String | Foreign key to User (creator) |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Enums

#### ActivityStatus
- `TODO` - Activity not started
- `IN_PROGRESS` - Activity in progress
- `BLOCKED` - Activity blocked
- `COMPLETED` - Activity completed
- `CANCELLED` - Activity cancelled

#### RequestPriority (reused)
- `LOW`
- `MEDIUM`
- `HIGH`
- `URGENT`

## API Endpoints

### GET /project-activities
List all activities with pagination, search, and filters.

**Query Parameters:**
- `page` (number) - Page number
- `limit` (number) - Items per page
- `search` (string) - Search in title, description, project, assignee
- `status` (ActivityStatus) - Filter by status
- `priority` (RequestPriority) - Filter by priority
- `researchProjectId` (string) - Filter by project
- `assignedMemberId` (string) - Filter by assigned member
- `overdue` (string) - Filter overdue activities ("true")
- `sortBy` (string) - Sort field
- `sortOrder` (asc/desc) - Sort order

### GET /project-activities/my
Get activities for the current authenticated user.

### GET /project-activities/overdue
Get overdue activities (ADMIN, COORDINATOR, RESEARCHER).

### GET /project-activities/summary
Get activity summary statistics.

**Query Parameters:**
- `researchProjectId` (string) - Optional project filter

### GET /project-activities/project/:projectId/stats
Get activity statistics for a specific project.

### GET /project-activities/:id
Get activity details by ID.

### POST /project-activities
Create a new activity.

**Authorization:** ADMIN, COORDINATOR, RESEARCHER (active project members only)

### PATCH /project-activities/:id
Update activity information.

### PATCH /project-activities/:id/status
Change activity status.

### PATCH /project-activities/:id/progress
Update activity progress.

### DELETE /project-activities/:id
Cancel an activity (soft delete via status change).

**Authorization:** ADMIN, COORDINATOR only

## Authorization Matrix

| Action | ADMIN | COORDINATOR | RESEARCHER | TECHNICIAN |
|--------|-------|-------------|------------|------------|
| View all activities | Yes | Yes | Own projects | Limited |
| Create activity | Yes | Yes | Active members | No |
| Update activity | Yes | Yes | Assigned/Created | No |
| Update status | Yes | Yes | Assigned | No |
| Update progress | Yes | Yes | Assigned | No |
| Cancel activity | Yes | Yes | No | No |
| View overdue | Yes | Yes | Own | No |

## Business Rules

### Status Lifecycle

```
TODO → IN_PROGRESS
TODO → CANCELLED

IN_PROGRESS → BLOCKED
IN_PROGRESS → COMPLETED
IN_PROGRESS → TODO
IN_PROGRESS → CANCELLED

BLOCKED → IN_PROGRESS
BLOCKED → CANCELLED

COMPLETED → IN_PROGRESS

CANCELLED → (terminal state)
```

### Progress Rules

| Status | Progress |
|--------|----------|
| TODO | Must be 0% |
| IN_PROGRESS | Must be 1-99% |
| COMPLETED | Must be 100% |
| BLOCKED | Preserve current |
| CANCELLED | No changes allowed |

### Assignment Rules

- Only active project members can be assigned
- Assigned member must belong to the same project
- Researchers can only update activities assigned to them or created by them

### Due Date Rules

- Due date cannot be before start date
- Overdue = dueDate < now AND status not in (COMPLETED, CANCELLED)

## Audit Logging

All mutations are audited with the following actions:

| Action | Description |
|--------|-------------|
| CREATE | Activity created |
| UPDATE | Activity updated |
| STATUS_CHANGE | Status changed |
| PROGRESS_UPDATE | Progress updated |
| DELETE | Activity cancelled |

## Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| /project-activities | ProjectActivitiesList | Activity list with filters |
| /project-activities/:id | ProjectActivityDetails | Activity details and actions |

## Frontend Components

### ProjectActivityForm
Form for creating and editing activities. Supports:
- Project selection
- Member assignment (filtered by project)
- Priority and status selection
- Date pickers
- Progress slider

### ProjectActivitiesList
List page with:
- Summary statistics cards
- Search and filters
- Responsive table
- Pagination
- Create activity modal

### ProjectActivityDetails
Details page with:
- Activity information
- Progress bar with update
- Status change buttons
- Edit modal
- Cancel confirmation

## Integration Points

### ResearchProjectDetails
- Shows activity statistics (total, completed, in progress, overdue, completion %)
- Link to view all activities

### ProjectTeamPage
- Activities accessible through project context

### ResearcherProfile
- Project memberships link to projects with activities

## Build Results

- Prisma validation: ✅ Passed
- Prisma generate: ✅ Passed
- Backend build: ✅ Passed
- Frontend build: ✅ Passed

## Migration Required

Yes - run `npx prisma migrate dev --name add_project_activities` when database is accessible.
