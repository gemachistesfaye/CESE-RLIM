# Equipment Management Module - Prompt 4

## Module Overview

The Equipment Management module provides end-to-end management of research equipment and laboratory resources. It integrates with the existing Laboratory module and supports CRUD operations, search, filtering, pagination, status management, and audit logging.

## Database Model

### Equipment (Prisma Model)

| Field | Type | Description |
|-------|------|-------------|
| id | String (UUID) | Primary key |
| name | String | Equipment name |
| assetId | String (unique) | Unique asset identifier |
| serialNumber | String? | Serial number (unique) |
| category | String | Equipment category |
| manufacturer | String? | Manufacturer name |
| model | String? | Model number |
| description | String? | Description |
| purchaseDate | DateTime? | Purchase date |
| purchasePrice | Decimal? | Purchase price |
| laboratoryId | String | Foreign key to Laboratory |
| condition | EquipmentCondition | EXCELLENT, GOOD, FAIR, POOR, DAMAGED |
| status | EquipmentStatus | AVAILABLE, RESERVED, IN_USE, UNDER_MAINTENANCE, DAMAGED, LOST, RETIRED |
| warrantyExpiry | DateTime? | Warranty expiry date |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Relationships

- Equipment → Laboratory (many-to-one, required)
- Equipment ← EquipmentRequest (one-to-many)
- Equipment ← EquipmentAssignment (one-to-many)
- Equipment ← MaintenanceRecord (one-to-many)

## Backend Files

### DTOs

- `apps/api/src/equipment/dto/create-equipment.dto.ts`
- `apps/api/src/equipment/dto/update-equipment.dto.ts`
- `apps/api/src/equipment/dto/update-equipment-status.dto.ts`

### Service

- `apps/api/src/equipment/equipment.service.ts`

### Controller

- `apps/api/src/equipment/equipment.controller.ts`

### Module

- `apps/api/src/equipment/equipment.module.ts`

## API Endpoints

### GET /equipment

- **Description**: List all equipment with pagination, search, and filters
- **Auth**: JWT required
- **Roles**: ADMIN, COORDINATOR, RESEARCHER, TECHNICIAN
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `search` (string) - searches name, assetId, serialNumber, manufacturer, model, category, laboratory name
  - `status` (enum) - AVAILABLE, RESERVED, IN_USE, UNDER_MAINTENANCE, DAMAGED, LOST, RETIRED
  - `condition` (enum) - EXCELLENT, GOOD, FAIR, POOR, DAMAGED
  - `category` (string)
  - `laboratoryId` (string)
  - `sortBy` (string) - createdAt, name, assetId, status, condition, category
  - `sortOrder` (string) - asc, desc

### GET /equipment/:id

- **Description**: Get equipment by ID
- **Auth**: JWT required
- **Roles**: ADMIN, COORDINATOR, RESEARCHER, TECHNICIAN
- **Response**: Equipment with laboratory details

### POST /equipment

- **Description**: Create new equipment
- **Auth**: JWT required
- **Roles**: ADMIN, COORDINATOR
- **Body**: CreateEquipmentDto
- **Validations**:
  - Asset ID must be unique
  - Serial number must be unique (if provided)
  - Laboratory must exist
  - Required fields: name, assetId, category, laboratoryId
- **Audit Log**: CREATE

### PATCH /equipment/:id

- **Description**: Update equipment information
- **Auth**: JWT required
- **Roles**: ADMIN, COORDINATOR
- **Body**: UpdateEquipmentDto
- **Validations**:
  - Equipment must exist
  - Serial number must be unique (if changed)
  - Laboratory must exist (if changed)
- **Audit Log**: UPDATE

### PATCH /equipment/:id/status

- **Description**: Change equipment status
- **Auth**: JWT required
- **Roles**: ADMIN, COORDINATOR
- **Body**: UpdateEquipmentStatusDto
- **Validations**:
  - Equipment must exist
  - Status must be valid enum value
- **Audit Log**: UPDATE (with status change details)

## Authorization

| Role | View | Create | Update | Status Change |
|------|------|--------|--------|---------------|
| ADMIN | Yes | Yes | Yes | Yes |
| COORDINATOR | Yes | Yes | Yes | Yes |
| RESEARCHER | Yes | No | No | No |
| TECHNICIAN | Yes | No | No | No |

## Audit Logging

