# Research Funding & Grant Management Module

## Overview
This module provides end-to-end funding lifecycle management: from discovering opportunities, through application and review, to active grant tracking with spending monitoring.

## Architecture

### Database Models (Prisma)
- **FundingOpportunity** — Open calls for proposals (title, organization, fundingType, amounts, deadlines)
- **GrantApplication** — Researcher-submitted applications linked to opportunities (with review workflow)
- **ResearchGrant** — Approved grants with budget tracking and spending history

### Enums
| Enum | Values |
|------|--------|
| `FundingType` | GRANT, CONTRACT, COOPERATIVE, SPONSORSHIP, INTERNAL |
| `FundingOpportunityStatus` | OPEN, UPCOMING, CLOSED, CANCELLED |
| `GrantApplicationStatus` | DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, WITHDRAWN |
| `GrantStatus` | ACTIVE, ON_HOLD, COMPLETED, SUSPENDED, CANCELLED |

### Backend Modules

**Funding Opportunities** (`apps/api/src/funding-opportunities/`)
- `GET /funding-opportunities` — List with filters (status, fundingType, search, pagination)
- `GET /funding-opportunities/summary` — Dashboard stats
- `GET /funding-opportunities/:id` — Detail with applications count
- `POST /funding-opportunities` — Create (ADMIN, COORDINATOR)
- `PATCH /funding-opportunities/:id` — Update
- `PATCH /funding-opportunities/:id/status` — Change status

**Grant Applications** (`apps/api/src/grant-applications/`)
- `GET /grant-applications` — List with filters (status, opportunityId, researchProjectId, search)
- `GET /grant-applications/my` — Current user's applications
- `GET /grant-applications/summary` — Dashboard stats
- `GET /grant-applications/:id` — Detail
- `POST /grant-applications` — Create draft (RESEARCHER, ADMIN, COORDINATOR)
- `PATCH /grant-applications/:id` — Edit draft
- `PATCH /grant-applications/:id/submit` — Submit for review
- `PATCH /grant-applications/:id/review` — Approve/reject (ADMIN, COORDINATOR)
- `PATCH /grant-applications/:id/withdraw` — Withdraw submitted application

**Research Grants** (`apps/api/src/research-grants/`)
- `GET /research-grants` — List with filters (status, researchProjectId, search)
- `GET /research-grants/my` — Grants where user is PI
- `GET /research-grants/summary` — Dashboard stats
- `GET /research-grants/:id` — Detail
- `POST /research-grants` — Create from approved application (ADMIN, COORDINATOR)
- `PATCH /research-grants/:id` — Update details
- `PATCH /research-grants/:id/status` — Change status
- `PATCH /research-grants/:id/spending` — Update spent amount

### Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/funding-opportunities` | FundingOpportunitiesList | Search/filter opportunities with status dashboard |
| `/funding-opportunities/:id` | FundingOpportunityDetails | View details, applications, status transitions |
| `/grant-applications` | GrantApplicationsList | All applications with status dashboard and actions |
| `/grant-applications/:id` | GrantApplicationDetails | Full application view with review/submit/withdraw |
| `/research-grants` | ResearchGrantsList | Active grants with budget utilization dashboard |
| `/research-grants/:id` | ResearchGrantDetails | Budget tracking, spending updates, status management |

### Integration Points
- **Research Projects**: Projects display linked applications and active grants
- **Researcher Profile**: Shows researcher's applications and grants
- **Sidebar**: FUNDING section with Opportunities, Applications, Grants

### Workflow
1. **Opportunity Discovery** — Admin/Coordinator creates funding opportunities
2. **Application** — Researcher creates draft, fills details, submits
3. **Review** — Coordinator/Admin reviews and approves/rejects
4. **Grant Creation** — Approved applications become tracked grants
5. **Budget Tracking** — Principal investigator monitors spending against award
6. **Status Management** — Grants progress through Active → On Hold → Completed lifecycle

### Dashboard Stats
Each list page shows a summary dashboard:
- Opportunities: Total, Open, Upcoming, Closed, Cancelled
- Applications: Total, Draft, Submitted, Under Review, Approved, Rejected, Withdrawn
- Grants: Total, Active, Completed, Suspended, Cancelled + Total Awarded/Spent

### Audit Trail
All mutations are logged via `AuditService` with actions: `CREATE`, `UPDATE`, `STATUS_CHANGE`, `SUBMIT`, `WITHDRAW`, `SPENDING_UPDATE`

## Migration
Run when Supabase is accessible:
```bash
npx prisma migrate dev --name add_research_funding_management
```
