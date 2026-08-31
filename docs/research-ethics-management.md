# Research Ethics & Approval Management Module

## Overview

The Research Ethics & Approval Management module provides a complete workflow for managing research ethics applications within the CESE-RLIM platform. It supports the full lifecycle from draft creation through review to final approval or rejection.

## Database Models

### Enums

#### EthicsApplicationStatus
- `DRAFT` - Initial state, can be edited
- `SUBMITTED` - Submitted for review
- `UNDER_REVIEW` - Reviewer assigned, review in progress
- `REVISION_REQUIRED` - Reviewer requests changes
- `RESUBMITTED` - Resubmitted after revisions
- `APPROVED` - Application approved
- `REJECTED` - Application rejected
- `WITHDRAWN` - Application withdrawn by applicant

#### EthicsReviewDecision
- `APPROVE` - Approve the application
- `REJECT` - Reject the application
- `REQUEST_REVISION` - Request revisions

### Models

#### EthicsApplication
- `id` - UUID primary key
- `applicationCode` - Unique application code (e.g., ETH-0001)
- `researchProjectId` - FK to ResearchProject
- `applicantId` - FK to Researcher
- `title` - Application title
- `researchSummary` - Research summary
- `methodology` - Research methodology (optional)
- `participantDetails` - Participant details (optional)
- `riskAssessment` - Risk assessment (optional)
- `benefitStatement` - Benefit statement (optional)
- `dataProtectionPlan` - Data protection plan (optional)
- `consentProcess` - Consent process (optional)
- `status` - EthicsApplicationStatus
- `submittedAt` - Submission timestamp
- `reviewedAt` - Review timestamp
- `approvedAt` - Approval timestamp
- `rejectedAt` - Rejection timestamp
- `reviewerId` - FK to Researcher (primary reviewer)
- `reviewComment` - Latest review comment
- `revisionComment` - Revision requirements
- `createdAt` / `updatedAt` - Timestamps

#### EthicsReview
- `id` - UUID primary key
- `applicationId` - FK to EthicsApplication
- `reviewerId` - FK to Researcher
- `decision` - EthicsReviewDecision
- `comment` - Review comment
- `reviewedAt` - Review timestamp
- `createdAt` / `updatedAt` - Timestamps

#### EthicsReviewer
- `id` - UUID primary key
- `applicationId` - FK to EthicsApplication
- `reviewerId` - FK to Researcher
- `assignedById` - FK to User
- `assignedAt` - Assignment timestamp
- `isActive` - Whether assignment is active
- `completedAt` - Completion timestamp
- `createdAt` / `updatedAt` - Timestamps

## Relationships

```
ResearchProject
      |
      +-- EthicsApplication
              |
              +-- Applicant (Researcher)
              +-- Reviewer (Researcher)
              +-- Reviews (EthicsReview[])
              +-- Reviewers (EthicsReviewer[])
```

## API Endpoints

### Applications
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /ethics/applications | List all applications (paginated) | ADMIN, COORDINATOR, RESEARCHER |
| GET | /ethics/applications/my | Get current user's applications | RESEARCHER, ADMIN, COORDINATOR |
| GET | /ethics/applications/summary | Get statistics | ADMIN, COORDINATOR |
| GET | /ethics/applications/overdue | Get overdue applications | ADMIN, COORDINATOR |
| GET | /ethics/applications/pending | Get pending review applications | ADMIN, COORDINATOR |
| GET | /ethics/applications/project/:projectId | Get by project | All authenticated |
| GET | /ethics/applications/researcher/:researcherId | Get by researcher | All authenticated |
| GET | /ethics/applications/:id | Get application by ID | All authenticated |
| POST | /ethics/applications | Create application | RESEARCHER, ADMIN, COORDINATOR |
| PATCH | /ethics/applications/:id | Update application | Owner (DRAFT/REVISION_REQUIRED only) |
| PATCH | /ethics/applications/:id/submit | Submit application | Owner |
| PATCH | /ethics/applications/:id/withdraw | Withdraw application | Owner |
| PATCH | /ethics/applications/:id/review | Review application | ADMIN, COORDINATOR |
| PATCH | /ethics/applications/:id/status | Update status | ADMIN, COORDINATOR |

### Reviewer Management
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | /ethics/applications/:id/reviewer | Assign reviewer | ADMIN, COORDINATOR |
| PATCH | /ethics/applications/:id/reviewer/:reviewerId | Remove reviewer | ADMIN, COORDINATOR |

## Authorization Matrix

