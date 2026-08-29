# CESE-RLIM

**Research, Laboratory & Innovation Management Platform**

A centralized platform for the Center of Excellence for Electrical Systems and Electronics (CESE), Adama Science and Technology University (ASTU) to manage research resources, laboratories, equipment, and innovation activities.

## Purpose

CESE-RLIM helps CESE manage:

- Researcher information and profiles
- Laboratories and their resources
- Research equipment tracking and availability
- Equipment requests, approval, and issuing
- Equipment maintenance and history
- Research-project/resource relationships
- Research innovations
- Notifications and audit history
- Management dashboards and reports

## Technology Stack

### Frontend

- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- TanStack Router (routing)
- TanStack Query (server state)
- React Hook Form + Zod (forms/validation)
- Lucide React (icons)

### Backend

- NestJS with TypeScript
- Prisma ORM
- Supabase PostgreSQL
- JWT authentication (Passport.js)
- bcryptjs (password hashing)
- Swagger/OpenAPI documentation
- class-validator (request validation)

### Development

- ESLint & Prettier
- Jest (testing)
- Git

## Architecture

```
cese-rlim/
├── apps/
│   ├── web/          # React frontend (Vite + TypeScript)
│   └── api/          # NestJS backend (TypeScript)
├── packages/
│   ├── shared/       # Shared types and utilities
│   └── config/       # Shared configuration
├── docs/             # Project documentation
├── .env.example
├── README.md
└── package.json
```

The backend uses a **modular architecture** organized by business domain:

- `auth` — Authentication and authorization
- `users` — User management
- `researchers` — Researcher profiles
- `laboratories` — Laboratory management
- `equipment` — Equipment tracking
- `equipment-requests` — Request workflows (future)
- `equipment-assignments` — Issue/return (future)
- `maintenance` — Maintenance records (future)
- `research-projects` — Project references (future)
- `innovations` — Innovation tracking (future)
- `notifications` — Notification system (future)
- `audit` — Audit logging (future)

## Setup

### Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm 9+
- A Supabase project (free tier works)

### 1. Clone and Install

```bash
git clone <repository-url>
cd cese-rlim
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Supabase Database

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string → URI**
3. Copy the connection string and paste it into `apps/api/.env` as `DATABASE_URL`
4. Replace `[YOUR-PASSWORD]` with your database password

### 4. Setup Database

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
npx prisma db seed
cd ../..
```

### 5. Start Development

```bash
# Start both frontend and backend
npm run dev

# Or start individually:
npm run dev:api    # Backend on port 3000
npm run dev:web    # Frontend on port 5173
```

## Environment Variables

### Backend (.env in apps/api/)

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | — |
| JWT_SECRET | Secret key for JWT tokens | — |
| JWT_EXPIRES_IN | Token expiration time | 24h |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:5173 |
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |

### Frontend (apps/web/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:3000/api/v1 |

## API Documentation

Swagger UI is available at: `http://localhost:3000/api/docs`

### Authentication

```bash
# Login
POST /api/v1/auth/login
{
  "email": "admin@cese-rlim.local",
  "password": "admin123"
}

# Get current user
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Health Check

```bash
GET /api/v1/health
```

## Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cese-rlim.local | admin123 |
| Coordinator | coordinator@cese-rlim.local | coord123 |
| Researcher | daniel.tesfaye@astu.edu.et | researcher123 |
| Researcher | hanna.bekele@astu.edu.et | researcher123 |
| Technician | technician@cese-rlim.local | technician123 |

## Testing

```bash
npm run test              # Run all tests
npm run test --workspace=apps/api   # Backend tests only
```

## Linting

```bash
npm run lint              # Lint all workspaces
npm run format            # Format code with Prettier
```

## Project Scope

See [docs/scope.md](docs/scope.md) for detailed scope definition.

### In Scope

- Researcher Management
- Laboratory Management
- Equipment Management
- Equipment Requests & Assignments
- Maintenance Tracking
- Project Resource Relationships
- Innovation Management
- Notifications & Audit Logs
- Reports & Dashboard
- Authentication & Authorization

### Out of Scope

- Research proposal management
- Research funding management
- Publication management
- University-wide ERP
- Student academic management

## License

This is an internal internship project for ASTU CESE.
