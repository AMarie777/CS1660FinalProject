

```markdown
# CS1660FinalProject
Financial stock prediction quiz game built with AWS that teaches financial literacy. Users guess next-day stock prices and compete against an ML model.

**Team:**
- Danielle Paton — Frontend
- Alexa McKee — Backend
- Asta Dhanaseelan — Machine Learning
- Amanda Cotumaccio — Cloud Architecture & Deployment

## Project Structure
- `frontend/`  - Danielle’s UI code  
- `backend/`   - Alexa’s Lambda functions  
- `ml_lambda/` - Asta’s model training + SageMaker  
- `infra/`     - Amanda’s CloudFormation templates  
- `.github/workflows/` - Deployment pipeline  

---

# 📈 NVDA Opening Price Prediction Game — Project README

## 🧠 Overview

We are building an interactive website where users try to predict **NVIDIA’s next market opening price**.

The twist:

* Our ML model estimates a **High–Low range** for NVDA’s next opening price.
* Users submit their guess → their guess gets **locked**.
* After submission, the model’s predicted range is shown.
* Next day at market open, whoever is **closest to the real open** earns points.

This README documents:

* How the prediction flow works
* What data the model uses
* What the frontend must display
* List of model metrics & external data sources
* Developer notes for integrating our dataset and model

---

# 🔁 User Flow

### 1. User Enters Prediction
User types what they believe NVDA will open at tomorrow.

### 2. Prediction Locks
Once submitted, user cannot change the prediction.

### 3. Reveal Model Range
The website reveals:
**“Model expects NVDA to open between X and Y.”**

### 4. Show Model Inputs
To help transparency, we show:

* **Top 5–8 in-page metrics (live values + importance)**
* **Rest of data via expandable links** (Yahoo Finance, FRED, Alternative.me Fear & Greed Index, etc.)

### 5. Next Day Score
At market open, system compares user prediction vs actual opening price → assigns points.

---

# 📊 Frontend Requirements

### ✔️ In-Page Display (Top Metrics)

These must be shown clearly on the prediction results page:

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

````

### ✔️ Weblinks Section (Expandable)

Show external sources the model relies on:

**Yahoo Finance Price Data**

* NVDA
* AMD
* TSM
* S&P500 (^GSPC)
* VIX (^VIX)
* SOXX
* SMH
* S&P Futures (ES=F)

**Macro Indicators**

* FRED 10-Year Treasury Yield (DGS10)

**Sentiment Indicator**

* CNN Fear & Greed Index (Alternative.me API)

Use collapsible UI elements:
✓ “Show All External Data Sources”  
✓ “Expand Full Feature List”

**User Points**  
Display how many points the user has so far; no need to display who won or who did not win, SNS topic: email will do.

---

# 🔬 Model Features (All Ranked Metrics)

> Include this as an expandable section in the dev dashboard or documentation.

The model uses **hundreds of engineered features**, including:

* Lags (1–5 days)
* Technical indicators (EMA, MACD, RSI, ATR, OBV)
* Futures data
* Relative performance (NVDA vs SP500, NVDA vs TSM, NVDA vs AMD, NVDA vs SOXX, etc.)
* Volatility measures
* Fear & Greed Index
* 1-month and 1-year z-scores
* Breadth indicators (HILO indexes for S&P500 constituents)

**The list you provided should be added verbatim under a collapsible `<details>` block** in the README.

---

# 🌐 Data Sources (Frontend Needs to Link These)

### Yahoo Finance (Price & Volume Data)
NVDA, AMD, TSM, ^GSPC, ^VIX, SOXX, SMH, ES=F  
**Link example:** [https://finance.yahoo.com/quote/NVDA](https://finance.yahoo.com/quote/NVDA)

### FRED – U.S. 10-Year Treasury Yield
Series: **DGS10**  
[https://fred.stlouisfed.org/series/DGS10](https://fred.stlouisfed.org/series/DGS10)

### Fear & Greed Index API
[https://api.alternative.me/fng/?limit=0](https://api.alternative.me/fng/?limit=0)

---

# 🧩 Data Pipeline (Technical Overview)

* Download price data from Yahoo Finance
* Add futures data (ES)
* Pull macro data (US10Y from FRED)
* Compute technical indicators:

  * EMAs (12, 26)
  * MACD + Signal
  * RSI
  * ATR
  * OBV
  * Overnight gaps
  * Volatility measures

* Download sentiment (Fear & Greed Index)
* Build S&P500 breadth indicators (HILO Open/Close)
* Create relative performance ratios:

  * NVDA vs SP500
  * NVDA vs TSM
  * NVDA vs AMD
  * NVDA vs SOXX
  * NVDA vs SMH

* Create lagged features (1–5 days)
* Save dataset to S3 (`train.csv`)

Documented in `MODEL_PIPELINE.md`.

---

# 🖥️ Frontend Integration Checklist

### Prediction Page
* [ ] Input field for user’s predicted NVDA open
* [ ] “Lock prediction” button
* [ ] Disable input after lock

### Results Page
* [ ] Model high–low range (e.g., $890 – $905)
* [ ] Top metrics card/table (8 metrics)
* [ ] Link list (Yahoo Finance, FRED, Fear & Greed)
* [ ] Expandable panel with full dataset features

### Next Morning
* [ ] Display actual open
* [ ] Show user score
* [ ] Leaderboard (optional)

---

# 🚀 Deployment Notes

* Model dataset saved to S3 (`amazon-sagemaker-<your-id>/data/train.csv`)
* Lambda/backend API should:

```json
{
  "model_low": "...",
  "model_high": "...",
  "top_metrics": {...},
  "external_links": {...}
}
````

