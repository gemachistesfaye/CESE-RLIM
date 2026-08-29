# Database Design

## Overview

CESE-RLIM uses PostgreSQL with Prisma ORM. The database is normalized with proper foreign keys, indexes, and constraints.

## Entity Relationship Diagram

```
User 1──1 Researcher
User 1──N AuditLog
User 1──N Notification
User 1──N MaintenanceRecord (as technician)
Researcher 1──N EquipmentRequest
Researcher 1──N EquipmentAssignment
Researcher 1──N Innovation
Researcher 1──N MaintenanceRecord (as reporter)
Laboratory 1──N Equipment
Equipment 1──N EquipmentRequest
Equipment 1──N EquipmentAssignment
Equipment 1──N MaintenanceRecord
ResearchProject 1──N EquipmentRequest
ResearchProject 1──N EquipmentAssignment
ResearchProject 1──N Innovation
```

## Models

### User
Core authentication and identity model.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| email | String | UNIQUE, NOT NULL |
| password_hash | String | NOT NULL |
| first_name | String | NOT NULL |
| last_name | String | NOT NULL |
| phone | String? | |
| role | Enum | NOT NULL, default RESEARCHER |
| is_active | Boolean | NOT NULL, default true |
| last_login_at | DateTime? | |
| created_at | DateTime | NOT NULL, default now() |
| updated_at | DateTime | NOT NULL |

**Roles**: ADMIN, COORDINATOR, RESEARCHER, TECHNICIAN

### Researcher
Extended profile for researchers, linked 1:1 to User.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | String | UNIQUE, FK → User |
| employee_or_student_id | String | UNIQUE, NOT NULL |
| department | String | NOT NULL |
| academic_position | String? | |
| bio | String? | |
| research_areas | String? | |
| expertise | String? | |
| profile_image | String? | |
| orcid | String? | |

### Laboratory
Physical research facilities.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | String | NOT NULL |
| code | String | UNIQUE, NOT NULL |
| location | String | NOT NULL |
| description | String? | |
| capacity | Int? | |
| responsible_person_id | String? | |
| status | Enum | NOT NULL, default ACTIVE |

**Status**: ACTIVE, INACTIVE, UNDER_MAINTENANCE

### Equipment
Research equipment tracked by the system.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | String | NOT NULL |
| asset_id | String | UNIQUE, NOT NULL |
| serial_number | String? | INDEXED |
| category | String | NOT NULL, INDEXED |
| manufacturer | String? | |
| model | String? | |
| description | String? | |
| purchase_date | DateTime? | |
| purchase_price | Decimal? | |
| laboratory_id | String | FK → Laboratory |
| condition | Enum | NOT NULL, default GOOD |
| status | Enum | NOT NULL, default AVAILABLE |
| warranty_expiry | DateTime? | |

**Condition**: EXCELLENT, GOOD, FAIR, POOR, DAMAGED
**Status**: AVAILABLE, RESERVED, IN_USE, UNDER_MAINTENANCE, DAMAGED, LOST, RETIRED

### EquipmentRequest
Request for equipment usage.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| requester_id | String | FK → Researcher |
| equipment_id | String | FK → Equipment |
| research_project_id | String? | FK → ResearchProject |
| purpose | String | NOT NULL |
| start_date | DateTime | NOT NULL |
| expected_return_date | DateTime | NOT NULL |
| priority | Enum | NOT NULL, default MEDIUM |
| status | Enum | NOT NULL, default SUBMITTED |
| review_comment | String? | |
| reviewed_by_id | String? | |
| reviewed_at | DateTime? | |

**Priority**: LOW, MEDIUM, HIGH, URGENT
**Status**: SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, ISSUED, IN_USE, RETURNED, CLOSED, CANCELLED

### EquipmentAssignment
Tracks equipment issue/return.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| equipment_id | String | FK → Equipment |
| researcher_id | String | FK → Researcher |
| research_project_id | String? | FK → ResearchProject |
| request_id | String? | UNIQUE, FK → EquipmentRequest |
| issued_by_id | String | FK → User |
| issued_at | DateTime | NOT NULL |
| expected_return_at | DateTime | NOT NULL |
| returned_at | DateTime? | |
| received_by_id | String? | FK → User |
| condition_at_issue | String? | |
| condition_at_return | String? | |
| notes | String? | |

