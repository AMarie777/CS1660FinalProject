#!/bin/bash
set -e

REGION="us-east-2"
ACCOUNT_ID="736116164611"

echo "===  Create DynamoDB Table ==="
if ! aws dynamodb describe-table --table-name NVDA_Predictions --region $REGION >/dev/null 2>&1; then
    aws dynamodb create-table \
        --table-name NVDA_Predictions \
        --attribute-definitions AttributeName=Prediction_Date,AttributeType=S \
        --key-schema AttributeName=Prediction_Date,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region $REGION
else
    echo "DynamoDB table NVDA_Predictions already exists."
fi

echo "Checking DynamoDB table UserGuesses1..."

if ! aws dynamodb describe-table --table-name UserGuesses1 --region $REGION >/dev/null 2>&1; then
  echo "Creating DynamoDB table UserGuesses1..."

 aws dynamodb create-table \
    --table-name UserGuesses1 \
    --attribute-definitions AttributeName=email,AttributeType=S \
    --key-schema AttributeName=email,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region $REGION

  echo "Waiting for table to become ACTIVE..."
  aws dynamodb wait table-exists --table-name UserGuesses1 --region $REGION

else
  echo "DynamoDB table UserGuesses1 already exists."
fi

echo "=== Create IAM Policy Ml_Automation ==="
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/Ml_Automation"
if ! aws iam get-policy --policy-arn $POLICY_ARN >/dev/null 2>&1; then
    cat > ml_automation_policy.json << EOL
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::amazon-sagemaker-${ACCOUNT_ID}-us-east-2-ayappcqas719d5",
                "arn:aws:s3:::amazon-sagemaker-${ACCOUNT_ID}-us-east-2-ayappcqas719d5/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem"
            ],
            "Resource": "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/NVDA_Predictions"
        }
    ]
}
EOL
    aws iam create-policy \
        --policy-name Ml_Automation \
        --policy-document file://ml_automation_policy.json
else
    echo "IAM Policy Ml_Automation already exists."
fi

echo "=== Create IAM Role ml_lambda_role ==="
ROLE_NAME="ml_lambda_role"

if ! aws iam get-role --role-name $ROLE_NAME >/dev/null 2>&1; then
    cat > ml_lambda_trust.json << EOL
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            }
        }
    ]
}
EOL

    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file://ml_lambda_trust.json

    # Attach required policies
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

else
    echo "IAM Role ml_lambda_role already exists."
fi

echo "===  Create EventBridge Rules ==="
# ML Lambda: 5 PM EST = 22 UTC
if ! aws events describe-rule --name market_close --region $REGION >/dev/null 2>&1; then
    aws events put-rule \
        --name market_close \
        --schedule-expression "cron(0 22 * * ? *)" \
        --description "Trigger ML Lambda function at 5 PM EST daily" \
        --region $REGION
else
    echo "EventBridge rule market_close already exists."
fi

# Data Lambda: 4:35 PM EST = 21:35 UTC
if ! aws events describe-rule --name market_close_before --region $REGION >/dev/null 2>&1; then
    aws events put-rule \
        --name market_close_before \
        --schedule-expression "cron(35 21 * * ? *)" \
        --description "Trigger Data Lambda function at 4:35 PM EST daily" \
        --region $REGION
else
    echo "EventBridge rule market_close_before already exists."
fi

echo "=== Build and Push Docker Images ==="
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

for IMAGE in ml_lambda data_lambda; do
    if ! aws ecr describe-repositories --repository-names $IMAGE --region $REGION >/dev/null 2>&1; then
        aws ecr create-repository --repository-name $IMAGE --region $REGION
    fi
    
    docker buildx build --platform linux/amd64 --provenance=false -t $IMAGE ./$IMAGE --load
    docker tag $IMAGE:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/$IMAGE:latest
    docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/$IMAGE:latest
done

