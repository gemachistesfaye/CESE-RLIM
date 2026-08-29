# Development Guide

## Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm 9+
- Git
- A Supabase project (free tier works)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd cese-rlim
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

For the backend:
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env
```

### 4. Setup Supabase Database

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string → URI**
3. Copy the connection string and paste it into `apps/api/.env` as `DATABASE_URL`
4. Replace `[YOUR-PASSWORD]` with your database password

### 5. Setup Database

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database
npx prisma db seed

cd ../..
```

### 6. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:api    # Backend: http://localhost:3000
npm run dev:web    # Frontend: http://localhost:5173
```

## Project Structure

```
cese-rlim/
├── apps/
│   ├── web/                    # React frontend
│   │   ├── src/
│   │   │   ├── components/     # Reusable components
│   │   │   ├── contexts/       # React contexts
│   │   │   ├── layouts/        # Layout components
│   │   │   ├── lib/            # Utilities
│   │   │   ├── pages/          # Page components
│   │   │   ├── router.tsx      # Route definitions
│   │   │   ├── main.tsx        # Entry point
│   │   │   └── index.css       # Global styles
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── auth/           # Authentication module
│       │   ├── common/         # Shared utilities
│       │   ├── equipment/      # Equipment module
│       │   ├── health/         # Health check
│       │   ├── laboratories/   # Laboratories module
│       │   ├── prisma/         # Prisma service
│       │   ├── researchers/    # Researchers module
│       │   ├── users/          # Users module
│       │   ├── app.module.ts   # Root module
│       │   └── main.ts         # Entry point
│       ├── prisma/
│       │   ├── schema.prisma   # Database schema
│       │   └── seed.ts         # Seed script
│       ├── test/               # E2E tests
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                       # Documentation
├── package.json                # Root workspace config
├── tsconfig.base.json          # Shared TypeScript config
├── .env.example                # Environment template
├── .gitignore
└── README.md
```

## Available Scripts

### Root Level

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all development servers |
| `npm run dev:api` | Start backend only |
| `npm run dev:web` | Start frontend only |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
| `npm run format` | Format with Prettier |
| `npm run test` | Run all tests |

### Backend (apps/api/)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start NestJS dev server |
| `npm run build` | Build for production |
| `npm run start:prod` | Start production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:reset` | Reset and reseed database |
| `npm run prisma:generate` | Generate Prisma client |

### Frontend (apps/web/)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint with ESLint |

## Database

### Migrations

```bash
# Create a new migration
cd apps/api
npx prisma migrate dev --name <migration-name>

# Apply pending migrations
npx prisma migrate deploy

# Reset database (WARNING: destroys data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Prisma Studio

```bash
cd apps/api
npx prisma studio
```

### Seeding

```bash
cd apps/api
npx prisma db seed
```

## Testing

### Unit Tests

```bash
cd apps/api
npm run test
```

### E2E Tests

```bash
cd apps/api
npm run test:e2e
```

### Frontend Tests

```bash
cd apps/web
npm run test
```

## Code Quality

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

### Type Checking

```bash
# Backend
cd apps/api && npx tsc --noEmit

# Frontend
cd apps/web && npx tsc --noEmit
```

## Git Workflow

1. Create a feature branch from `main`
2. Make changes and commit with conventional commit messages
3. Push and create a pull request
4. Ensure all checks pass
5. Merge after review

### Commit Messages

```
feat: add new feature
fix: fix a bug
docs: update documentation
refactor: refactor code
test: add tests
chore: maintenance tasks
```

## Troubleshooting

### Database Connection Issues

1. Ensure your Supabase project is active
2. Check connection string in `apps/api/.env`
3. Verify DATABASE_URL format: `postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public`

### Build Errors

1. Clear node_modules: `rm -rf node_modules && npm install`
2. Regenerate Prisma client: `npx prisma generate`
3. Check TypeScript: `npx tsc --noEmit`

### CORS Issues

1. Verify `CORS_ORIGIN` in `.env` matches frontend URL
2. Ensure frontend is running on the correct port
