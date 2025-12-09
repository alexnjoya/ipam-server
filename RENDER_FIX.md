# Render Deployment - Final Fix Guide

## The Problem
Render is looking for `/opt/render/project/src/dist/index.js` but can't find it.

## Root Cause
Render is running `node dist/index.js` from `/opt/render/project/src/` directory, which means:
- It's looking for `/opt/render/project/src/dist/index.js`
- But the file is at `/opt/render/project/server/dist/index.js` (if Root Directory is `server`)

## Solution 1: Fix Render Dashboard Settings (RECOMMENDED)

1. **Go to Render Dashboard** → Your Service → Settings
2. **Set Root Directory to:** `server` (if your repo has both client and server)
3. **Set Start Command to:** `npm start` (NOT `node dist/index.js`)
4. **Save and redeploy**

## Solution 2: If Root Directory Can't Be Changed

If Render's Root Directory is stuck at `src` or repo root:

1. **Set Start Command to:** `cd server && npm start`
   OR
2. **Set Start Command to:** `node server/dist/index.js`

## Solution 3: Verify Build Output

The postbuild script should create files in multiple locations. Check Render's build logs for:
```
✓ Created dist at: /opt/render/project/src/dist
✓ Verified index.js exists at: /opt/render/project/src/dist/index.js
```

If you don't see these messages, the postbuild script might not be running.

## Current Build Process

The build now:
1. Compiles TypeScript to `server/dist/`
2. Copies `dist/` to `server/src/dist/` (for Render compatibility)
3. Copies `dist/` to `../src/dist/` (repo root level, for when Root Directory is not set)

## Verification

After deployment, check Render logs for:
- Build success message
- Postbuild completion message
- File verification messages

If files are created but still not found, the issue is with Render's Start Command or Root Directory configuration.

