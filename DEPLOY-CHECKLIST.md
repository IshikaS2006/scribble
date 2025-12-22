# Quick Deployment Checklist ✅

## Before You Start
- [ ] MongoDB URI ready
- [ ] GitHub account
- [ ] Render account (sign up free)
- [ ] Vercel account (sign up free)

---

## Local Setup (5 minutes)
- [ ] Create `server/.env` from `server/.env.example`
- [ ] Add your MongoDB URI to `server/.env`
- [ ] Create `frontend/.env` from `frontend/.env.example`
- [ ] Test locally: `npm start` (backend) + `npm run dev` (frontend)

---

## Deploy Backend to Render (10 minutes)
- [ ] Push code to GitHub
- [ ] Create Render account
- [ ] New Web Service → Connect GitHub
- [ ] Root directory: `server`
- [ ] Add environment variables:
  - `NODE_ENV=production`
  - `PORT=10000`
  - `MONGODB_URI=your_uri`
  - `FRONTEND_ORIGIN=` (leave empty for now)
- [ ] Deploy and wait
- [ ] Copy backend URL: `https://xxx.onrender.com`

---

## Deploy Frontend to Vercel (5 minutes)
- [ ] Create Vercel account
- [ ] Import GitHub project
- [ ] Root directory: `frontend`
- [ ] Add environment variable:
  - `VITE_SERVER_URL=https://your-backend.onrender.com`
- [ ] Deploy and wait
- [ ] Copy frontend URL: `https://your-app.vercel.app`

---

## Final Step (2 minutes)
- [ ] Go back to Render
- [ ] Update `FRONTEND_ORIGIN=https://your-app.vercel.app`
- [ ] Wait for redeploy
- [ ] Test your app!

---

## Optional: Prevent Sleep
- [ ] Sign up at uptimerobot.com
- [ ] Add monitor: `https://your-backend.onrender.com/health` every 5 min
- [ ] Done! Backend stays awake 24/7

---

## Total Time: ~25 minutes
## Total Cost: $0/month 🎉
