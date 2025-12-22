# 🎯 DEPLOYMENT COMMANDS - Copy & Paste

## STEP 1: Setup Local Environment (2 minutes)

```bash
# In server folder
cd server
cp .env.example .env

# Now edit server/.env and add:
# MONGODB_URI=your_mongodb_atlas_uri_here

# In frontend folder
cd ../frontend
cp .env.example .env

# Default values are fine for local testing
```

---

## STEP 2: Test Locally (5 minutes)

```bash
# Terminal 1 - Backend
cd server
npm install
npm start
# Should see: "Server running on port 3001"

# Terminal 2 - Frontend (new terminal)
cd frontend
npm install
npm run dev
# Should see: "Local: http://localhost:5173"
```

Open http://localhost:5173 in your browser. If it works, proceed!

---

## STEP 3: Push to GitHub (3 minutes)

```bash
# In project root (scribble folder)
git init
git add .
git commit -m "Initial commit - ready for deployment"

# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## STEP 4: Deploy Backend to Render (10 minutes)

### 4.1 Go to https://render.com
- Sign up with GitHub (free)
- Click "New +" → "Web Service"
- Connect your GitHub repo

### 4.2 Configure Service:
```
Name: scribble-backend
Region: Oregon (US West)
Branch: main
Root Directory: server
Runtime: Node
Build Command: npm install
Start Command: node server.js
Instance Type: Free
```

### 4.3 Add Environment Variables (click "Advanced"):
```
NODE_ENV = production
PORT = 10000
MONGODB_URI = mongodb+srv://your-connection-string-here
FRONTEND_ORIGIN = (leave empty for now)
```

### 4.4 Click "Create Web Service"
- Wait 5-10 minutes for deployment
- **SAVE THIS URL:** https://scribble-backend-XXXX.onrender.com

---

## STEP 5: Deploy Frontend to Vercel (5 minutes)

### 5.1 Go to https://vercel.com
- Sign up with GitHub (free)
- Click "Add New..." → "Project"
- Import your GitHub repo

### 5.2 Configure Project:
```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build (auto-detected)
Output Directory: dist (auto-detected)
```

### 5.3 Add Environment Variable:
```
Name: VITE_SERVER_URL
Value: https://scribble-backend-XXXX.onrender.com
(Use the URL from Step 4.4)
```

### 5.4 Click "Deploy"
- Wait 2-3 minutes
- **SAVE THIS URL:** https://your-app-name.vercel.app

---

## STEP 6: Update Backend CORS (2 minutes)

### 6.1 Go back to Render Dashboard
- Click on your "scribble-backend" service
- Go to "Environment" tab
- Find `FRONTEND_ORIGIN` variable
- Edit and add: `https://your-app-name.vercel.app`
- Click "Save Changes"
- Wait 2-3 minutes for auto-redeploy

---

## STEP 7: Test Your App! 🎉

### 7.1 Open your Vercel URL
```
https://your-app-name.vercel.app
```

### 7.2 Test Features:
- [ ] Create a room (as teacher)
- [ ] Join room from another browser/tab (as student)
- [ ] Draw something - should sync
- [ ] Type in code editor - should sync
- [ ] Test cursor presence
- [ ] Promote a stroke to public

If everything works - **YOU'RE LIVE!** 🚀

---

## STEP 8: Keep Backend Awake (Optional, 5 minutes)

### Without this, backend sleeps after 15 min of inactivity

### 8.1 Go to https://uptimerobot.com
- Sign up (free)
- Click "Add New Monitor"

### 8.2 Configure Monitor:
```
Monitor Type: HTTP(s)
Friendly Name: Scribble Backend
URL: https://scribble-backend-XXXX.onrender.com/health
Monitoring Interval: 5 minutes
```

### 8.3 Click "Create Monitor"
- Done! Your backend will never sleep 😴

---

## 📊 Expected Timeline

| Step | Time | Result |
|------|------|--------|
| 1. Setup .env | 2 min | Local config ready |
| 2. Test locally | 5 min | App works locally |
| 3. Push to GitHub | 3 min | Code on GitHub |
| 4. Deploy backend | 10 min | Backend live |
| 5. Deploy frontend | 5 min | Frontend live |
| 6. Update CORS | 2 min | Apps connected |
| 7. Test | 3 min | Everything works! |
| 8. UptimeRobot | 5 min | 24/7 uptime |
| **TOTAL** | **~30 min** | **🎉 LIVE APP** |

---

## 🆘 Troubleshooting Commands

### Check if backend is running:
```bash
# Should return: {"status":"ok","db":"connected"}
curl https://your-backend.onrender.com/health
```

### Check frontend build locally:
```bash
cd frontend
npm run build
# Should create dist/ folder with no errors
```

### View backend logs (if errors):
- Render Dashboard → Your Service → Logs tab

### View frontend logs:
- Vercel Dashboard → Your Project → Deployments → Click latest → View Logs

---

## 🎯 Final Checklist

Before you start:
- [ ] MongoDB URI ready
- [ ] GitHub account created
- [ ] 30 minutes free time

After deployment:
- [ ] Backend URL saved
- [ ] Frontend URL saved
- [ ] App tested and working
- [ ] UptimeRobot configured

---

## 🚀 You're Ready!

Open `DEPLOYMENT.md` for detailed explanations.

Or just follow these commands step-by-step!

**Good luck! 🎉**
