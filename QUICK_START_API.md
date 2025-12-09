# Quick Start: Connect Frontend to API

## Option 1: Get API URL from AWS Console (Recommended)

1. **Go to AWS Console → CloudFormation**
   - Find stack: `playing-the-market-main` (or similar)
   - Click on the stack
   - Go to **Outputs** tab
   - Copy the **ApiBaseUrl** value

2. **Configure Frontend:**
   ```bash
   cd frontend
   echo "VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-2.amazonaws.com/prod" > .env.local
   npm run dev
   ```

## Option 2: Use Automated Script

After deploying CloudFormation, run:
```bash
./GET_API_URL.sh
```

This will automatically:
- Find your API Gateway URL
- Create `.env.local` file with the URL
- Show you how to test

## Option 3: Manual Configuration

1. **Get API URL** from one of these places:
   - CloudFormation Outputs: `ApiBaseUrl`
   - API Gateway Console → Stages → prod → Invoke URL
   - Run: `aws cloudformation describe-stacks --stack-name playing-the-market-main --query 'Stacks[0].Outputs[?OutputKey==`ApiBaseUrl`].OutputValue' --output text`

2. **Create `.env.local` file:**
   ```bash
   cd frontend
   echo "VITE_API_BASE_URL=https://your-actual-api-id.execute-api.us-east-2.amazonaws.com/prod" > .env.local
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

## Verify Connection

Once configured, check browser console for:
- ✅ `🌐 Fetching game data from: ...` = API is connected
- 📦 `Using mock game data` = Still using mock data

## Test API Endpoints Directly

```bash
# Test game range endpoint
curl https://your-api-id.execute-api.us-east-2.amazonaws.com/prod/game/range

# Test leaderboard
curl https://your-api-id.execute-api.us-east-2.amazonaws.com/prod/leaderboard
```

Or use the test script:
```bash
cd frontend
node test-api-connection.js https://your-api-id.execute-api.us-east-2.amazonaws.com/prod
```

