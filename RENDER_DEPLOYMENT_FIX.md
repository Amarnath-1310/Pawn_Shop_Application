# Render.com Deployment Fix

## Issue
Render was looking for `package.json` in `/opt/render/project/src/package.json`, but the file is in the root directory. This is because Render needs explicit configuration for monorepo structures.

## Solution
Created `render.yaml` configuration file with proper settings for static site deployment.

## Configuration

### File Created: `render.yaml`
```yaml
services:
  - type: web
    name: pawn-broker-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/dist
    envVars:
      - key: NODE_ENV
        value: production
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

## Render Dashboard Configuration

### Option 1: Using render.yaml (Recommended)
1. In Render dashboard, create a new **Static Site**
2. Connect your repository
3. Render will automatically detect `render.yaml`
4. Settings will be read from the file

### Option 2: Manual Configuration
If not using `render.yaml`, set these in Render dashboard:

**Basic Settings:**
- **Name**: `pawn-broker-frontend`
- **Type**: Static Site
- **Repository**: Your Git repository
- **Branch**: `main` (or your default branch)

**Build Settings:**
- **Root Directory**: `.` (root - leave empty or use `.`)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/dist`

**Environment Variables:**
- `NODE_ENV`: `production`

**Routes (for SPA):**
- Add rewrite rule: `/*` → `/index.html`

## Key Points

1. **Root Directory**: Should be `.` (root), not `src` or `frontend`
2. **Build Command**: Navigates to `frontend` directory, installs dependencies, and builds
3. **Publish Directory**: Points to `frontend/dist` where Vite outputs the build
4. **SPA Routing**: Rewrite rule ensures all routes go to `index.html`

## Testing Locally

Before deploying, test the build:

```bash
# From root directory
cd frontend
npm install
npm run build

# Verify dist folder exists with index.html
ls -la frontend/dist
```

## Troubleshooting

### Error: "Could not read package.json"
- **Cause**: Render is looking in wrong directory
- **Fix**: Ensure `Root Directory` is set to `.` (root) or use `render.yaml`

### Error: "Build failed"
- **Cause**: Dependencies not installing or build command failing
- **Fix**: Check build command in `render.yaml` or dashboard settings

### Error: "404 on routes"
- **Cause**: SPA routing not configured
- **Fix**: Add rewrite rule `/*` → `/index.html` in routes section

### Static assets not loading
- **Cause**: Incorrect publish directory
- **Fix**: Ensure `Publish Directory` is `frontend/dist`

## Next Steps

1. **Commit the render.yaml file:**
   ```bash
   git add render.yaml package.json
   git commit -m "Add Render.com deployment configuration"
   git push
   ```

2. **Create Static Site on Render:**
   - Go to Render dashboard
   - Click "New +" → "Static Site"
   - Connect your repository
   - Render will auto-detect `render.yaml` OR manually configure

3. **Deploy:**
   - Render will automatically build and deploy
   - Check deployment logs if issues occur

4. **Verify:**
   - Visit the deployed URL
   - Test routes (e.g., `/signin`, `/dashboard`)
   - Check browser console for errors
   - Verify static assets load correctly

## File Changes

- ✅ Created `render.yaml` - Render deployment configuration
- ✅ Updated `package.json` - Added start script and npm engine requirement

## Alternative: Deploy from Frontend Directory

If you prefer to deploy directly from `frontend` directory:

**Render Dashboard Settings:**
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

This approach doesn't require the root `package.json` or `render.yaml` configuration.

