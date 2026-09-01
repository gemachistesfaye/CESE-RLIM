# CESE-RLIM Production Deployment Guide

## Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **PostgreSQL**: v14+ (Supabase or self-hosted)
- **npm**: v9+
- **Supabase account** (for storage) — optional if using local storage

## 1. Database Setup

### Option A: Supabase (Recommended)

1. Create a Supabase project at https://supabase.com
2. Go to **Settings → Database → Connection string → URI**
3. Copy the connection string and set as `DATABASE_URL`

### Option B: Self-hosted PostgreSQL

1. Create a database named `cese_rlim`
2. Set `DATABASE_URL=postgresql://user:password@host:5432/cese_rlim?schema=public`

## 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=<generate-a-strong-random-secret>
CORS_ORIGIN=https://your-domain.com

# Storage (choose one)
STORAGE_PROVIDER=supabase          # or 'local' for development
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
STORAGE_BUCKET=research-documents

# Optional
PORT=3000
NODE_ENV=production
JWT_EXPIRES_IN=24h
```

### Generate a strong JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 3. Build

```bash
# Install dependencies
npm install

# Generate Prisma client
cd apps/api
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build backend
npm run build

# Build frontend
cd ../web
npm run build
```

## 4. Run Migrations

```bash
cd apps/api
npx prisma migrate deploy
```

This applies all pending migrations. Safe to run multiple times.

## 5. Seed Database (Optional)

```bash
cd apps/api
npm run db:seed
```

Creates default admin user and sample data.

## 6. Start Production Server

### Backend

```bash
cd apps/api
node dist/main
```

The API will run on `http://localhost:3000` (or the `PORT` env var).

### Frontend

The frontend is a static build. Serve `apps/web/dist/` with any static file server or reverse proxy.

```bash
# Option 1: Vite preview
cd apps/web
npm run preview

# Option 2: Serve with nginx (recommended for production)
# Point nginx to apps/web/dist/
```

## 7. Nginx Configuration (Recommended)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/apps/web/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 8. Health Check

```bash
curl http://localhost:3000/api/v1/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-09-01T..."
  }
}
```

## 9. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret for JWT signing |
| `CORS_ORIGIN` | Yes | `http://localhost:5173` | Allowed CORS origin |
| `STORAGE_PROVIDER` | No | `local` | `local` or `supabase` |
| `SUPABASE_URL` | If supabase | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | If supabase | — | Supabase service role key |
| `STORAGE_BUCKET` | No | `research-documents` | Supabase storage bucket |
| `PORT` | No | `3000` | API server port |
| `NODE_ENV` | No | `development` | Set to `production` |
| `JWT_EXPIRES_IN` | No | `24h` | JWT token expiry |
| `VITE_API_URL` | Yes (frontend) | `/api/v1` | Backend API URL |

## 10. Security Notes

- **JWT_SECRET**: Use a strong random string (64+ chars). Never commit it to git.
- **CORS_ORIGIN**: Set to your production domain. Never use `*` in production.
- **Supabase keys**: Service role key is backend-only. Never expose to frontend.
- **Swagger**: Automatically disabled when `NODE_ENV=production`.
- **Rate limits**: Login 10/min, global API 100/min, search 30/min.
- **Password policy**: Min 8 chars, requires uppercase, lowercase, and number.

## 11. Troubleshooting

### Database connection errors
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running and accessible
- Check firewall rules

### CORS errors
- Set `CORS_ORIGIN` to your frontend domain
- Include protocol: `https://your-domain.com`

### Storage errors
- For Supabase: verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Ensure the storage bucket exists in Supabase dashboard

### Migration errors
- Run `npx prisma migrate deploy` (not `dev`)
- Check database permissions
