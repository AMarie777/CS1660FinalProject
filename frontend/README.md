# Frontend (Danielle)

This folder contains the frontend code for **Beat The Bot** - an interactive website where users try to predict NVIDIA's next market opening price.

## Overview

We are building an interactive website where users try to predict **NVIDIA's next market opening price**.

The twist:
- Our ML model estimates a **High–Low range** for NVDA's next opening price.
- Users submit their guess → their guess gets **locked**.
- After submission, the model's predicted range is shown.
- Next day at market open, whoever is **closest to the real open** earns points.

## User Flow

### 1. User Enters Prediction
User types what they believe NVDA will open at tomorrow.

### 2. Prediction Locks
Once submitted, user cannot change the prediction.

### 3. Reveal Model Range
**After submission**, the website reveals:
**"Model expects NVDA to open between X and Y."**

### 4. Show Model Inputs
To help transparency, we show:
- **Top 5–8 in-page metrics (live values + importance)**
- **Rest of data via expandable links** (Yahoo Finance, FRED, Alternative.me Fear & Greed Index, etc.)

### 5. Next Day Score
At market open, system compares user prediction vs actual opening price → assigns points.

## Frontend Requirements

### ✔️ In-Page Display (Top Metrics)

These must be shown clearly on the prediction results page (after user submits):

* Close_NVDA_lag3
* EMA_12_NVDA
* Close_^GSPC_lag3
* ES_High
* NVDA_vs_SP500_C
* NVDA_vs_SP500_C_lag3
* Low_NVDA
* High_^GSPC

#### Suggested format (cards or table):
```
## Metric Name          | Value Today  | Importance Score

Close_NVDA_lag3      | 111230.773   | #1
EMA_12_NVDA          | 24916.641    | #2
Close_^GSPC_lag3     | 17933.752    | #3
ES_High              | 14138.271    | #4
NVDA_vs_SP500_C      | 12869.418    | #5
NVDA_vs_SP500_C_lag3 | 11663.465    | #6
Low_NVDA             | 10601.202    | #7
High_^GSPC           | 10593.794    | #8
```

### ✔️ Weblinks Section (Expandable)

Show external sources the model relies on:

**Yahoo Finance Price Data**
- NVDA
- AMD
- TSM
- S&P500 (^GSPC)
- VIX (^VIX)
- SOXX
- SMH
- S&P Futures (ES=F)

**Macro Indicators**
- FRED 10-Year Treasury Yield (DGS10)

**Sentiment Indicator**
- CNN Fear & Greed Index (Alternative.me API)

Use collapsible UI elements:
✓ "Show All External Data Sources"  
✓ "Expand Full Feature List"

**User Points**  
Display how many points the user has so far; no need to display who won or who did not win, SNS topic: email will do.

## Technical Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Recharts** - Data visualization and charts
- **Tailwind CSS** - Utility-first CSS framework

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Game.jsx           # Main game/prediction component
│   │   ├── Leaderboard.jsx    # Leaderboard display
│   │   ├── Login.jsx          # User login
│   │   ├── Signup.jsx         # User registration
│   │   ├── ModelMetrics.jsx   # Top metrics display
│   │   ├── Charts.jsx         # Visualization components
│   │   └── ProtectedRoute.jsx # Auth protection
│   ├── context/
│   │   └── AuthContext.jsx    # Authentication context
│   ├── services/
│   │   ├── authService.js     # Auth API calls
│   │   └── gameService.js     # Game API calls
│   ├── App.jsx                # Main app component
│   └── main.jsx               # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## API Integration

The frontend integrates with the following backend endpoints:

- `GET /game/range` - Get today's game data and ML predictions
- `POST /game/guess` - Submit user prediction
- `GET /game/status` - Get game status (user guess, predictions, score)
- `GET /user/points` - Get user's total points
- `GET /leaderboard` - Get leaderboard rankings
- `GET /model/metadata` - Get model metrics and feature importance

## Guessing Rules

Users can submit their prediction at **any time**. There are no time restrictions on when guesses can be submitted.

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

The build output will be in the `dist/` directory (or configured output directory).

## API Configuration

To connect the frontend to the backend API:

1. **Create a `.env.local` file** in the frontend directory:
   ```bash
   VITE_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-2.amazonaws.com/prod
   ```

2. **Replace with your actual API Gateway URL** after deployment

3. **If no API URL is set**, the app will use mock data from localStorage for development

## Deployment

- Build output should end up inside this folder
- GitHub Actions will automatically upload everything to the S3 bucket
- Set `VITE_API_BASE_URL` environment variable during build for API endpoint configuration

## Testing API Connection

Once your backend API is deployed:

1. Get your API Gateway URL from AWS Console or CloudFormation outputs
2. Set it in `.env.local` file
3. Restart the dev server: `npm run dev`
4. The app will automatically use the real API instead of mock data

The frontend will automatically:
- Try to connect to the API if `VITE_API_BASE_URL` is set
- Fall back to mock data if API is not configured or unavailable
