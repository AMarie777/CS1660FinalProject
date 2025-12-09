# Frontend-Backend Connection Guide

This guide shows you exactly how to connect your frontend to the backend API to get real data.

## Step 1: Deploy Your Backend

First, make sure your backend Lambda functions are deployed to AWS. The backend includes:

- `getTodayGame` - GET /game/range
- `submitUserGuess` - POST /game/guess  
- `getGameStatus` - GET /game/status
- `getUserPoints` - GET /user/points
- `getLeaderboard` - GET /leaderboard
- `getModelMetadata` - GET /model/metadata

## Step 2: Get Your API Gateway URL

After deploying your CloudFormation stack, get your API Gateway URL:

1. **From CloudFormation Outputs:**
   - Go to AWS Console → CloudFormation
   - Select your stack
   - Go to "Outputs" tab
   - Look for API URL (format: `https://xxx.execute-api.us-east-2.amazonaws.com/prod`)

2. **From API Gateway Console:**
   - Go to AWS Console → API Gateway
   - Find your API (e.g., "playing-the-market-api")
   - Go to "Stages" → "prod"
   - Copy the "Invoke URL"

## Step 3: Configure Frontend

### Option A: Using Environment Variable (Recommended)

1. **Create `.env.local` file** in the `frontend/` directory:
   ```bash
   cd frontend
   touch .env.local
   ```

2. **Add your API Gateway URL:**
   ```bash
   VITE_API_BASE_URL=https://your-actual-api-id.execute-api.us-east-2.amazonaws.com/prod
   ```

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

### Option B: Using Vite Proxy (Local Development)

If you want to use the proxy configured in `vite.config.js`:

1. Set `VITE_API_BASE_URL` in `.env.local`:
   ```bash
   VITE_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-2.amazonaws.com/prod
   ```

2. The proxy will forward `/api/*` requests to your API Gateway

## Step 4: Verify Connection

1. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open browser console** (F12)

3. **Look for these messages:**
   - ✅ `🌐 Fetching game data from: ...` - API is being called
   - ✅ `✅ Successfully fetched game data:` - API is working!
   - ⚠️ `📦 Using mock game data` - Still using mock data (API not configured)

4. **Check Network tab:**
   - Open DevTools → Network tab
   - Look for requests to `/game/range`, `/game/status`, etc.
   - Verify they return 200 status codes

## Step 5: Test the API Endpoints

You can test the API directly:

```bash
# Get today's game
curl https://your-api-id.execute-api.us-east-2.amazonaws.com/prod/game/range

# Get leaderboard
curl https://your-api-id.execute-api.us-east-2.amazonaws.com/prod/leaderboard

# Submit a guess (replace with actual values)
curl -X POST https://your-api-id.execute-api.us-east-2.amazonaws.com/prod/game/guess \
  -H "Content-Type: application/json" \
  -d '{"userGuess": 145.50, "userId": "test-user", "username": "Test User"}'
```

## Troubleshooting

### Problem: "Using mock game data" message

**Cause:** API_BASE_URL is not set or invalid

**Solution:**
1. Check `.env.local` file exists and has correct URL
2. Restart dev server after changing `.env.local`
3. Verify the URL format is correct (no trailing slash)

### Problem: CORS errors in browser

**Cause:** Backend not returning CORS headers

**Solution:** 
- Backend Lambdas already include CORS headers
- Verify API Gateway has CORS enabled
- Check that OPTIONS requests are handled

### Problem: 404 Not Found

**Cause:** API Gateway routes not configured

**Solution:**
1. Verify Lambda functions are deployed
2. Check API Gateway has routes configured:
   - `/game/range` → getTodayGame Lambda
   - `/game/guess` → submitUserGuess Lambda
   - `/game/status` → getGameStatus Lambda
   - `/user/points` → getUserPoints Lambda
   - `/leaderboard` → getLeaderboard Lambda
   - `/model/metadata` → getModelMetadata Lambda

### Problem: 500 Internal Server Error

**Cause:** Lambda function error or DynamoDB access issue

**Solution:**
1. Check CloudWatch Logs for Lambda errors
2. Verify DynamoDB tables exist:
   - `NVDA_Predictions`
   - `UserGuesses`
3. Verify Lambda IAM role has DynamoDB permissions

## Current Configuration

The frontend automatically:
- ✅ Detects if API_BASE_URL is configured
- ✅ Uses real API if URL is set
- ✅ Falls back to mock data if API unavailable
- ✅ Logs API calls to console for debugging
- ✅ Handles errors gracefully

## API Endpoint Summary

| Frontend Call | Backend Endpoint | Lambda Function |
|--------------|------------------|-----------------|
| `getTodayGame()` | `GET /game/range` | `getTodayGame` |
| `submitUserGuess()` | `POST /game/guess` | `submitUserGuess` |
| `getGameStatus()` | `GET /game/status` | `getGameStatus` |
| `getUserPoints()` | `GET /user/points` | `getUserPoints` |
| `getLeaderboard()` | `GET /leaderboard` | `getLeaderboard` |
| `getModelMetadata()` | `GET /model/metadata` | `getModelMetadata` |

## Next Steps

Once connected:
1. Test submitting a guess
2. Verify it appears in leaderboard
3. Check that model predictions load
4. Verify user points are calculated

Your game should now be fully functional with real backend data! 🎉

