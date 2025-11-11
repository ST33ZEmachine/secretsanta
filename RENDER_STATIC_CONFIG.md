# Render Static Site Configuration for React Router

## The Problem
When accessing routes like `/join/:token` directly, Render returns 404 because it's looking for a physical file that doesn't exist.

## Solution: Configure Redirects in Render Dashboard

Since Render doesn't automatically use `_redirects` files, you need to configure redirects in the Render dashboard:

### Steps:
1. Go to your Render dashboard
2. Select your **frontend static site** service
3. Go to **Settings** → **Redirects/Rewrites** (or **Custom Headers**)
4. Add a redirect rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Type**: Rewrite (not redirect)
5. Save and redeploy

### Alternative: Use render.yaml
If you're using `render.yaml`, you can add redirects there:

```yaml
services:
  - type: web
    name: secret-santa-frontend
    env: static
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

## Why This Works
- All routes (`/*`) are rewritten to `/index.html`
- React Router then handles the client-side routing
- The URL stays the same (no redirect), so `/join/abc123` still shows as `/join/abc123` in the browser

