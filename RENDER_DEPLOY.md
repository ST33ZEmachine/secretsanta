# Render Deployment Guide

Step-by-step instructions for deploying to Render.

## Prerequisites

1. **Sign up** at [render.com](https://render.com) (free tier available)
2. **Connect your GitHub account** to Render
3. **Generate JWT Secret** (run this in terminal):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output - you'll need it!

---

## Step 1: Deploy Backend (Web Service)

### 1. Create New Web Service
- Go to Render dashboard
- Click **"New +"** → **"Web Service"**
- Connect your GitHub repository (`secretsanta`)
- Click **"Connect"**

### 2. Configure Backend Service

**Basic Settings:**
- **Name**: `secret-santa-api` (or your choice)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
Click **"Add Environment Variable"** and add:

```
PORT = 5001
FRONTEND_URL = https://your-frontend-name.onrender.com
```

(Update FRONTEND_URL after deploying frontend)

```
JWT_SECRET = <paste-your-generated-secret>
```

**Persistent Disk (Important for SQLite):**
- Scroll down to **"Advanced"**
- Click **"Add Disk"**
- **Name**: `database-disk`
- **Mount Path**: `/opt/render/project/src/backend`
- **Size**: 1 GB (minimum)

### 3. Deploy
- Click **"Create Web Service"**
- Render will start building and deploying
- Wait for deployment to complete (3-5 minutes)
- Get your backend URL from the dashboard (e.g., `https://secret-santa-api.onrender.com`)

---

## Step 2: Deploy Frontend (Static Site)

### 1. Create New Static Site
- Go to Render dashboard
- Click **"New +"** → **"Static Site"**
- Connect your GitHub repository (if not already connected)
- Click **"Connect"**

### 2. Configure Frontend Service

**Basic Settings:**
- **Name**: `secret-santa` (or your choice)
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

**Environment Variables:**
Click **"Add Environment Variable"** and add:

```
VITE_API_URL = https://secret-santa-api.onrender.com/api
```

(Use your actual backend URL from Step 1)

### 3. Deploy
- Click **"Create Static Site"**
- Render will start building and deploying
- Wait for deployment to complete (2-3 minutes)
- Get your frontend URL (e.g., `https://secret-santa.onrender.com`)

---

## Step 3: Update Backend FRONTEND_URL

1. Go back to your **backend service** in Render
2. Go to **"Environment"** tab
3. Update `FRONTEND_URL` to your frontend URL:
   ```
   FRONTEND_URL = https://secret-santa.onrender.com
   ```
4. Render will automatically redeploy

---

## Step 4: Test Your Deployment

1. Visit your frontend URL
2. Register a new account
3. Create a test group
4. Test all functionality

---

## Custom Domain (Optional)

If you want a custom domain:

1. In your Render service → **"Settings"**
2. Scroll to **"Custom Domains"**
3. Add your domain
4. Follow DNS configuration instructions

---

## Important Notes

- **Free Tier**: Services spin down after 15 minutes of inactivity (first request will be slow)
- **Database Persistence**: The persistent disk ensures your SQLite database survives deploys
- **Environment Variables**: Keep `JWT_SECRET` secret and consistent
- **HTTPS**: Automatically enabled on all Render services

---

## Troubleshooting

**Build fails:**
- Check build logs in Render dashboard
- Verify Root Directory is correct (`backend` or `frontend`)
- Ensure build commands are correct

**Database not persisting:**
- Verify persistent disk is mounted correctly
- Check mount path matches your database location

**CORS errors:**
- Make sure `FRONTEND_URL` in backend matches your actual frontend URL exactly
- Check for trailing slashes (should be no trailing slash)

**404 on routes:**
- For static sites, add a `_redirects` file (see below)

---

## Adding Redirects for React Router

Create `frontend/public/_redirects` file:

```
/*    /index.html   200
```

This ensures all routes work correctly on Render's static hosting.