All mutations are logged with:
- User ID (executor)
- Action type (CREATE, UPDATE)
- Entity type ("Equipment")
- Entity ID
- Description
- Metadata (changed fields, previous/new status)

## Frontend Routes

- `/equipment` - Equipment list page
- `/equipment/:id` - Equipment details page

## Frontend Files

### Hooks

- `apps/web/src/hooks/useEquipment.ts`

### Components

- `apps/web/src/components/equipment/EquipmentForm.tsx`

### Pages

- `apps/web/src/pages/equipment/EquipmentList.tsx`
- `apps/web/src/pages/equipment/EquipmentDetails.tsx`

### Updated Files

- `apps/web/src/router.tsx` - Added equipment routes
- `apps/web/src/layouts/AppLayout.tsx` - Enabled Equipment sidebar link

## Features Implemented

### Equipment List

- Paginated table display
- Server-side search (name, assetId, serialNumber, manufacturer, model, category, laboratory name)
- Filters: status, condition, category, laboratory
- Sort by: createdAt, name, assetId, status, condition, category
- Empty state with Add Equipment button
- Error state with retry message
- Loading state with spinner

### Equipment Form

- Create and Edit modes
- Laboratory selector (dropdown with all laboratories)
- Condition selector
- Status selector
- Purchase date and price fields
- Warranty expiry field
- Form validation with error messages
- Duplicate asset ID/serial number handling
- Server error display

### Equipment Details

- Basic information (name, assetId, category, manufacturer, model, serialNumber)
- Laboratory information with location
- Purchase information (date, price, warranty)
- Status and condition badges
- Metadata (created, updated timestamps)
- Status management (Admin/Coordinator only)
- Edit button (Admin/Coordinator only)
- Status change confirmation dialog

### Sidebar

- Equipment link now functional (previously disabled)
- Role-based visibility maintained

## Search Implementation

Server-side search across multiple fields:
- Equipment name
- Asset ID
- Serial number
- Manufacturer
- Model
- Category
- Laboratory name (via relation)

Case-insensitive search using PostgreSQL `ILIKE`.

## Filter Implementation

- **Status**: Dropdown with all EquipmentStatus values
- **Condition**: Dropdown with all EquipmentCondition values
- **Laboratory**: Dropdown populated from laboratories API
- **Category**: Dynamic dropdown from current results

## Pagination Implementation

- Server-side pagination
- "Showing X-Y of Z equipment" display
- Previous/Next buttons
- Page reset on filter/search change

## Laboratory Integration

- Equipment linked to Laboratory via `laboratoryId` (required)
- Laboratory selector in create/edit form
- Laboratory details displayed in equipment list and details
- Laboratory validation on create/update
- Equipment count visible in laboratory details

## Status Management

### EquipmentStatus Values

- AVAILABLE - Equipment is available for use
- RESERVED - Equipment is reserved
- IN_USE - Equipment is currently in use
- UNDER_MAINTENANCE - Equipment is being maintained
- DAMAGED - Equipment is damaged
- LOST - Equipment is lost
- RETIRED - Equipment is retired

### Status Change

- Dedicated status buttons on details page
- Confirmation dialog for status changes
- Destructive statuses (RETIRED, DAMAGED) use danger variant
- Status changes are audited

## Testing

### Backend API Tests

- GET /equipment - List with pagination
- GET /equipment/:id - Get by ID
- POST /equipment - Create with validation
- PATCH /equipment/:id - Update
- PATCH /equipment/:id/status - Status change

### Frontend Verification

- Equipment list loads correctly
- Search filters results
- Status/condition/laboratory filters work
- Pagination works
- Create form opens and validates
- Edit form pre-populates data
- Details page shows all information
- Status management works with confirmation
- Sidebar navigates to /equipment
- Existing routes (/users, /researchers, /laboratories, /) still work

## Build Results

- Prisma validation: PASSED
- Backend build: PASSED
- Frontend build: PASSED

## No Schema Changes

The existing Prisma Equipment model was sufficient. No migrations were required.

## Remaining Issues

None identified. The module is complete and functional.

## Future Integration Points

The Equipment module is structured to support:
- Equipment Requests (EquipmentRequest model exists)
- Equipment Assignments (EquipmentAssignment model exists)
- Maintenance Records (MaintenanceRecord model exists)

These modules can be implemented in future prompts without modifying the Equipment module.
