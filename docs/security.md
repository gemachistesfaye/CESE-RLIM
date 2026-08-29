# Security

## Overview

CESE-RLIM implements security best practices for authentication, authorization, data protection, and application security.

## Authentication

### JWT (JSON Web Tokens)

- Tokens are issued upon successful login
- Tokens expire after configured duration (default: 24 hours)
- Tokens are validated on every protected request
- Tokens are transmitted via `Authorization: Bearer <token>` header

### Password Security

- Passwords are hashed using bcryptjs with 10 salt rounds
- Plain-text passwords are never stored
- Passwords are never logged
- Minimum password length: 6 characters

### Login Security

- Generic error message for invalid credentials (does not reveal whether email exists)
- Account deactivation support
- Last login timestamp tracking

## Authorization

### Role-Based Access Control (RBAC)

| Action | Admin | Coordinator | Researcher | Technician |
|--------|-------|-------------|------------|------------|
| View Users | ✓ | ✓ | — | — |
| Create User | ✓ | — | — | — |
| Update User | ✓ | — | — | — |
| Change Role | ✓ | — | — | — |
| Activate/Deactivate User | ✓ | ✓ | — | — |
| View Researchers | ✓ | ✓ | ✓ | ✓ |
| Create Researcher | ✓ | ✓ | — | — |
| Update Researcher | ✓ | ✓ | — | — |
| Edit Own Profile | ✓ | ✓ | ✓ | ✓ |
| View Own Profile | ✓ | ✓ | ✓ | ✓ |

### Implementation

- `@UseGuards(JwtAuthGuard)` — Requires valid JWT
- `@UseGuards(RolesGuard)` — Checks role permissions
- `@Roles(UserRole.ADMIN, UserRole.COORDINATOR)` — Specifies required roles
- `@Public()` — Bypasses authentication

## Data Protection

### Environment Variables

- `JWT_SECRET` — Strong random secret, never committed to Git
- `DATABASE_URL` — Database credentials, never committed to Git
- `.env` files are gitignored
- `.env.example` contains only placeholder values

### Sensitive Data Handling

- Passwords are never included in API responses
- Passwords are never logged
- JWT tokens are not included in application logs
- Database credentials are not exposed in error messages

### API Responses

- Internal error details are not exposed to clients
- Stack traces are not sent to frontend
- Database errors are converted to generic messages

## Input Validation

### Backend

- `class-validator` with `whitelist: true` strips unknown properties
- `forbidNonWhitelisted: true` rejects unknown properties
- `transform: true` automatically transforms input types
- DTO validation on all endpoints

### Frontend

- Zod schemas for form validation
- React Hook Form with resolver integration
- Client-side validation before API calls

## CORS

- Configured via `CORS_ORIGIN` environment variable
- Credentials allowed for authenticated requests
- Only the frontend origin is allowed by default

## Headers

Security headers should be added in production:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`

## Audit Logging

The `AuditLog` model tracks important user-management actions:

| Action | Logged | Description |
|--------|--------|-------------|
| CREATE user | ✓ | New user account created |
| UPDATE user | ✓ | Profile fields changed |
| ROLE_CHANGE | ✓ | User role modified |
| ACTIVATE | ✓ | Account reactivated |
| DEACTIVATE | ✓ | Account deactivated |
| CREATE researcher | ✓ | New researcher profile created |
| UPDATE researcher | ✓ | Researcher profile updated |

Each log entry includes:
- `userId` — Who performed the action
- `action` — What was done
- `entityType` — User, Researcher, etc.
- `entityId` — ID of the affected record
- `description` — Human-readable description
- `metadata` — Additional context (e.g., previous/new role)
- Timestamp via `createdAt`

Passwords and password hashes are never stored in audit logs.

## Production Recommendations

1. **HTTPS**: Always use HTTPS in production
2. **Secrets**: Use a secrets manager (AWS Secrets Manager, HashiCorp Vault)
3. **Database**: Use a managed PostgreSQL service
4. **Rate Limiting**: Implement API rate limiting
5. **Helmet**: Use `@nestjs/helmet` for security headers
6. **CSP**: Implement Content Security Policy
7. **Logging**: Use structured logging with sensitive data redaction
8. **Backups**: Regular database backups
9. **Monitoring**: Set up application monitoring and alerting

## Known Limitations

- JWT stored in localStorage (consider httpOnly cookies for production)
- No rate limiting implemented yet
- No account lockout after failed attempts
- No password complexity requirements beyond minimum length
