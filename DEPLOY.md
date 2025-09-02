# Hybrid Deployment Guide: Vercel Frontend + Render Backend

## 🚀 Vercel Frontend + Render Backend (Recommended)

### Step 1: Deploy Backend to Render

1. **Create Backend Service**:
   - Go to [render.com](https://render.com) and sign up
   - Click "New +" → "Web Service"
   - Connect your GitHub repo: `dapilolli/mizzou-baseball-dashboard`

2. **Backend Configuration**:

   ```
   Name: mizzou-baseball-api
   Environment: Python 3
   Build Command: ./build.sh
   Start Command: uvicorn backend:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables**:

   ```
   PYTHON_VERSION=3.11.4
   HOST=0.0.0.0
   PORT=10000
   LOG_LEVEL=info
   FRONTEND_ORIGINS=https://your-frontend-name.vercel.app
   ```

### Step 2: Deploy Frontend to Vercel

1. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign up
   - Click "New Project"
   - Import your GitHub repo: `dapilolli/mizzou-baseball-dashboard`

2. **Vercel will auto-detect**:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables**:

   ```
   VITE_API_BASE_URL=https://your-backend-name.onrender.com
   ```

### Step 3: Update CORS Settings

Update your backend's FRONTEND_ORIGINS environment variable on Render with your Vercel URL.

## 💡 Why This Combination?

- **Vercel Frontend**: Lightning fast, global CDN, excellent React support
- **Render Backend**: Persistent Python server, database support, background tasks
- **Cost**: Both have generous free tiers
- **Performance**: Best of both worlds

## 🔧 Alternative: Single Service Deployment

If you prefer everything in one service, you can serve the React build from FastAPI.
