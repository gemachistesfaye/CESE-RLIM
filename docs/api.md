# API Documentation

## Overview

CESE-RLIM uses RESTful APIs with versioning. All endpoints are prefixed with `/api/v1/`.

## Base URL

```
http://localhost:3000/api/v1
```

## Swagger

Interactive API documentation is available at: `http://localhost:3000/api/docs`

## Authentication

### POST /auth/login

Login with email and password.

**Request:**
```json
{
  "email": "admin@cese-rlim.local",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "admin@cese-rlim.local",
      "firstName": "Abebe",
      "lastName": "Kebede",
      "role": "ADMIN"
    }
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### GET /auth/me

Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "admin@cese-rlim.local",
  "role": "ADMIN"
}
```

### POST /auth/logout

Logout (client discards token).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

## Health Check

### GET /health

Returns system health status with database connectivity check.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Users

### GET /users

Get all users with pagination, search, and filtering.

**Headers:** `Authorization: Bearer <token>`
**Required Role:** ADMIN or COORDINATOR

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `search` | string | Search by firstName, lastName, email, phone |
| `role` | enum | Filter by role: ADMIN, COORDINATOR, RESEARCHER, TECHNICIAN |
| `isActive` | string | Filter by status: "true" or "false" |

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Abebe",
      "lastName": "Kebede",
      "phone": "+251911000001",
      "role": "ADMIN",
      "isActive": true,
      "lastLoginAt": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 86,
    "totalPages": 5
  }
}
```

### GET /users/:id

Get user by ID.

**Required Role:** ADMIN or COORDINATOR

### POST /users

Create a new user account.

**Required Role:** ADMIN only

**Request:**
```json
{
  "firstName": "Abebe",
  "lastName": "Kebede",
  "email": "abebe@example.com",
  "phone": "+251911000001",
  "role": "RESEARCHER",
  "password": "password123"
}
```

**Validations:**
- `firstName`: required, max 100 chars
- `lastName`: required, max 100 chars
- `email`: required, valid email, unique (case-insensitive)
- `phone`: optional, max 20 chars
- `role`: required, must be ADMIN | COORDINATOR | RESEARCHER | TECHNICIAN
- `password`: required, min 6 chars, max 128 chars

**Response (201):** Returns created user (without passwordHash).

**Errors:**
- `409 Conflict` — Email already exists

### PATCH /users/:id

Update user profile fields (firstName, lastName, phone).

**Required Role:** ADMIN only

### PATCH /users/:id/role

Change a user's role.

**Required Role:** ADMIN only

**Request:**
```json
{
  "role": "COORDINATOR"
}
```

**Errors:**
- `403 Forbidden` — Cannot remove the last active administrator
- `403 Forbidden` — Only administrators can change roles

### PATCH /users/:id/status

Activate or deactivate a user account.

**Required Role:** ADMIN or COORDINATOR

**Request:**
```json
{
  "isActive": false
}
```

**Errors:**
- `403 Forbidden` — Cannot deactivate your own account

## Researchers

### GET /researchers

Get all researchers with pagination, search, and filtering.

**Headers:** `Authorization: Bearer <token>`
**Required Role:** Any authenticated user

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `search` | string | Search by name, ID, department, expertise |
| `department` | string | Filter by department |
| `position` | string | Filter by academic position |

### GET /researchers/me

Get the current authenticated researcher's profile.

**Required Role:** RESEARCHER only

### GET /researchers/:id

Get researcher by ID with user information.

### POST /researchers

Create a researcher with a linked user account (transactional).

**Required Role:** ADMIN or COORDINATOR

**Request:**
```json
{
  "firstName": "Daniel",
  "lastName": "Tesfaye",
  "email": "daniel@example.com",
  "phone": "+251911000003",
  "password": "password123",
  "employeeOrStudentId": "ASTU-RES-003",
  "department": "Electrical Engineering",
  "academicPosition": "Assistant Professor",
  "researchAreas": "Power Systems, Renewable Energy",
  "expertise": "Power electronics",
  "orcid": "0000-0001-2345-6789",
  "bio": "Specialist in power systems research."
}
```

**Errors:**
- `409 Conflict` — Duplicate email or employee/student ID

### PATCH /researchers/:id

Update researcher profile (admin/coordinator only).

### PATCH /researchers/me/profile

Update own researcher profile (self-service for researchers).

## Laboratories

### GET /laboratories

Get all laboratories with pagination, search, and filtering.

**Headers:** `Authorization: Bearer <token>`
**Required Role:** Any authenticated user

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `search` | string | Search by name, code, location, description |
| `status` | enum | Filter by status: ACTIVE, INACTIVE, UNDER_MAINTENANCE |
| `location` | string | Filter by location (partial match) |

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Power Systems Research Lab",
      "code": "PSRL-001",
      "location": "Block B, Room 204",
      "description": "Dedicated to power systems research.",
      "capacity": 25,
      "responsiblePersonId": null,
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "_count": { "equipment": 12 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

### GET /laboratories/:id

Get laboratory by ID with equipment list.

**Required Role:** Any authenticated user

**Response (200):** Returns laboratory with `equipment` array containing id, name, assetId, category, condition, status.

### POST /laboratories

Create a new laboratory.

**Required Role:** ADMIN or COORDINATOR

**Request:**
```json
{
  "name": "Power Systems Research Lab",
  "code": "PSRL-001",
  "location": "Block B, Room 204, Engineering Faculty",
  "description": "Dedicated to power systems and renewable energy research.",
  "capacity": 25,
  "responsiblePersonId": "uuid-of-user"
}
```

**Validations:**
- `name`: required, max 200 chars
- `code`: required, max 50 chars, unique (auto-uppercased)
- `location`: required, max 300 chars
- `description`: optional, max 2000 chars
- `capacity`: optional, positive integer
- `responsiblePersonId`: optional, must be valid User UUID

**Errors:**
- `409 Conflict` — Code already exists
- `404 Not Found` — Responsible person not found

### PATCH /laboratories/:id

Update laboratory information.

**Required Role:** ADMIN or COORDINATOR

All fields optional. Only provided fields are updated.

### PATCH /laboratories/:id/status

Change laboratory status.

**Required Role:** ADMIN or COORDINATOR

**Request:**
```json
{
  "status": "INACTIVE"
}
```

**Valid values:** ACTIVE, INACTIVE, UNDER_MAINTENANCE

## Equipment

### GET /equipment

Get all equipment.

**Query Parameters:**
- `laboratoryId` — Filter by laboratory

### GET /equipment/:id

Get equipment by ID.

## Response Format

### Success

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

### Error

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

## Rate Limiting

Rate limiting will be implemented in future versions. Currently not enforced.

## CORS

CORS is configured via the `CORS_ORIGIN` environment variable. Default: `http://localhost:5173`