---

# 🧑‍🤝‍🧑 Team Technical Readme

## 👥 Team Breakdown

| Member        | Role                                     |
| ------------- | ---------------------------------------- |
| **Astalaxmi** | Machine Learning / Model Output Systems  |
| **Danielle**  | Frontend (React + Tailwind + Cognito)    |
| **Alexa**     | Backend (Lambda, API Gateway, DynamoDB)  |
| **Amanda**    | Integration (CloudFormation, IAM, CI/CD) |

---

# 🧠 Astalaxmi — Machine Learning / Model Output Pipeline

## Responsibilities

Own the ML pipeline generating NVDA predictions in DynamoDB for backend + frontend.

---

## ML Output Format (DynamoDB)

**Table:** `NVDA_Predictions`

| Field               | Type                | Description                   |
| ------------------- | ------------------- | ----------------------------- |
| PredictionDate      | String (YYYY-MM-DD) | Primary Key                   |
| Predicted_High_NVDA | Number              | Model daily high estimate     |
| Predicted_Low_NVDA  | Number              | Model daily low estimate      |
| Predicted_Open_NVDA | Number              | Model predicted opening price |

**Example Item**

```json
{
  "PredictionDate": "2025-11-29",
  "Predicted_High_NVDA": 178.5401153564453,
  "Predicted_Low_NVDA": 169.96322631835938,
  "Predicted_Open_NVDA": 176.5255
}
```

---

## Tasks

1. Define & document NVDA_Predictions schema

   * Document field names and types
   * Confirm timezone: **America/New_York**
   * Provide schema reference to Alexa
2. Generate & publish daily model output

   * Compute High / Low / Open predictions
   * Write to DynamoDB using `PredictionDate` as PK
3. Coordinate with Alexa (Backend)

   * Confirm field names
   * Confirm strategy for fetching latest prediction

---

## Implementation Mechanisms

* Python + **boto3** DynamoDB client
* JSON validation
* Partition key: `PredictionDate`
* Placeholder values (do not commit secrets):

  * **ARN:** `<INSERT_NVDA_PREDICTIONS_TABLE_ARN_HERE>`
  * **Region:** `us-east-2`
  * **AWS Account ID:** `<INSERT_ACCOUNT_ID_HERE>`

---

## Deliverables

* NVDA_Predictions schema documentation
* Example prediction JSON
* ML pipeline script/notebook
* Feature importance metadata (if used)

---

# 🎨 Danielle — Frontend (React + Tailwind + Cognito + CloudFront)

## Responsibilities

Build React UI with authentication, API integrations, visualizations, and guess-time enforcement.

---

## Tasks

