# Setting Up API Connection

## Quick Setup

1. **Deploy the CloudFormation stack** (if not already deployed):
   ```bash
   aws cloudformation deploy \
     --template-file infra/template.yml \
     --stack-name playing-the-market \
     --parameter-overrides FrontendBucketName=your-bucket-name \
     --capabilities CAPABILITY_IAM
   ```

2. **Get your API Gateway URL** from CloudFormation outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name playing-the-market \
     --query 'Stacks[0].Outputs[?OutputKey==`ApiBaseUrl`].OutputValue' \
     --output text
   ```

3. **Create `.env.local` file** in the `frontend/` directory:
   ```bash
   cd frontend
   echo "VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-2.amazonaws.com/prod" > .env.local
   ```

4. **Test the connection**:
   ```bash
   # Using the test script
   node test-api-connection.js https://your-api-id.execute-api.us-east-2.amazonaws.com/prod
   
   # Or start the dev server
   npm run dev
   ```

## What Was Updated

The CloudFormation template now includes:

### All Required Lambda Functions:
- ✅ `getTodayGame` → `GET /game/range`
- ✅ `submitUserGuess` → `POST /game/guess`
- ✅ `getGameStatus` → `GET /game/status`
- ✅ `getUserPoints` → `GET /user/points`
- ✅ `getLeaderboard` → `GET /leaderboard`
- ✅ `getModelMetadata` → `GET /model/metadata`

### API Routes Match Frontend:
All routes now match what the frontend expects:
- `/game/range` (was `/today-game`)
- `/game/guess` (was `/submit-guess`)
- `/game/status` (new)
- `/user/points` (new)
- `/leaderboard` (unchanged)
- `/model/metadata` (new)

### Permissions Updated:
- Added `dynamodb:Scan` permission for getUserAllGuesses function
- All Lambda functions have proper IAM permissions

## Next Steps

1. **Deploy the updated CloudFormation template**
2. **Get the API URL** from outputs
3. **Set it in `.env.local`**
4. **Restart dev server** - the frontend will automatically connect!

