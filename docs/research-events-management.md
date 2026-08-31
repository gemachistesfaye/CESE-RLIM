# Research Events, Conferences & Participation Management

## Overview
Manages research events (conferences, seminars, workshops, etc.) with registration, participation tracking, and status workflow.

## Database Schema
- **ResearchEvent** – Event details (code, title, type, dates, venue, virtual support, capacity, linked project/innovation/publication)
- **EventParticipation** – Registration records (researcher, status, timestamps)

### Enums
| Enum | Values |
|------|--------|
| EventType | CONFERENCE, SEMINAR, WORKSHOP, TRAINING, LECTURE, DEFENSE, SYMPOSIUM, OTHER |
| EventStatus | DRAFT → PUBLISHED → REGISTRATION_OPEN → REGISTRATION_CLOSED → ONGOING → COMPLETED (+ CANCELLED from any) |
| ParticipationStatus | REGISTERED → CONFIRMED → ATTENDED, CANCELLED, NO_SHOW |

## API Endpoints

### Research Events (`/research-events`)
| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/` | All | List events (paginated, filterable) |
| GET | `/summary` | ADMIN, COORDINATOR | Event statistics |
| GET | `/upcoming` | All | Upcoming events |
| GET | `/project/:id` | All | Events by project |
| GET | `/:id` | All | Event details |
| GET | `/:id/participants` | All | Event participants |
| POST | `/` | ADMIN, COORDINATOR | Create event |
| PATCH | `/:id` | ADMIN, COORDINATOR | Update event |
| PATCH | `/:id/status` | ADMIN, COORDINATOR | Change status |

### Event Participations (`/event-participations`)
| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/` | ADMIN, COORDINATOR | List participations |
| GET | `/my` | All | My registrations |
| GET | `/:id` | All | Participation details |
| POST | `/` | RESEARCHER | Register for event |
| PATCH | `/:id/cancel` | Owner/ADMIN | Cancel registration |
| PATCH | `/:id/status` | ADMIN, COORDINATOR | Update status |

## Frontend Routes
| Route | Page | Access |
|-------|------|--------|
| `/research-events` | Events list | All |
| `/research-events/:id` | Event details | All |
| `/my-events` | My registrations | RESEARCHER |

## Sidebar Navigation
- **RESEARCH** section: "Events" link
- **MY WORK** section: "My Events" link

## Files Created
- `apps/api/prisma/schema.prisma` – Added enums + models
- `apps/api/src/research-events/` – Backend module (service, controller, DTOs)
- `apps/api/src/event-participations/` – Backend module (service, controller, DTOs)
- `apps/web/src/hooks/useResearchEvents.ts` – Frontend hooks
- `apps/web/src/hooks/useEventParticipations.ts` – Frontend hooks
- `apps/web/src/components/research-events/ResearchEventForm.tsx` – Form component
- `apps/web/src/pages/research-events/ResearchEventsList.tsx` – List page
- `apps/web/src/pages/research-events/ResearchEventDetails.tsx` – Details page
- `apps/web/src/pages/research-events/MyEvents.tsx` – My events page
