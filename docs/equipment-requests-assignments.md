# Equipment Requests & Assignments Management - Prompt 5

## Module Overview

The Equipment Requests & Assignments module provides a complete workflow for researchers to request equipment and for administrators/coordinators to manage those requests through approval, assignment, and return processes.

## Database Models

No schema changes were required. The existing Prisma models were sufficient.

### EquipmentRequest

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| requesterId | String | FK to Researcher |
| equipmentId | String | FK to Equipment |
| researchProjectId | String? | FK to ResearchProject (optional) |
| purpose | String | Request purpose |
| startDate | DateTime | Requested start date |
| expectedReturnDate | DateTime | Expected return date |
| priority | RequestPriority | LOW, MEDIUM, HIGH, URGENT |
| status | RequestStatus | SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, ISSUED, IN_USE, RETURNED, CLOSED, CANCELLED |
| reviewComment | String? | Review comment |
| reviewedById | String? | FK to User who reviewed |
| reviewedAt | DateTime? | Review timestamp |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### EquipmentAssignment

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| equipmentId | String | FK to Equipment |
| researcherId | String | FK to Researcher |
| researchProjectId | String? | FK to ResearchProject (optional) |
| requestId | String? | FK to EquipmentRequest (unique) |
| issuedById | String | FK to User who issued |
| issuedAt | DateTime | Assignment date |
| expectedReturnAt | DateTime | Expected return date |
| returnedAt | DateTime? | Actual return date |
| receivedById | String? | FK to User who received return |
| conditionAtIssue | String? | Equipment condition at issue |
| conditionAtReturn | String? | Equipment condition at return |
| notes | String? | Notes |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

## Request Workflow

```
RESEARCHER
    ↓
Submit Request (SUBMITTED)
    ↓
ADMIN / COORDINATOR REVIEW
    ├── REJECTED
    └── APPROVED
             ↓
      Equipment Assignment (ISSUED)
             ↓
        IN_USE / ACTIVE
             ↓
        RETURNED
             ↓
         CLOSED

Also support cancellation:
SUBMITTED → CANCELLED
```

## Backend Files

### Equipment Requests Module

- `apps/api/src/equipment-requests/dto/create-equipment-request.dto.ts`
- `apps/api/src/equipment-requests/dto/review-equipment-request.dto.ts`
- `apps/api/src/equipment-requests/equipment-requests.service.ts`
- `apps/api/src/equipment-requests/equipment-requests.controller.ts`
- `apps/api/src/equipment-requests/equipment-requests.module.ts`

### Equipment Assignments Module

- `apps/api/src/equipment-assignments/dto/create-equipment-assignment.dto.ts`
- `apps/api/src/equipment-assignments/dto/return-equipment-assignment.dto.ts`
- `apps/api/src/equipment-assignments/equipment-assignments.service.ts`
- `apps/api/src/equipment-assignments/equipment-assignments.controller.ts`
- `apps/api/src/equipment-assignments/equipment-assignments.module.ts`

## API Endpoints

### Equipment Requests

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | /equipment-requests | JWT | ALL | List requests (researchers see own only) |
| GET | /equipment-requests/:id | JWT | ALL | Get request details |
| POST | /equipment-requests | JWT | RESEARCHER | Create new request |
| PATCH | /equipment-requests/:id/review | JWT | ADMIN, COORDINATOR | Approve/reject request |
| PATCH | /equipment-requests/:id/cancel | JWT | RESEARCHER | Cancel own request |

### Equipment Assignments

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | /equipment-assignments | JWT | ALL | List assignments (researchers see own only) |
| GET | /equipment-assignments/:id | JWT | ALL | Get assignment details |
| POST | /equipment-assignments | JWT | ADMIN, COORDINATOR | Create assignment from approved request |
| PATCH | /equipment-assignments/:id/return | JWT | ADMIN, COORDINATOR | Return assigned equipment |

## Role Permissions

| Role | View Requests | Create Request | Review Requests | View Assignments | Create Assignment | Return Equipment |
|------|---------------|----------------|-----------------|------------------|-------------------|------------------|
| ADMIN | All | No | Yes | All | Yes | Yes |
| COORDINATOR | All | No | Yes | All | Yes | Yes |
| RESEARCHER | Own only | Yes | No | Own only | No | No |
| TECHNICIAN | All | No | No | All | No | No |

## Frontend Routes

- `/equipment-requests` - Equipment requests list
- `/equipment-requests/:id` - Equipment request details
- `/equipment-assignments` - Equipment assignments list
- `/equipment-assignments/:id` - Equipment assignment details

## Frontend Files

### Hooks

- `apps/web/src/hooks/useEquipmentRequests.ts`
- `apps/web/src/hooks/useEquipmentAssignments.ts`

### Components

- `apps/web/src/components/equipment-requests/EquipmentRequestForm.tsx`

### Pages

- `apps/web/src/pages/equipment-requests/EquipmentRequestsList.tsx`
- `apps/web/src/pages/equipment-requests/EquipmentRequestDetails.tsx`
- `apps/web/src/pages/equipment-assignments/EquipmentAssignmentsList.tsx`
- `apps/web/src/pages/equipment-assignments/EquipmentAssignmentDetails.tsx`

### Updated Files

- `apps/web/src/router.tsx` - Added request and assignment routes
- `apps/web/src/layouts/AppLayout.tsx` - Enabled Requests and Assignments sidebar links
- `apps/api/src/app.module.ts` - Added new modules

## Business Rules

1. Only researchers can submit equipment requests
2. Researchers can only view their own requests
3. Researchers can only cancel requests in SUBMITTED status
4. Only admin/coordinator can approve/reject requests
5. Rejection requires a reason
6. Only approved requests can be assigned
7. Equipment must be AVAILABLE to be assigned
8. Equipment cannot have multiple active assignments
9. Assignment updates equipment status to IN_USE
10. Return updates equipment status based on condition
11. DAMAGED condition sets equipment to DAMAGED status
12. POOR condition sets equipment to UNDER_MAINTENANCE status
13. GOOD/EXCELLENT/FAIR condition sets equipment to AVAILABLE status
14. All state changes are audited

## Audit Logging

| Action | Entity | Description |
|--------|--------|-------------|
| CREATE | EquipmentRequest | Created equipment request for [equipment] |
| UPDATE | EquipmentRequest | Cancelled equipment request |
| APPROVE | EquipmentRequest | Approved equipment request from [requester] |
| REJECT | EquipmentRequest | Rejected equipment request from [requester] |
| ISSUE | EquipmentAssignment | Assigned equipment [name] ([assetId]) to [requester] |
| RETURN | EquipmentAssignment | Returned equipment [name] ([assetId]) |

## Build Results

- Prisma validation: PASSED
- Backend build: PASSED
- Frontend build: PASSED

## No Schema Changes

The existing Prisma EquipmentRequest and EquipmentAssignment models were sufficient. No migrations were required.

## Remaining Issues

None identified. The module is complete and functional.
