# Render Deployment Configuration

## Important: Manual Configuration Required

If Render doesn't automatically detect `render.yaml`, you **MUST** manually configure these settings in the Render dashboard:

### Build Command
```
npm install && npx prisma generate && npm run build
```

### Start Command
```
node dist/index.js
```

### Environment Variables
- `NODE_ENV` = `production`
- `DATABASE_URL` = (your database connection string)
- `JWT_SECRET` = (your JWT secret)
- `JWT_EXPIRES_IN` = `7d` (optional)

## Why This Is Needed

The build command must:
1. Install dependencies (`npm install`)
2. Generate Prisma client (`npx prisma generate`)
3. Compile TypeScript (`npm run build`)

Without step 3, the `dist/` folder won't be created, and the start command will fail.

## Verification

After deployment, check the build logs to ensure you see:
- `✔ Generated Prisma Client`
- TypeScript compilation output
- `dist/index.js` file exists