| Action | ADMIN | COORDINATOR | RESEARCHER | TECHNICIAN |
|--------|:-----:|:-----------:|:----------:|:----------:|
| View all applications | Yes | Yes | No | No |
| View own applications | Yes | Yes | Yes | No |
| Create application | Yes | Yes | Yes | No |
| Edit own draft | Yes | Yes | Yes | No |
| Submit application | Yes | Yes | Yes | No |
| Assign reviewer | Yes | Yes | No | No |
| Review application | Yes | Yes | No | No |
| Approve application | Yes | Yes | No | No |
| Reject application | Yes | Yes | No | No |
| Request revision | Yes | Yes | No | No |
| Withdraw own application | Yes | Yes | Yes | No |
| View review history | Yes | Yes | Own only | No |

## Ethics Workflow

```
DRAFT
  |
  v
SUBMITTED
  |
  v
UNDER_REVIEW
  |
  +-- REVISION_REQUIRED
  |       |
  |       v
  |    RESUBMITTED
  |       |
  |       v
  |   UNDER_REVIEW
  |
  +-- APPROVED
  |
  +-- REJECTED

Withdrawal (from DRAFT, SUBMITTED, or REVISION_REQUIRED):
  --> WITHDRAWN
```

## Status Transitions

| From | To |
|------|-----|
| DRAFT | SUBMITTED, WITHDRAWN |
| SUBMITTED | UNDER_REVIEW, WITHDRAWN |
| UNDER_REVIEW | APPROVED, REJECTED, REVISION_REQUIRED |
| REVISION_REQUIRED | RESUBMITTED, WITHDRAWN |
| RESUBMITTED | UNDER_REVIEW |
| APPROVED | (terminal) |
| REJECTED | (terminal) |
| WITHDRAWN | (terminal) |

## Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| /ethics/applications | EthicsApplicationsList | List all ethics applications |
| /ethics/applications/:id | EthicsApplicationDetails | Application details & review |

## Frontend Components

### Pages
- `EthicsApplicationsList.tsx` - Main list with summary cards, search, filters, pagination, create modal
- `EthicsApplicationDetails.tsx` - Full details with timeline, review, assign reviewer, edit

### Components
- `EthicsApplicationForm.tsx` - Create/edit form with Zod validation

### Hooks
- `useEthics.ts` - All query/mutation hooks for ethics operations

## Audit Logging

Every important mutation is audited:
- CREATE - Application created
- UPDATE - Application updated
- SUBMIT - Application submitted
- WITHDRAW - Application withdrawn
- APPROVE - Application approved
- REJECT - Application rejected
- REQUEST_REVISION - Revision requested
- ASSIGN_REVIEWER - Reviewer assigned
- STATUS_CHANGE - Status changed

Audit metadata includes: applicationCode, previousStatus, newStatus, reviewerId, comment, changedFields.

## Business Rules

1. Every ethics application belongs to a research project
2. Every application has an applicant (researcher)
3. Researchers can only manage their own applications
4. Draft applications can be edited
5. Submitted applications cannot be freely edited
6. Reviewers cannot review their own application
7. Only authorized reviewers/admin/coordinators can review
8. Rejection requires a reason
9. Revision requests require feedback
10. Only valid status transitions are allowed
11. Approved applications cannot be reverted
12. Withdrawn applications cannot continue through review
13. Every important mutation is audited
14. Review history is preserved via EthicsReview model
15. Unauthorized users receive proper authorization errors

## Migration Command

```bash
npx prisma migrate dev --name add_research_ethics_management
```

## Files Created/Modified

### Backend (apps/api/src/ethics/)
- `ethics.module.ts` - Module registration
- `ethics.controller.ts` - API endpoints with guards
- `ethics.service.ts` - Business logic, workflows, audit
- `dto/create-ethics-application.dto.ts` - Create DTO
- `dto/update-ethics-application.dto.ts` - Update DTO
- `dto/review-ethics-application.dto.ts` - Review DTO
- `dto/assign-ethics-reviewer.dto.ts` - Assign reviewer DTO
- `dto/update-ethics-status.dto.ts` - Status update DTO

### Frontend (apps/web/src/)
- `hooks/useEthics.ts` - Query/mutation hooks
- `components/ethics/EthicsApplicationForm.tsx` - Form component
- `pages/ethics/EthicsApplicationsList.tsx` - List page
- `pages/ethics/EthicsApplicationDetails.tsx` - Details page

### Modified Files
- `apps/web/src/router.tsx` - Added ethics routes
- `apps/web/src/layouts/AppLayout.tsx` - Added COMPLIANCE section to sidebar
- `apps/web/src/pages/research-projects/ResearchProjectDetails.tsx` - Added ethics section
- `apps/web/src/pages/researchers/ResearcherProfile.tsx` - Added ethics section
