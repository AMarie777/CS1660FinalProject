# Quick AWS Amplify Setup Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Get API Gateway URL

Run this command to get your API URL:
```bash
./amplify-get-api-url.sh
```

Or manually:
```bash
aws cloudformation describe-stacks \
  --stack-name playing-the-market-main \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiBaseUrl`].OutputValue' \
  --output text
```

### Step 2: Create Amplify App

1. **Go to AWS Console → AWS Amplify**
2. Click **"New app"** → **"Host web app"**
3. Connect **GitHub** repository: `AMarie777/CS1660FinalProject`
4. Select branch: **`main`**
5. Amplify will auto-detect `amplify.yml` ✅

### Step 3: Add Environment Variable (CRITICAL!)

1. Before deploying, go to **"App settings"** → **"Environment variables"**
2. Add:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** Your API Gateway URL (from Step 1)
3. Click **"Save"**

### Step 4: Deploy

1. Click **"Save and deploy"**
2. Wait for build to complete (~3-5 minutes)
3. Your app will be live at the Amplify URL!

## ✅ That's it!

Amplify will now:
- ✅ Auto-deploy on every `git push` to `main`
- ✅ Build with the correct API URL
- ✅ Handle React Router routing
- ✅ Provide HTTPS and CDN

## 🔍 Verify It's Working

1. Open your Amplify app URL
2. Open browser console (F12)
3. Look for: `🌐 Fetching game data from: ...`
4. If you see that, the API is connected! ✅

## 📝 Need to Update API URL?

1. Amplify Console → App settings → Environment variables
2. Update `VITE_API_BASE_URL`
3. Click **"Redeploy this version"**

## 🐛 Troubleshooting

**"Using mock data" message?**
- Check `VITE_API_BASE_URL` is set in Amplify environment variables
- Verify API Gateway URL is correct

**404 errors on routes?**
- The `_redirects` file should fix this automatically
- If not, add redirect rule in Amplify Console → App settings → Rewrites and redirects

**Build fails?**
- Check build logs in Amplify Console
- Verify `frontend/package.json` exists
- Ensure Node.js version is compatible (Amplify auto-detects)

