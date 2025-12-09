#!/bin/bash
# Script to get API Gateway URL and configure Amplify

REGION="us-east-2"
STACK_NAME="playing-the-market-main"

echo "🔍 Getting API Gateway URL from CloudFormation..."

API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiBaseUrl`].OutputValue' \
  --output text 2>/dev/null)

if [ -z "$API_URL" ] || [ "$API_URL" == "None" ]; then
  echo "❌ Could not find API Gateway URL"
  echo ""
  echo "To get the API URL manually:"
  echo "1. Go to AWS Console → CloudFormation"
  echo "2. Find your stack: $STACK_NAME"
  echo "3. Go to Outputs tab"
  echo "4. Copy the ApiBaseUrl value"
  exit 1
fi

echo ""
echo "✅ API Gateway URL found:"
echo "   $API_URL"
echo ""
echo "📝 Next steps to configure Amplify:"
echo ""
echo "1. Go to AWS Console → AWS Amplify"
echo "2. Select your app"
echo "3. Go to: App settings → Environment variables"
echo "4. Add environment variable:"
echo "   Key:   VITE_API_BASE_URL"
echo "   Value: $API_URL"
echo "5. Save and redeploy your app"
echo ""
echo "Or use AWS CLI to set it (if you have the Amplify app ID):"
echo "  # First, get your Amplify app ID"
echo "  aws amplify list-apps --query 'apps[?name==\`your-app-name\`].appId' --output text"
echo ""
echo "  # Then update environment variable (requires app ID and branch name)"
echo "  # This is best done through the console"

