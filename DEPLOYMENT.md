# Deployment Guide - ShadowDraw

## Prerequisites
- GitHub account
- MongoDB Atlas account (already set up)
- Vercel account (free)
- Render account (free)

---

## Step 1: Prepare Your Code

### 1.1 Create .env file for SERVER (local testing)
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=your_mongodb_uri_here
FRONTEND_ORIGIN=http://localhost:5173
```

### 1.2 Create .env file for FRONTEND (local testing)
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_SERVER_URL=http://localhost:3001
```

### 1.3 Test locally
```bash
# Terminal 1 - Backend
cd server
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

---

## Step 2: Push to GitHub

```bash
# In project root
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/scribble.git
git push -u origin main
```

---

## Step 3: Deploy Backend to Render

### 3.1 Create Account
1. Go to https://render.com
2. Sign up with GitHub

### 3.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: scribble-backend
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

### 3.3 Add Environment Variables
Click "Environment" tab, add:
```
NODE_ENV = production
PORT = 10000
MONGODB_URI = your_mongodb_atlas_connection_string
FRONTEND_ORIGIN = https://your-app.vercel.app
```

**Note:** Leave FRONTEND_ORIGIN blank for now, update after frontend deployment

### 3.4 Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Copy your backend URL: `https://scribble-backend-xxxx.onrender.com`

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Create Account
1. Go to https://vercel.com
2. Sign up with GitHub

### 4.2 Import Project
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4.3 Add Environment Variables
In "Environment Variables" section:
```
VITE_SERVER_URL = https://scribble-backend-xxxx.onrender.com
```
(Use the URL from Step 3.4)

### 4.4 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Copy your frontend URL: `https://your-app.vercel.app`

---

## Step 5: Update Backend CORS

1. Go back to Render dashboard
2. Open your backend service
3. Go to "Environment" tab
4. Update `FRONTEND_ORIGIN`:
   ```
   FRONTEND_ORIGIN = https://your-app.vercel.app
   ```
5. Save changes (auto-redeploys)

---

## Step 6: Test Your Deployed App

1. Open `https://your-app.vercel.app`
2. Create a test room
3. Join from different devices/browsers
4. Test features:
   - Drawing
   - Code editor
   - Real-time sync
   - Cursor presence

---

## Troubleshooting

### Backend won't connect
- Check Render logs: Dashboard → Logs
- Verify MONGODB_URI is correct
- Check CORS_ORIGIN matches frontend URL

### Frontend shows connection error
- Verify `VITE_SERVER_URL` in Vercel environment variables
- Check backend is running (Render dashboard)
- Wait 60 seconds if backend is "spinning up"

### Database errors
- Check MongoDB Atlas whitelist: Allow 0.0.0.0/0 (all IPs)
- Verify connection string in Render environment variables

---

## Keep Backend Awake (Prevent Sleep)

### Option 1: UptimeRobot (Free)
1. Go to https://uptimerobot.com
2. Create account
3. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-backend.onrender.com/health`
   - Interval: 5 minutes
4. This pings your backend every 5 minutes (keeps it awake)

### Option 2: Cron-Job.org
1. Go to https://cron-job.org
2. Create account
3. Create job:
   - URL: `https://your-backend.onrender.com/health`
   - Interval: Every 10 minutes

---

## Future Updates

### Update Backend
```bash
git add .
git commit -m "Update backend"
git push
```
Render auto-deploys from GitHub!

### Update Frontend
```bash
git add .
git commit -m "Update frontend"
git push
```
Vercel auto-deploys from GitHub!

---

## Costs
- Frontend (Vercel): **FREE**
- Backend (Render): **FREE**
- Database (MongoDB Atlas): **FREE**
- UptimeRobot: **FREE**

**Total: $0/month** 🎉

---

## Support
If you need help:
1. Check Render logs
2. Check Vercel deployment logs
3. Check browser console (F12)