1. Full React UI: Login/Signup, Dashboard, Make a Guess, Leaderboard, Daily Results
2. Authentication:

   * Cognito Hosted UI / JS SDK
   * Store ID/Access tokens
   * Send Authorization header on all API calls
3. API Integrations:

   * `GET /game/range`
   * `POST /game/guess`
   * `GET /user/points`
   * `GET /leaderboard`
   * `GET /game/status`
   * `GET /model/metadata`
4. Time-window enforcement (5:15 PM → 7:00 AM ET)

   * Display lockout message
5. Required Visualizations

   * NVDA prediction vs user guess
   * Feature importance bar chart
   * Recent NVDA Opens
6. Deployment: Build → S3, CloudFront, CloudFormation

---

## Deliverables

* Complete React UI
* Authentication flows
* Guess-time lockout
* Charts + responsive components
* S3 build artifacts

---

# 🛠️ Alexa — Backend (Lambda + API Gateway + DynamoDBClient + SNS)

## Responsibilities

Backend APIs, DynamoDB interactions, scoring logic, SNS notifications.
**Must use AWS SDK v3 DynamoDBClient** for NVDA_Predictions.

---

## Tasks

### A. Build API Endpoints

**Tables Needed:** `NVDA_Predictions`, `Users`, `Guesses`, `Leaderboard`

**Use:**

* `@aws-sdk/client-dynamodb`
* `@aws-sdk/lib-dynamodb` (DocumentClient)

**Endpoints:**

1. `GET /game/range` — latest NVDA_Predictions
2. `POST /game/guess` — validate time, store guess
3. `GET /game/status` — user guess, predictions, score
4. `GET /user/points`
5. `GET /leaderboard`
6. `GET /model/metadata`
7. `POST /admin/compute-scores` — scheduled via EventBridge

---

### B. DynamoDBClient Requirements

Backend must interact with all tables and know table ARN:

```text
<INSERT NVDA_PREDICTIONS TABLE ARN HERE>
```

Used for Lambda IAM policies, permissions, CloudFormation templates.

---

### C. Time-Window Enforcement

Guessing allowed: 5:15 PM → 7:00 AM ET
Use `luxon` or `Intl.DateTimeFormat`. Return 403 if outside window.

---

### D. SNS Notifications

```json
{
  "winnerUsername": "...",
  "points": 12,
  "gameDate": "YYYY-MM-DD"
}
```

---

## Deliverables

* Working Lambdas
* API Gateway routes
* DynamoDBClient logic
* Scoring + SNS system
* Documentation for Danielle

---

# 🔗 Amanda — Integration (CloudFormation + IAM + Scheduling + Deployment)

## Responsibilities

End-to-end infrastructure, IAM, CI/CD, Cognito, S3, scheduling.

---

## Tasks

### A. CloudFormation — Infrastructure as Code

Deploy:

* Lambda functions (API + scoring)
* API Gateway
* S3 + CloudFront
* Cognito (User Pool + Client)
* DynamoDB tables: Users, NVDA_Predictions, Guesses, Leaderboard
* SNS topic `game-results`
* EventBridge → scoring Lambda @ 9:31 AM ET
* IAM: Lambda roles, CloudWatch logs, API invoke

### B. Deployment (CI/CD)

GitHub Actions:

* Build & deploy React to S3
* Deploy CloudFormation
* Upload Lambda artifacts
* CloudFront invalidation

### C. System Integration Checklist

* ML pipeline writes predictions
* Backend fetches latest
* Cognito auth works
* Guess window enforced
* Scoring Lambda runs
* Notifications delivered
* Leaderboard updates

---

## Deliverables

* CloudFormation stacks
* IAM roles/policies
* CI/CD pipeline
* EventBridge rules
* Full system integration test reports

---

# ✔️ Final Summary (Quick Roles)

**Astalaxmi (ML):** Generate NVDA prediction output in NVDA_Predictions
**Danielle (Frontend):** React UI, charts, login, API integration, time lockout
**Alexa (Backend):** DynamoDBClient APIs, scoring, SNS, Lambda endpoints
**Amanda (Integration):** CloudFormation, IAM, CI/CD, Cognito, S3, CloudFront, EventBridge


