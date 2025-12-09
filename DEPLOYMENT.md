# Render Deployment Guide

## Critical Configuration

### 1. Root Directory
Set the **Root Directory** in Render to:
```
server
```
(If your repository has both `client` and `server` folders)

### 2. Build Command
```
npm run build
```

### 3. Start Command (CRITICAL - MUST BE EXACT!)
**MUST be set to EXACTLY:**
```
npm start
```

**DO NOT use:**
- ❌ `node dist/index.js` ← This is what's causing your error!
- ❌ `node start.js`
- ❌ `npm run start`
- ❌ `cd server && npm start` (unless Root Directory is wrong)

**Why `npm start`?**
- Uses the `start.js` script which automatically finds `dist/index.js` in multiple possible locations
- Works regardless of Render's working directory
- Handles all edge cases

**If you're still getting errors:**
1. Double-check the Start Command field in Render dashboard
2. Make sure there are no extra spaces or characters
3. Save the settings
4. Trigger a manual redeploy (don't just wait for auto-deploy)

## Environment Variables

Set these in Render's Environment Variables section:

```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
PORT=10000
```

Note: Render automatically sets `PORT`, but you can override it if needed.

## Troubleshooting

### Error: "Cannot find module '/opt/render/project/src/dist/index.js'"

**Cause:** Render is running `node dist/index.js` directly instead of `npm start`, OR Render's root directory is set incorrectly.

**Solution (Two Options):**

**Option 1 (Recommended):** Use `npm start`
1. Go to Render Dashboard → Your Service → Settings
2. Find "Start Command"
3. Change it to: `npm start`
4. Save and redeploy

**Option 2:** Fix Root Directory
1. Go to Render Dashboard → Your Service → Settings
2. Find "Root Directory"
3. Set it to: `server` (if your repo has both client and server folders)
4. Keep Start Command as: `npm start` (still recommended)
5. Save and redeploy

**Note:** The build process now automatically creates `src/dist/` as a backup location, so even if Render runs `node dist/index.js` from the wrong directory, it should work. However, using `npm start` is still the recommended approach.

### Error: "prisma: not found"

**Cause:** Prisma CLI not found during build.

**Solution:** The build script uses `npx prisma@5.19.0 generate` which should work. If it doesn't:
1. Ensure `prisma` is in `dependencies` (not `devDependencies`)
2. Check that `.npmrc` file exists with `legacy-peer-deps=true`

### Build succeeds but server won't start

**Check:**
1. Root Directory is set correctly
2. Start Command is `npm start`
3. All environment variables are set
4. Database is accessible from Render

## Verification

After deployment, check:
- Health endpoint: `https://your-app.onrender.com/health`
- API docs: `https://your-app.onrender.com/api-docs`

## Database Setup

After first deployment:
1. Connect to your Render database via SSH or use Prisma Studio locally
2. Run migrations:
   ```bash
   npm run prisma:migrate
   ```
3. Optionally seed:
   ```bash
   npm run prisma:seed
   ```

