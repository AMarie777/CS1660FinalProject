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
    getTodayGame/             #GET /game/range
    submitUserGuess/          #POST /game/guess
    getLeaderboard/           #GET /leaderboard
    getGameStatus/            #GET /game/status
    getUserPoints/            #GET /user/points
    getModelMetadata/         #GET /model/metadata

## Backend Overview

- Handles reading the ML prediction from **NVDA_Predictions**.
- Saves user guesses to **UserGuesses** and returns leaderboards.
- Exposes API endpoints used by the frontend:
  - **GET /game/range** → getTodayGame (returns today's ML prediction)
  - **POST /game/guess** → submitUserGuess (saves user prediction)
  - **GET /game/status** → getGameStatus (returns user's guess and game status)
  - **GET /user/points** → getUserPoints (returns user's total points)
  - **GET /leaderboard** → getLeaderboard (returns leaderboard for a game date)
  - **GET /model/metadata** → getModelMetadata (returns top metrics and feature importance)

## API Endpoints

### GET /game/range
Returns today's game data including ML model predictions.

**Response:**
```json
{
  "gameDate": "2025-01-15",
  "symbol": "NVDA",
  "modelPrediction": {
    "predictedOpen": 145.50,
    "lower95": 142.30,
    "upper95": 148.70
  }
}
```

### POST /game/guess
Submits a user's prediction for today's game.

**Request Body:**
```json
{
  "userGuess": 146.00,
  "userId": "user-123",
  "username": "John Doe"
}
```

**Response:**
```json
{
  "gameDate": "2025-01-15",
  "username": "John Doe",
  "userGuess": 146.00,
  "botPrediction": 145.50,
  "actualOpen": null,
  "userError": null,
  "botError": null,
  "didUserBeatBot": null
}
```

### GET /game/status
Returns the current game status including user's guess and predictions.

**Query Parameters:**
- `userId` (optional, defaults from auth or 'anonymous')

**Response:**
```json
{
  "gameDate": "2025-01-15",
  "userGuess": 146.00,
  "modelPrediction": {
    "predictedOpen": 145.50,
    "lower95": 142.30,
    "upper95": 148.70
  },
  "actualOpen": null,
  "userPoints": 5
}
```

### GET /user/points
Returns the total points for a user (number of times they beat the bot).

**Query Parameters:**
- `userId` (optional, defaults from auth or 'anonymous')

**Response:**
```json
{
  "points": 5
}
```

### GET /leaderboard
Returns the leaderboard for a specific game date.

**Query Parameters:**
- `gameDate` (optional, defaults to today)

**Response:**
```json
{
  "gameDate": "2025-01-15",
  "leaderboard": [
    {
      "rank": 1,
      "username": "Alice",
      "userError": 0.25,
      "botError": 0.75,
      "didUserBeatBot": true
    }
  ]
}
```

### GET /model/metadata
Returns model metrics and feature importance data.

**Response:**
```json
{
  "topMetrics": {
    "Close_NVDA_lag3": { "value": 144.20, "importance": 1 },
    "EMA_12_NVDA": { "value": 143.85, "importance": 2 }
  },
  "featureImportance": [
    { "name": "Close_NVDA_lag3", "importance": 8.5 }
  ],
  "externalLinks": { ... }
}
```

## DynamoDB Tables

### NVDA_Predictions
- **Partition Key:** PredictionDate (String, YYYY-MM-DD)
- **Attributes:**
  - Predicted_Open_NVDA (Number)
  - Predicted_Low_NVDA (Number)
  - Predicted_High_NVDA (Number)

### UserGuesses
- **Partition Key:** gameDate (String, YYYY-MM-DD)
- **Sort Key:** userId (String) - if using composite key, otherwise use GSI
- **Attributes:**
  - username (String)
  - userGuess (Number)
  - botPrediction (Number)
  - actualOpen (Number, nullable)
  - userError (Number, nullable)
  - botError (Number, nullable)
  - didUserBeatBot (Boolean, nullable)
  - createdAt (Number)

## Cloud Deployment:

- Backend Lambdas are packaged from this folder and uploaded to an S3 bucket.
- The CloudFormation template deploys:
  - The backend Lambdas
  - The `UserGuesses` DynamoDB table
  - The `NVDA_Predictions` DynamoDB table (created by ML pipeline)
  - API routes for all endpoints
  - CORS headers configured for frontend access

## CORS

All endpoints include CORS headers to allow frontend access:
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Headers: Content-Type,Authorization
- Access-Control-Allow-Methods: GET,POST,OPTIONS
