# Vercel Deployment Fix

## Issues Fixed

### 1. **Static Assets Routing**
- **Problem**: The rewrite rule `/(.*)` was catching ALL requests including static assets
- **Solution**: Updated rewrite to exclude static assets: `/((?!assets|icons|manifest|sw|.*\\.).*)`
- This ensures:
  - Static assets in `/assets/` are served directly
  - Files with extensions (`.js`, `.css`, `.png`, etc.) are served directly
  - Only routes (without extensions) go to `index.html` for SPA routing

### 2. **Build Configuration**
- Added explicit build configuration for monorepo structure:
  - `buildCommand`: `cd frontend && npm install && npm run build`
  - `outputDirectory`: `frontend/dist`
  - `installCommand`: `cd frontend && npm install`
  - `framework`: `vite`

### 3. **Cache Headers**
- Added proper cache headers for:
  - Static assets: Long cache (1 year)
  - Service worker: No cache
  - Manifest: Short cache (1 hour)

### 4. **Security Headers**
- Added `Referrer-Policy` header for better security

## Vercel Dashboard Configuration

If deploying from root directory, set in Vercel Dashboard:

**Build & Development Settings:**
- **Framework Preset**: Vite
- **Root Directory**: `frontend` (or leave empty if using root `vercel.json`)
- **Build Command**: `npm run build` (if root directory is `frontend`) OR `cd frontend && npm install && npm run build` (if root directory is root)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**OR use root directory deployment with the root `vercel.json`:**

- **Root Directory**: `.` (root)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd frontend && npm install`

## Testing Locally

```bash
# Build locally to test
cd frontend
npm run build

# Preview the build
npm run preview
```

## Common Issues Resolved

1. ✅ **404 errors on routes** - Fixed with proper SPA rewrite
2. ✅ **Static assets not loading** - Fixed by excluding assets from rewrite
3. ✅ **Build errors** - Fixed with explicit build configuration
4. ✅ **Routing errors** - Fixed with proper regex pattern

## File Changes

- `vercel.json` (root) - Updated with build config and improved rewrites
- `frontend/vercel.json` - Updated with improved rewrites and cache headers

## Next Steps

1. **Commit changes**:
   ```bash
   git add vercel.json frontend/vercel.json
   git commit -m "Fix Vercel deployment configuration"
   git push
   ```

2. **Redeploy on Vercel**:
   - The deployment should automatically trigger
   - Or manually trigger from Vercel dashboard

3. **Verify deployment**:
   - Check that all routes work
   - Check that static assets load
   - Check browser console for errors

