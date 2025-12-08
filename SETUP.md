# Backend Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the `server` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/ipam?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="7d"
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN="http://localhost:5173"
   ```

3. **Set up Prisma:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Create and run migrations
   npm run prisma:migrate

   # (Optional) Seed the database
   npm run prisma:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3000`

## Project Structure

```
server/
├── src/
│   ├── controllers/      # Request handlers
│   ├── middleware/      # Auth, validation, error handling
│   ├── routes/          # API route definitions
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions (IP, JWT, password)
│   ├── validations/     # Zod validation schemas
│   └── index.ts         # Main server entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding script
├── package.json
├── tsconfig.json
└── README.md
```

## API Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Testing the API

After starting the server, you can test the health endpoint:

```bash
curl http://localhost:3000/health
```

## Database

The backend uses PostgreSQL with Prisma ORM. Make sure you have:
- PostgreSQL installed and running, OR
- A Neon (or other PostgreSQL) database URL

Update the `DATABASE_URL` in your `.env` file accordingly.

