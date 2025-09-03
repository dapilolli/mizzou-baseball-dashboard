# API Keep-Alive Service

This service prevents your Render backend from going to sleep by pinging it every 10 minutes.

## Quick Start

### Option 1: Run Locally (Simple)

```bash
npm run keep-alive
```

### Option 2: Deploy to Railway (Recommended)

1. Create a free account at [railway.app](https://railway.app)
2. Deploy this repository
3. Set the start command to: `node keep-alive.js`
4. The service will automatically keep your API alive 24/7

### Option 3: Run on Your Computer

```bash
node keep-alive.js
```

## How It Works

- Pings your API at `https://mizzou-baseball-dashboard-api.onrender.com/health` every 10 minutes
- Prevents Render's free tier from putting your service to sleep
- Logs ping status with timestamps
- Automatically handles errors and retries

## Status Monitoring

The script outputs:

- ✅ Successful pings
- ⚠️ Failed responses (but API is responding)
- ❌ Network errors or API completely down

## Alternative Solutions

If you upgrade to Render's paid plan ($7/month), your service won't sleep and you won't need this keep-alive service.
