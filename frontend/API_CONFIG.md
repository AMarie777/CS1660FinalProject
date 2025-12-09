# API Configuration Guide

This guide explains how to configure the frontend to connect to the backend API.

## Configuration Options

### Option 1: Production API Gateway (Recommended for Production)

Set the `VITE_API_BASE_URL` environment variable to your deployed API Gateway URL:

```bash
VITE_API_BASE_URL=https://abc123xyz.execute-api.us-east-2.amazonaws.com/prod
```

**How to get your API Gateway URL:**
1. Deploy your CloudFormation stack
2. Check the CloudFormation Outputs for the API URL
3. Or find it in AWS API Gateway Console

**Set in `.env.local` file:**
```bash
# frontend/.env.local
VITE_API_BASE_URL=https://your-actual-api-gateway-url.execute-api.us-east-2.amazonaws.com/prod
```

### Option 2: Local Development Proxy

For local development, you can use Vite's proxy feature to forward requests to a local backend server or directly to API Gateway.

**The proxy is already configured in `vite.config.js`** to forward `/api/*` requests.

**Using with local backend server:**
```bash
# If you have a local backend running on port 3000
# The proxy will automatically forward /api requests to it
```

**Using with API Gateway:**
```bash
# Set VITE_API_BASE_URL to your API Gateway URL
# The proxy will forward /api requests to it
```

### Option 3: Mock Data (Default for Development)

If no API URL is configured, the app automatically uses mock data stored in localStorage. This allows you to:
- Develop and test the UI without a backend
- Demo the application
- Test all features locally

## Environment Variables

### `.env.local` (for local development)
```bash
VITE_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-2.amazonaws.com/prod
```

### `.env.production` (for production build)
```bash
VITE_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-2.amazonaws.com/prod
```

## Testing API Connection

1. **Check if API is configured:**
   - Open browser console
   - Look for "Using mock game data" message (means mock data is active)
   - If API is configured, you'll see actual API calls in Network tab

2. **Verify API endpoints:**
   - The app tries to fetch from these endpoints:
     - `GET {API_BASE_URL}/game/range`
     - `GET {API_BASE_URL}/game/status`
     - `GET {API_BASE_URL}/user/points`
     - `GET {API_BASE_URL}/leaderboard`
     - `GET {API_BASE_URL}/model/metadata`
     - `POST {API_BASE_URL}/game/guess`

3. **Check CORS:**
   - Make sure your API Gateway has CORS enabled
   - Backend Lambdas already include CORS headers

## Quick Start

1. **For local development with mock data:**
   ```bash
   cd frontend
   npm install
   npm run dev
   # App will use mock data automatically
   ```

2. **For production/deployed API:**
   ```bash
   # Create .env.local file
   echo "VITE_API_BASE_URL=https://your-api-url.execute-api.us-east-2.amazonaws.com/prod" > .env.local
   
   # Restart dev server
   npm run dev
   ```

3. **Build for production:**
   ```bash
   # Set environment variable during build
   VITE_API_BASE_URL=https://your-api-url.execute-api.us-east-2.amazonaws.com/prod npm run build
   ```

## API Endpoint Structure

All endpoints are relative to `API_BASE_URL`:

- `GET /game/range` - Get today's game prediction
- `POST /game/guess` - Submit user guess
- `GET /game/status` - Get game status for user
- `GET /user/points` - Get user's total points
- `GET /leaderboard` - Get leaderboard
- `GET /model/metadata` - Get model metrics and feature importance

## Troubleshooting

**Problem: API calls fail with CORS error**
- Solution: Ensure backend Lambdas include CORS headers (already configured)

**Problem: API returns 404**
- Solution: Verify API Gateway routes are configured correctly
- Check that Lambda functions are deployed
- Verify the API_BASE_URL is correct

**Problem: Using mock data instead of real API**
- Solution: Check that VITE_API_BASE_URL is set correctly
- Restart dev server after changing .env file
- Check browser console for API connection errors