### MaintenanceRecord
Equipment maintenance tracking.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| equipment_id | String | FK → Equipment |
| reported_by_id | String | FK → Researcher |
| assigned_technician_id | String? | FK → User |
| problem_description | String | NOT NULL |
| priority | Enum | NOT NULL, default MEDIUM |
| status | Enum | NOT NULL, default REPORTED |
| diagnosis | String? | |
| action_taken | String? | |
| reported_at | DateTime | NOT NULL, default now() |
| started_at | DateTime? | |
| completed_at | DateTime? | |
| cost | Decimal? | |
| notes | String? | |

**Status**: REPORTED, DIAGNOSING, REPAIRING, TESTING, COMPLETED, CANCELLED

### ResearchProject
Basic project reference (not full project management).

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| project_code | String | UNIQUE, NOT NULL |
| title | String | NOT NULL |
| description | String? | |
| project_status | Enum | NOT NULL, default ACTIVE |
| start_date | DateTime? | |
| end_date | DateTime? | |

**Status**: ACTIVE, COMPLETED, ON_HOLD, CANCELLED

### Innovation
Research innovations and prototypes.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| title | String | NOT NULL |
| description | String? | |
| category | String? | |
| development_stage | Enum | NOT NULL, default IDEA |
| status | Enum | NOT NULL, default SUBMITTED |
| research_project_id | String? | FK → ResearchProject |
| submitted_by_id | String | FK → Researcher |

**Stage**: IDEA, PROTOTYPE, TESTING, VALIDATED, TRANSFERRED
**Status**: SUBMITTED, UNDER_EVALUATION, APPROVED, REJECTED, COMPLETED

### Notification
User notifications.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | String | FK → User |
| title | String | NOT NULL |
| message | String | NOT NULL |
| type | Enum | NOT NULL, default INFO |
| is_read | Boolean | NOT NULL, default false |
| created_at | DateTime | NOT NULL, default now() |
| read_at | DateTime? | |

**Type**: INFO, WARNING, SUCCESS, ERROR, REQUEST, MAINTENANCE

### AuditLog
System audit trail.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | String? | FK → User |
| action | Enum | NOT NULL |
| entity_type | String | NOT NULL, INDEXED |
| entity_id | String? | INDEXED |
| description | String? | |
| metadata | Json? | |
| ip_address | String? | |
| user_agent | String? | |
| created_at | DateTime | NOT NULL, default now() |

**Action**: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT, ISSUE, RETURN, MAINTENANCE, OTHER

## Indexes

| Table | Columns | Purpose |
|-------|---------|---------|
| users | email | Login lookups |
| users | role | Role-based queries |
| researchers | employee_or_student_id | ID lookups |
| researchers | department | Department filtering |
| laboratories | code | Code lookups |
| laboratories | status | Status filtering |
| equipment | asset_id | Asset lookups |
| equipment | serial_number | Serial number lookups |
| equipment | status | Status filtering |
| equipment | laboratory_id | Lab equipment queries |
| equipment | category | Category filtering |
| equipment_requests | status | Status filtering |
| equipment_requests | requester_id | Requester queries |
| equipment_requests | equipment_id | Equipment request queries |
| equipment_assignments | equipment_id | Equipment history |
| equipment_assignments | researcher_id | Researcher assignments |
| maintenance_records | equipment_id | Equipment maintenance |
| maintenance_records | status | Status filtering |
| research_projects | project_code | Code lookups |
| research_projects | project_status | Status filtering |
| innovations | status | Status filtering |
| innovations | development_stage | Stage filtering |
| innovations | submitted_by_id | Submitter queries |
| notifications | user_id | User notifications |
| notifications | is_read | Unread filtering |
| notifications | created_at | Time-based queries |
| audit_logs | user_id | User audit trail |
| audit_logs | entity_type | Entity type queries |
| audit_logs | entity_id | Entity audit trail |
| audit_logs | action | Action filtering |
| audit_logs | created_at | Time-based queries |
