#!/bin/bash
# Script to get API Gateway URL and configure frontend

REGION="us-east-2"
STACK_NAME="playing-the-market-main"

echo "🔍 Searching for CloudFormation stack..."

# Try different stack names
STACK_NAMES=("playing-the-market-main" "playing-the-market" "playing-the-market-api")

API_URL=""

for STACK in "${STACK_NAMES[@]}"; do
  echo "Checking stack: $STACK"
  API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiBaseUrl`].OutputValue' \
    --output text 2>/dev/null)
  
  if [ ! -z "$API_URL" ] && [ "$API_URL" != "None" ]; then
    echo "✅ Found API URL in stack: $STACK"
    break
  fi
done

# If not found in CloudFormation, try API Gateway directly
if [ -z "$API_URL" ] || [ "$API_URL" == "None" ]; then
  echo "Searching API Gateway directly..."
  API_ID=$(aws apigateway get-rest-apis \
    --region "$REGION" \
    --query 'items[?contains(name, `playing-the-market`) || name==`playing-the-market-api`].id' \
    --output text 2>/dev/null | head -1)
  
  if [ ! -z "$API_ID" ]; then
    API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"
    echo "✅ Found API Gateway: $API_ID"
  fi
fi

if [ -z "$API_URL" ] || [ "$API_URL" == "None" ]; then
  echo "❌ Could not find API Gateway URL"
  echo ""
  echo "To get the API URL manually:"
  echo "1. Go to AWS Console → CloudFormation"
  echo "2. Find your stack (playing-the-market-main or similar)"
  echo "3. Go to Outputs tab"
  echo "4. Copy the ApiBaseUrl value"
  echo ""
  echo "Or from API Gateway Console:"
  echo "1. Go to AWS Console → API Gateway"
  echo "2. Find 'playing-the-market-api'"
  echo "3. Go to Stages → prod"
  echo "4. Copy the Invoke URL"
  exit 1
fi

echo ""
echo "✅ API Gateway URL found:"
echo "   $API_URL"
echo ""

# Create .env.local file
cd frontend || exit 1
echo "VITE_API_BASE_URL=$API_URL" > .env.local
echo "✅ Created frontend/.env.local with API URL"
echo ""
echo "To test the connection:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Or test API directly:"
echo "  node test-api-connection.js $API_URL"

