# Backend (Alexa)

This folder contains the Lambda functions for Playing the Market.

Alexa:
- Create Lambda handlers here.
- Each Lambda should be in its own file, e.g.:
  - submitPrediction.js
  - getDailyStock.js
  - compareWithModel.js

Cloud Deployment:
- Amanda will update the CloudFormation template to package/deploy these functions.
- When you add new code here, tell Amanda so the deployment template can reference it.

## Structure

backend/
  db/
    dynamoClient.js           #shared DynamoDB client
    predictionRepository.js   #reads NVDA_Predictions table (written by ml_lambda)
    guessRepository.js        #reads/writes UserGuesses table (leaderboard)
  lambdas/
    getTodayGame/             #GET /today
    submitUserGuess/          #POST /guess
    getLeaderboard/           #GET /leaderboard

## Backend Overview
- Handles reading the ML prediction from **NVDA_Predictions**.
- Saves user guesses to **UserGuesses** and returns leaderboards.
- Exposes three API endpoints used by the frontend:
  - **GET /today** → getTodayGame
  - **POST /guess** → submitUserGuess
  - **GET /leaderboard** → getLeaderboard

## Cloud Deployment:
- Backend Lambdas are packaged from this folder and uploaded to an S3 bucket.
- The CloudFormation template deploys:
  - The three backend Lambdas
  - The `UserGuesses` DynamoDB table
  - API routes `/today`, `/guess`, `/leaderboard`