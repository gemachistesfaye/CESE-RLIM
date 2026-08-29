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

Get all users (admin/coordinator only).

**Headers:** `Authorization: Bearer <token>`
**Required Role:** ADMIN or COORDINATOR

## Researchers

### GET /researchers

Get all researchers.

### GET /researchers/:id

Get researcher by ID.

## Laboratories

### GET /laboratories

Get all laboratories with equipment count.

### GET /laboratories/:id

Get laboratory by ID with equipment list.

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