echo "=== Create or Update Lambda Functions ==="
declare -A LAMBDAS=( ["ml_lambda"]=3000 ["data_lambda"]=1024 )
for FUNC in "${!LAMBDAS[@]}"; do
    MEMORY=${LAMBDAS[$FUNC]}
    if aws lambda get-function --function-name $FUNC >/dev/null 2>&1; then
        echo "Updating existing Lambda function $FUNC..."
        aws lambda update-function-code \
            --function-name $FUNC \
            --image-uri ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/$FUNC:latest
    else
        echo "Creating Lambda function $FUNC..."
        aws lambda create-function \
            --function-name $FUNC \
            --package-type Image \
            --code ImageUri=${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/$FUNC:latest \
            --role arn:aws:iam::${ACCOUNT_ID}:role/ml_lambda_role \
            --memory-size $MEMORY \
            --timeout 270 \
            --description "${FUNC} function"
    fi
done

echo "=== Create or Update BACKEND Lambda Functions ==="

# Map: Lambda Name -> Handler
declare -A BACKEND_LAMBDAS=(
  ["getTodayGame"]="index.handler"
  ["getLeaderboard"]="index.handler"
  ["submitUserGuess"]="index.handler"
  ["getGameStatus"]="index.handler"
  ["getUserPoints"]="index.handler"
  ["getModelMetadata"]="index.handler"
)

for FUNC in "${!BACKEND_LAMBDAS[@]}"; do
    HANDLER=${BACKEND_LAMBDAS[$FUNC]}
    FUNC_DIR="backend/lambdas/${FUNC}"
    ZIP_FILE="/tmp/${FUNC}.zip"

    if [ ! -d "$FUNC_DIR" ]; then
      echo " WARNING: Backend folder $FUNC_DIR does not exist — skipping $FUNC"
      continue
    fi

    echo "Zipping backend function $FUNC..."
    rm -f "$ZIP_FILE"
    # Lambda handler expects index.js at root and db folder at same level
    # But code uses ../../db, so we need to create proper structure
    # Option: Copy index.js and db folder to temp, then zip
    TEMP_DIR=$(mktemp -d)
    cp "$FUNC_DIR/index.js" "$TEMP_DIR/"
    cp -r backend/db "$TEMP_DIR/"
    (cd "$TEMP_DIR" && zip -r "$ZIP_FILE" . >/dev/null 2>&1)
    rm -rf "$TEMP_DIR"

    if aws lambda get-function --function-name "$FUNC" >/dev/null 2>&1; then
        echo "Updating existing Lambda $FUNC..."
        aws lambda update-function-code \
          --function-name "$FUNC" \
          --zip-file "fileb://$ZIP_FILE"
    else
        echo "Creating Lambda function $FUNC..."
        aws lambda create-function \
          --function-name "$FUNC" \
          --runtime nodejs20.x \
          --handler "$HANDLER" \
          --role arn:aws:iam::${ACCOUNT_ID}:role/ml_lambda_role \
          --timeout 20 \
          --memory-size 256 \
          --zip-file "fileb://$ZIP_FILE"
    fi
done
echo "===  SES Email Verification  ==="
# ---------- SES Email Verification ----------
SENDER_EMAIL="beatthebot317@gmail.com"

# Check if email is verified
VERIFIED=$(aws ses list-identities --identity-type EmailAddress --region $REGION | grep "$SENDER_EMAIL" || true)

if [ -z "$VERIFIED" ]; then
    echo "Verifying SES email: $SENDER_EMAIL"
    aws ses verify-email-identity --email-address $SENDER_EMAIL --region $REGION
else
    echo "SES email $SENDER_EMAIL already verified"
fi

# --------------------- Variables ---------------------
LAYER_NAME="email_layer1"
LAYER_ZIP="email_layer1.zip"
S3_BUCKET="emaillayer21"
S3_KEY="email_layer1.zip"

EMAIL_LAMBDA="email"
EMAIL_ZIP="email.py.zip"
HANDLER="lambda_function.lambda_handler"

EVENT_RULE_NAME="market_open_30min"
EVENT_CRON="cron(0 15 * * ? *)"  # 10:00 AM EST = 15:00 UTC


# --------------------- Publish Layer ---------------------
echo "Publishing Lambda layer $LAYER_NAME..."
LAYER_ARN=$(aws lambda publish-layer-version \
    --layer-name "$LAYER_NAME" \
    --content S3Bucket="$S3_BUCKET",S3Key="$S3_KEY" \
    --compatible-runtimes python3.13 \
    --compatible-architectures arm64 \
    --region $REGION \
    --query 'LayerVersionArn' \
    --output text)

echo "Layer published with ARN: $LAYER_ARN"

# --------------------- Create/Update Lambda Function ---------------------

wait_for_lambda() {
    local fn=$1
    while true; do
        STATUS=$(aws lambda get-function-configuration --function-name "$fn" \
            --query "LastUpdateStatus" --output text)

        if [[ "$STATUS" == "InProgress" ]]; then
            echo "Lambda update still in progress... waiting 5s"
            sleep 5
        else
            break
        fi
    done
}

if aws lambda get-function --function-name "$EMAIL_LAMBDA" >/dev/null 2>&1; then
    echo "Updating existing Lambda function $EMAIL_LAMBDA..."

    aws lambda update-function-code \
        --function-name "$EMAIL_LAMBDA" \
        --zip-file fileb://email/email.py.zip

    # ⬅️ critical: wait here
    wait_for_lambda "$EMAIL_LAMBDA"

    aws lambda update-function-configuration \
        --function-name "$EMAIL_LAMBDA" \
        --layers "$LAYER_ARN" \
        --timeout 120 \
        --memory-size 256

else
    echo "Creating Lambda function $EMAIL_LAMBDA..."
    aws lambda create-function \
        --function-name "$EMAIL_LAMBDA" \
        --runtime python3.13 \
        --handler "$HANDLER" \
        --role arn:aws:iam::${ACCOUNT_ID}:role/ml_lambda_role \
        --timeout 120 \
        --memory-size 256 \
        --layers "$LAYER_ARN" \
        --zip-file fileb://email/email.py.zip
fi

# --------------------- Create EventBridge Rule ---------------------
if ! aws events describe-rule --name "$EVENT_RULE_NAME" --region $REGION >/dev/null 2>&1; then
    echo "Creating EventBridge rule $EVENT_RULE_NAME..."
    aws events put-rule \
        --name "$EVENT_RULE_NAME" \
        --schedule-expression "$EVENT_CRON" \
        --description "Trigger Lambda 30 minutes after market open" \
        --region $REGION
else
    echo "EventBridge rule $EVENT_RULE_NAME already exists"
fi

# --------------------- Add Lambda Permission ---------------------
aws lambda add-permission \
    --function-name "$EMAIL_LAMBDA" \
    --statement-id "${EMAIL_LAMBDA}_event_permission" \
    --action 'lambda:InvokeFunction' \
    --principal events.amazonaws.com \
    --source-arn arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/$EVENT_RULE_NAME || true

# --------------------- Attach Lambda to EventBridge ---------------------
aws events put-targets \
    --rule "$EVENT_RULE_NAME" \
    --targets "Id"="1","Arn"="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:$EMAIL_LAMBDA"

echo "✅ Email Lambda and Layer deployed successfully!"



echo "===  Add EventBridge Triggers to Lambda ==="
# ML Lambda

SID_EMAIL="email_perm_$(date +%s%N)"

aws lambda add-permission \
    --function-name email \
    --statement-id "$SID_EMAIL" \
    --action 'lambda:InvokeFunction' \
    --principal events.amazonaws.com \
    --source-arn arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/$RULE_NAME || true
    
SID_ML="ml_perm_$(date +%s%N)"

aws lambda add-permission \
    --function-name ml_lambda \
    --statement-id "$SID_ML" \
    --action 'lambda:InvokeFunction' \
    --principal events.amazonaws.com \
    --source-arn arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/market_close || true

aws events put-targets \
    --rule market_close \
    --targets "Id"="1","Arn"="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:ml_lambda"
    
SID_DATA="data_perm_$(date +%s%N)"

# Data Lambda
aws lambda add-permission \
    --function-name data_lambda \
    --statement-id "$SID_DATA" \
    --action 'lambda:InvokeFunction' \
    --principal events.amazonaws.com \
    --source-arn arn:aws:events:${REGION}:${ACCOUNT_ID}:rule/market_close_before || true

aws events put-targets \
    --rule market_close_before \
    --targets "Id"="1","Arn"="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:data_lambda"

aws events put-targets \
    --rule market_open_30min \
    --targets "Id"="1","Arn"="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:email"

echo " All resources created/updated successfully!"
