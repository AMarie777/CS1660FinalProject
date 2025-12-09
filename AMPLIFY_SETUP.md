# AWS Amplify Hosting Setup

This guide will help you set up AWS Amplify to automatically deploy your frontend with the API Gateway URL configured.

## Step 1: Create Amplify App

1. Go to **AWS Console → AWS Amplify**
2. Click **"New app"** → **"Host web app"**
3. Choose **"GitHub"** as your repository provider
4. Authorize AWS Amplify to access your GitHub account
5. Select your repository: `AMarie777/CS1660FinalProject`
6. Select branch: `main`
7. Click **"Next"**

## Step 2: Configure Build Settings

Amplify should automatically detect the `amplify.yml` file. If not, use these build settings:

**Build specification:** `amplify.yml` (already created in repo root)

## Step 3: Configure Environment Variables

**CRITICAL:** You need to set the API Gateway URL as an environment variable:

1. In Amplify Console, go to **App settings** → **Environment variables**
2. Add the following variable:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** Your API Gateway URL (e.g., `https://abc123.execute-api.us-east-2.amazonaws.com/prod`)

**How to get your API Gateway URL:**
```bash
aws cloudformation describe-stacks \
  --stack-name playing-the-market-main \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiBaseUrl`].OutputValue' \
  --output text
```

Or from AWS Console:
- CloudFormation → playing-the-market-main → Outputs → ApiBaseUrl

## Step 4: Configure Redirects (Important for React Router)

1. In Amplify Console, go to **App settings** → **Rewrites and redirects**
2. Add a redirect rule:
   - **Source:** `/<*>`
   - **Target:** `/index.html`
   - **Type:** `200 (Rewrite)`

This ensures React Router works correctly with client-side routing.

## Step 5: Deploy

1. Click **"Save and deploy"**
2. Amplify will:
   - Clone your repository
   - Install dependencies (`npm ci` in frontend directory)
   - Build the frontend with `VITE_API_BASE_URL` injected
   - Deploy to CloudFront CDN

## Step 6: Verify

After deployment completes:
1. Check the Amplify app URL
2. Open browser console
3. Look for: `🌐 Fetching game data from: ...` (API connected)
4. The app should work just like localhost!

## Auto-Deployment

Amplify will automatically:
- ✅ Deploy on every push to `main` branch
- ✅ Run the build process
- ✅ Inject environment variables at build time
- ✅ Update CloudFront distribution

## Updating API URL

If your API Gateway URL changes:
1. Go to Amplify Console → App settings → Environment variables
2. Update `VITE_API_BASE_URL` value
3. Click **"Redeploy this version"** → **"Redeploy"**

Or create a new deployment:
1. Go to the **Deployments** tab
2. Click the deployment
3. Click **"Redeploy"**

## Troubleshooting

**Problem: App shows "Using mock data"**
- ✅ Check that `VITE_API_BASE_URL` is set in Amplify environment variables
- ✅ Verify the API Gateway URL is correct
- ✅ Check build logs in Amplify Console

**Problem: 404 errors on routes**
- ✅ Make sure redirect rule is configured (Step 4)

**Problem: CORS errors**
- ✅ Verify Lambda functions have CORS headers
- ✅ Check API Gateway CORS settings

**Problem: Build fails**
- ✅ Check build logs in Amplify Console
- ✅ Verify `amplify.yml` is in repo root
- ✅ Ensure `frontend/package.json` exists

## Manual Deployment (Alternative)

If you prefer to deploy manually:
```bash
# Build with API URL
cd frontend
VITE_API_BASE_URL=https://your-api-url.execute-api.us-east-2.amazonaws.com/prod npm run build

# Deploy to Amplify
aws amplify start-job \
  --app-id your-amplify-app-id \
  --branch-name main \
  --job-type RELEASE
```

