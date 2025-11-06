# Deployment Guide

This guide covers deploying the Secret Santa app to production.

## Architecture

- **Frontend**: React + Vite (static site)
- **Backend**: Node.js + Express + SQLite
- **Database**: SQLite (file-based)

## Deployment Options

### Option 1: Vercel (Frontend) + Railway/Render (Backend) ⭐ Recommended

**Frontend on Vercel:**
- Free tier available
- Automatic deployments from Git
- Great for static React apps

**Backend on Railway or Render:**
- Easy Node.js deployment
- Persistent file storage for SQLite
- Environment variable management

### Option 2: Render (Full Stack)

- Can deploy both frontend and backend
- Free tier available
- Persistent disk for SQLite database

### Option 3: DigitalOcean App Platform

- Managed platform
- Supports both frontend and backend
- Persistent storage available

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5001
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database (optional - defaults to backend/database.sqlite)
DATABASE_PATH=/path/to/database.sqlite

# Email (optional - for sending invitations)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Frontend Environment Variables

The frontend uses `/api` as the base URL, which will need to point to your backend in production.

## Step-by-Step Deployment

### Deploy Backend (Railway)

1. **Install Railway CLI** (optional, or use web interface):
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Initialize Railway project**:
   ```bash
   cd backend
   railway init
   ```

3. **Set environment variables** in Railway dashboard:
   - `PORT` (auto-set by Railway)
   - `FRONTEND_URL` (your frontend URL)
   - `JWT_SECRET` (generate a strong random string)
   - `DATABASE_PATH` (optional, defaults to `/app/database.sqlite`)

4. **Deploy**:
   ```bash
   railway up
   ```

   Or use the Railway web interface to connect your GitHub repo.

5. **Get your backend URL** from Railway (e.g., `https://your-app.railway.app`)

### Deploy Frontend (Vercel)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Update Vite config** for production:
   - The frontend uses `/api` which should proxy to your backend
   - For Vercel, you'll need to configure rewrites

3. **Create `vercel.json`** in the frontend directory (see below)

4. **Deploy**:
   ```bash
   cd frontend
   vercel
   ```

   Or connect your GitHub repo to Vercel.

5. **Set environment variables** in Vercel dashboard:
   - `VITE_API_URL` (your backend URL from Railway)

### Alternative: Deploy Both on Render

1. **Create a new Web Service** for the backend
2. **Set build command**: `cd backend && npm install && npm run build`
3. **Set start command**: `cd backend && npm start`
4. **Set environment variables** (same as Railway)
5. **Create a new Static Site** for the frontend
6. **Set build command**: `cd frontend && npm install && npm run build`
7. **Set publish directory**: `frontend/dist`

## Important Notes

1. **Database**: SQLite files are ephemeral on most platforms. Consider:
   - Using a persistent volume (Railway Pro, Render Persistent Disk)
   - Migrating to PostgreSQL for production
   - Regular database backups

2. **CORS**: Make sure `FRONTEND_URL` in backend matches your actual frontend URL

3. **JWT Secret**: Use a strong, random secret in production (not the fallback)

4. **Email**: Optional but recommended for invitations. Use app-specific passwords for Gmail.

5. **Rate Limiting**: Current limit is 200 requests per 15 minutes. Adjust in `backend/src/index.ts` if needed.

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure `FRONTEND_URL` correctly
- [ ] Set up database backups (SQLite)
- [ ] Configure email service (optional)
- [ ] Test all functionality in production
- [ ] Set up monitoring/logging
- [ ] Configure custom domain (optional)
- [ ] Enable HTTPS (automatic on most platforms)

## Database Migration to PostgreSQL (Optional)

For production, consider migrating from SQLite to PostgreSQL for better reliability:

1. Install `pg` and `pg-native` packages
2. Update database connection in `backend/src/utils/database.ts`
3. Update schema to use PostgreSQL syntax
4. Set `DATABASE_URL` environment variable

