# API Endpoints Summary

## Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update current user profile
- `PUT /api/auth/password` - Change password

## Subnets (`/api/subnets`)
- `GET /api/subnets` - List all subnets (with pagination, search, filters)
- `GET /api/subnets/:id` - Get subnet by ID (with utilization stats)
- `POST /api/subnets` - Create new subnet
- `PUT /api/subnets/:id` - Update subnet
- `DELETE /api/subnets/:id` - Delete subnet

## IP Addresses (`/api/ip-addresses`)
- `GET /api/ip-addresses` - List IP addresses (with pagination, search, filters)
- `GET /api/ip-addresses/:id` - Get IP address by ID (with history)
- `POST /api/ip-addresses/assign` - Assign IP address (automatic or manual)
- `PUT /api/ip-addresses/:id` - Update IP address
- `POST /api/ip-addresses/:id/release` - Release IP address

## Reservations (`/api/reservations`)
- `GET /api/reservations` - List reservations (with search, subnet filter)
- `GET /api/reservations/:id` - Get reservation by ID
- `POST /api/reservations` - Create IP range reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Delete reservation (releases IPs)

## Reports (`/api/reports`)
- `GET /api/reports/utilization` - Get utilization report (all subnets with stats)
- `GET /api/reports/status` - Get IP status distribution

## Audit (`/api/audit`)
- `GET /api/audit` - Get audit logs (with pagination, filters)
- `GET /api/audit/:id` - Get audit log by ID

## Users (`/api/users`) - Admin Only
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Health Check
- `GET /health` - Server health check

---

## Frontend Page → Endpoint Mapping

### Dashboard
- `GET /api/reports/utilization` - For utilization charts
- `GET /api/subnets` - For recent subnets list

### Subnets Page
- `GET /api/subnets` - List subnets
- `GET /api/subnets/:id` - View subnet details
- `POST /api/subnets` - Create subnet
- `PUT /api/subnets/:id` - Update subnet
- `DELETE /api/subnets/:id` - Delete subnet

### IP Addresses Page
- `GET /api/ip-addresses` - List IP addresses
- `GET /api/ip-addresses/:id` - View IP details
- `POST /api/ip-addresses/assign` - Assign IP
- `PUT /api/ip-addresses/:id` - Update IP
- `POST /api/ip-addresses/:id/release` - Release IP

### Reservations Page
- `GET /api/reservations` - List reservations
- `GET /api/reservations/:id` - View reservation
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Delete reservation

### Reports Page
- `GET /api/reports/utilization` - Utilization report
- `GET /api/reports/status` - Status distribution

### Audit Page
- `GET /api/audit` - List audit logs
- `GET /api/audit/:id` - View audit log details

### Settings Page
- `GET /api/users` - List users (admin)
- `POST /api/users` - Create user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Account Page
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile
- `PUT /api/auth/password` - Change password

---

## Authentication

All endpoints except `/api/auth/register`, `/api/auth/login`, and `/health` require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

## Response Format

All endpoints return JSON in the following format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

