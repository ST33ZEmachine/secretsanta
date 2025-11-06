# Quick Deployment Guide

## Option 1: Railway (Backend) + Vercel (Frontend) - Fastest ⚡

### Backend on Railway (5 minutes)

1. **Sign up** at [railway.app](https://railway.app) (free tier available)

2. **Create new project** → "Deploy from GitHub repo"

3. **Select your repository** and set root directory to `backend`

4. **Add environment variables** in Railway dashboard:
   ```
   PORT=5001
   FRONTEND_URL=https://your-frontend.vercel.app (update after deploying frontend)
   JWT_SECRET=<generate-random-string>
   ```

   To generate JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Railway auto-detects** and deploys. Get your backend URL (e.g., `https://your-app.railway.app`)

### Frontend on Vercel (5 minutes)

1. **Sign up** at [vercel.com](https://vercel.com) (free tier)

2. **Import your GitHub repo**

3. **Configure project**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Add environment variable**:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```
   (Replace with your actual Railway backend URL)

5. **Update `vercel.json`**:
   Replace `your-backend-url.railway.app` with your actual backend URL

6. **Deploy!** Vercel will auto-deploy on every push to main

7. **Update backend** `FRONTEND_URL` with your Vercel frontend URL

## Option 2: Render (Both Services) - Single Platform

1. **Sign up** at [render.com](https://render.com)

2. **Deploy Backend**:
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add Environment Variables (see above)
   - Add Persistent Disk (1GB) at `/opt/render/project/src/backend`

3. **Deploy Frontend**:
   - New → Static Site
   - Connect GitHub repo
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add Environment Variable: `VITE_API_URL=https://your-backend-url.onrender.com/api`

## Testing Production

After deployment:

1. Visit your frontend URL
2. Register a new account
3. Create a test group
4. Verify all functionality works

## Important Notes

- **Database**: SQLite files need persistent storage. Railway/Render provide this on paid tiers, or use free tier with limitations
- **HTTPS**: Automatically enabled on all platforms
- **CORS**: Make sure `FRONTEND_URL` matches your actual frontend domain
- **JWT Secret**: Must be the same across all backend instances (if scaling)

## Troubleshooting

**502 Bad Gateway**: Backend not running - check Railway/Render logs
**CORS errors**: Update `FRONTEND_URL` in backend environment variables
**Database not persisting**: Upgrade to paid tier or migrate to PostgreSQL
**404 on routes**: Check Vite build configuration and routing setup

