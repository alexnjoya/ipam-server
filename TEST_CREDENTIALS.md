# Test Login Credentials

## Default Admin User

After running the seed script (`npm run prisma:seed`), you can use:

**Email:** `admin@ipam.com`  
**Password:** `admin123`  
**Role:** `admin`

## Creating Additional Test Users

You can create additional users via the API:

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "test123",
  "role": "user"
}
```

## Sample Users for Testing

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| admin@ipam.com | admin123 | admin | Full access |
| user@ipam.com | user123 | user | Standard user |
| readonly@ipam.com | readonly123 | readonly | Read-only access |

**Note:** These users are created by the seed script. Make sure to run `npm run prisma:seed` first.

