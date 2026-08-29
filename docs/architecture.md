# Architecture

## Overview

CESE-RLIM uses a monorepo architecture with a clear separation between frontend and backend.

## High-Level Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│  React + TypeScript + Vite + Tailwind CSS   │
│  TanStack Router + TanStack Query           │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
┌──────────────────┴──────────────────────────┐
│                  Backend                     │
│  NestJS + TypeScript + Prisma ORM           │
│  JWT Auth + Role-Based Access Control       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│               Database                       │
│  Supabase PostgreSQL                         │
└─────────────────────────────────────────────┘
```

## Backend Architecture

The NestJS backend uses a **modular architecture** where each business domain is encapsulated in its own module.

### Module Structure

Each module follows this pattern:

```
module/
├── module.module.ts        # Module definition
├── module.service.ts       # Business logic
├── module.controller.ts    # HTTP handlers
├── dto/                    # Data transfer objects
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
├── entities/               # Type definitions
└── *.spec.ts               # Tests
```

### Request Flow

```
HTTP Request
    │
    ▼
[NestJS Middleware]  ← CORS, logging
    │
    ▼
[NestJS Guards]     ← JWT validation, role checks
    │
    ▼
[Pipes]             ← Input validation, transformation
    │
    ▼
[Controller]        ← Route handling
    │
    ▼
[Service]           ← Business logic
    │
    ▼
[Prisma Client]     ← Database operations
    │
    ▼
[PostgreSQL]
```

### Key Architectural Decisions

1. **Global Prefix**: All API routes are prefixed with `/api/v1`
2. **Validation**: Global `ValidationPipe` with whitelist and transformation
3. **Error Handling**: Centralized exception filter catches all errors
4. **Authentication**: JWT-based with Passport.js strategy
5. **Authorization**: Decorator-based role checking with `@Roles()` decorator
6. **Public Routes**: `@Public()` decorator bypasses JWT validation

## Frontend Architecture

### Routing

TanStack Router with file-based routing and type-safe navigation.

### State Management

- **Server State**: TanStack Query for API data caching
- **Client State**: React Context for auth state
- **Form State**: React Hook Form with Zod validation

### Component Organization

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts
├── layouts/          # Layout components
├── lib/              # Utilities and API client
├── pages/            # Route page components
└── router.tsx        # Route definitions
```

## API Design

### Response Format

Success:
```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

Error:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["field is required"]
}
```

### API Versioning

All endpoints use URL-based versioning: `/api/v1/...`

## Security

- JWT tokens stored in localStorage (httpOnly cookie recommended for production)
- CORS restricted to configured origin
- Passwords hashed with bcryptjs (10 rounds)
- Input validation on all endpoints
- Role-based access control
- No sensitive data in logs
