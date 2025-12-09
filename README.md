# IPAM Server

IP Address Management System Backend API

## Features

- RESTful API for IP address and subnet management
- JWT-based authentication
- PostgreSQL database with Prisma ORM
- Swagger/OpenAPI documentation
- TypeScript for type safety
- Zod for request validation

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Neon PostgreSQL)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp example.env .env
```

Edit `.env` and add your database connection string and JWT secret.

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Seed the database (optional):
```bash
npm run prisma:seed
```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Documentation

### Swagger UI

Once the server is running, access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

The Swagger UI provides:
- Complete API endpoint documentation
- Interactive endpoint testing
- Request/response schema definitions
- Authentication support (JWT Bearer token)

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update current user profile
- `PUT /api/auth/password` - Change password

#### Subnets (`/api/subnets`)
- `GET /api/subnets` - List all subnets (with pagination, search, filters)
- `GET /api/subnets/:id` - Get subnet by ID (with utilization stats)
- `POST /api/subnets` - Create new subnet
- `PUT /api/subnets/:id` - Update subnet
- `DELETE /api/subnets/:id` - Delete subnet

#### IP Addresses (`/api/ip-addresses`)
- `GET /api/ip-addresses` - List IP addresses (with pagination, search, filters)
- `GET /api/ip-addresses/:id` - Get IP address by ID (with history)
- `POST /api/ip-addresses/assign` - Assign IP address (automatic or manual)
- `PUT /api/ip-addresses/:id` - Update IP address
- `POST /api/ip-addresses/:id/release` - Release IP address

#### Reservations (`/api/reservations`)
- `GET /api/reservations` - List reservations (with search, subnet filter)
- `GET /api/reservations/:id` - Get reservation by ID
- `POST /api/reservations` - Create IP range reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Delete reservation (releases IPs)

#### Reports (`/api/reports`)
- `GET /api/reports/utilization` - Get utilization report (all subnets with stats)
- `GET /api/reports/status` - Get IP status distribution

#### Audit (`/api/audit`)
- `GET /api/audit` - Get audit logs (with pagination, filters)
- `GET /api/audit/:id` - Get audit log by ID

#### Users (`/api/users`) - Admin Only
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

To get a token:
1. Register a new user: `POST /api/auth/register`
2. Or login: `POST /api/auth/login`

## Test Credentials

After seeding the database, you can use:

- Email: `admin@ipam.com`
- Password: `admin123`

See `TEST_CREDENTIALS.md` for more details.

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
  "data": {
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## Database Management

### Prisma Studio
View and edit database records:
```bash
npm run prisma:studio
```

### Create Migration
```bash
npm run prisma:migrate
```

### Reset Database (⚠️ WARNING: Deletes all data)
```bash
npx prisma migrate reset
```

## Environment Variables

See `example.env` for all available environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time (default: 7d)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origin

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files (Swagger, etc.)
│   ├── controllers/      # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── validations/     # Zod validation schemas
│   └── index.ts         # Application entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seed script
├── .env                 # Environment variables (not in git)
├── example.env          # Example environment variables
└── package.json         # Dependencies and scripts
```

## Development

### TypeScript
The project uses TypeScript with strict type checking. Build errors will prevent the server from starting in development mode.

### Code Style
- Use async/await for asynchronous operations
- Use Zod for request validation
- Follow RESTful API conventions
- Document endpoints with Swagger JSDoc comments

## Deployment

### Render.com

This project is configured for deployment on Render.com. Follow these steps:

1. **Create a new Web Service** on Render
2. **Connect your repository** (GitHub/GitLab)
3. **Configure the service (CRITICAL - READ CAREFULLY):**
   - **Root Directory:** `server` (if your repo has both client and server)
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start` ⚠️ **MUST BE `npm start` - NOT `node dist/index.js`**
   - **Node Version:** 18 or higher (specified in `package.json` engines)

**⚠️ IMPORTANT:** The Start Command **MUST** be set to `npm start`. 
- ❌ **DO NOT use:** `node dist/index.js`
- ❌ **DO NOT use:** `node start.js`
- ✅ **MUST use:** `npm start`

The `npm start` command uses the `start.js` script which automatically locates `dist/index.js` regardless of Render's working directory.

4. **Set Environment Variables** in Render dashboard:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - A secure random string for JWT tokens
   - `JWT_EXPIRES_IN` - Token expiration (default: `7d`)
   - `PORT` - Server port (Render sets this automatically, but you can override)
   - `NODE_ENV` - Set to `production`
   - `CORS_ORIGIN` - Your frontend URL (e.g., `https://your-app.vercel.app`)

5. **Database Setup:**
   - Create a PostgreSQL database on Render (or use an external service like Neon)
   - Run migrations after first deployment:
     ```bash
     npm run prisma:migrate
     ```
   - Optionally seed the database:
     ```bash
     npm run prisma:seed
     ```

**Important Notes:**
- The `start.js` script automatically locates `dist/index.js` in multiple possible paths
- Prisma client is generated automatically during `postinstall` and `build`
- The `.npmrc` file ensures consistent dependency resolution
- All TypeScript code is compiled to JavaScript in the `dist/` folder

### Troubleshooting

**Error: "Cannot find module '/opt/render/project/src/dist/index.js'":**
- **This means Render is NOT using `npm start`**
- Go to Render Dashboard → Your Service → Settings → Start Command
- Change it to: `npm start` (NOT `node dist/index.js`)
- Save and redeploy

**Build fails with "prisma: not found":**
- Ensure `prisma` is in `dependencies` (not just `devDependencies`)
- The build script uses `npx prisma@5.19.0 generate` to ensure the correct version

**Cannot find module 'dist/index.js':**
- Verify Start Command is set to `npm start` (not `node dist/index.js`)
- The `start.js` script searches multiple paths automatically
- Check that the build completed successfully
- Verify the `dist/` folder exists after build

**Prisma version mismatch:**
- Both `prisma` and `@prisma/client` are pinned to `5.19.0`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

**For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

## License

ISC
