# CS1660FinalProject
Financial stock prediction quiz game built with AWS that teaches financial literacy. Users guess next-day stock prices and compete against an ML model.

Team:
- Danielle Paton — Frontend
- Alexa McKee — Backend
- Asta Dhanaseelan — Machine Learning
- Amanda Cotumaccio — Cloud Architecture & Deployment

## Project Structure
frontend/  - Danielle’s UI code  
backend/   - Alexa’s Lambda functions  
ml_lambda/        - Asta’s model training + SageMaker  
infra/     - Amanda’s CloudFormation templates  
.github/workflows/ - Deployment pipeline  


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

# 🔁 **User Flow**

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

# 📊 **Frontend Requirements**

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

### Suggested format (cards or table):

```
Metric Name          | Value Today  | Importance Score
-------------------------------------------------------
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
Display how much points the user has so far, no need to display who won or who did not win, sns topic: email will do.

---

# 🔬 **Model Features (All Ranked Metrics)**

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

# 🌐 **Data Sources (Frontend Needs to Link These)**

### Yahoo Finance (Price & Volume Data)

We collect:
NVDA, AMD, TSM, ^GSPC, ^VIX, SOXX, SMH, ES=F
**Link format example:**
[https://finance.yahoo.com/quote/NVDA](https://finance.yahoo.com/quote/NVDA)

### FRED – U.S. 10-Year Treasury Yield

Series: **DGS10**
[https://fred.stlouisfed.org/series/DGS10](https://fred.stlouisfed.org/series/DGS10)

### Fear & Greed Index API

Endpoint:
[https://api.alternative.me/fng/?limit=0](https://api.alternative.me/fng/?limit=0)

---

# 🧩 How the Data Pipeline Works (Technical Overview)

Your data script:

* Downloads price data from Yahoo Finance
* Adds futures data (ES)
* Pulls macro data (US10Y from FRED)
* Computes technical indicators:

  * EMAs (12, 26)
  * MACD + Signal
  * RSI
  * ATR
  * OBV
  * Overnight gaps
  * Volatility measures
* Downloads sentiment (Fear & Greed Index)
* Builds S&P500 breadth indicators (HILO Open/Close)
* Creates relative performance ratios:

  * NVDA vs SP500
  * NVDA vs TSM
  * NVDA vs AMD
  * NVDA vs SOXX
  * NVDA vs SMH
* Creates lagged features (1–5 days)
* Saves dataset to S3 (`train.csv`)

This should be documented in `MODEL_PIPELINE.md`.

---

# 🖥️ **Frontend Integration Checklist**

### **Prediction Page**

* [ ] Input field for user’s predicted NVDA open
* [ ] “Lock prediction” button
* [ ] After lock → disable input

### **Results Page**

* [ ] Model high–low range (e.g., $890 – $905)
* [ ] Top metrics card/table (8 metrics)
* [ ] Link list (Yahoo Finance, FRED, Fear & Greed)
* [ ] “See full dataset features” expandable panel (paste full list)

### **Next Morning**

* [ ] Display actual open
* [ ] Show user score
* [ ] Leaderboard (optional)

---

# 🚀 Deployment Notes

* The model dataset is saved to S3 (`amazon-sagemaker-<your-id>/data/train.csv`)
* Lambda or backend API should:

  * Fetch latest row
  * Run model inference
  * Return:

    ```
    {
      "model_low": ...,
      "model_high": ...,
      "top_metrics": {...},
      "external_links": {...}
    }
    ```

---

# 🧑‍🤝‍🧑 For Teammate(s):

### **Frontend Dev**

* Build the prediction UI
* Display model range + top features
* Add link-based exposure to raw data sources
* Make UI clean + game-like

### **Backend Dev**

* Create inference endpoint
* Store user guesses
* Compare next-day result
* Compute scores

### **ML Dev**

* Finalize model
* Maintain feature ranking
* Ensure transparency / reproducibility

---


````markdown
# 📘 Team Technical Readme

This document outlines the full breakdown of team roles, responsibilities, tasks, implementation mechanisms, deliverables, and all shared data formats used across ML, Backend, Frontend, and Infrastructure.

---

# 👥 Team Breakdown

| Member       | Role                                      |
|--------------|--------------------------------------------|
| **Astalaxmi** | Machine Learning / Model Output Systems     |
| **Danielle**  | Frontend (React + Tailwind + Cognito)       |
| **Alexa**     | Backend (Lambda, API Gateway, DynamoDB, SNS)|
| **Amanda**    | Integration (CloudFormation, IAM, CI/CD)    |

Each teammate receives:
- Responsibilities  
- Tasks  
- Implementation mechanisms  
- Deliverables  

---

# 🧠 Astalaxmi — Machine Learning / Model Output Pipeline

## Responsibilities
Own the ML pipeline that generates NVDA predictions and writes them into DynamoDB in a consistent schema required by backend + frontend.

---

## ML Output Format (DynamoDB)

### **DynamoDB Table:** `NVDA_Predictions`

### Schema

| Field                  | Type               | Description                        |
|------------------------|--------------------|------------------------------------|
| PredictionDate         | String (YYYY-MM-DD)| **Primary Key**                    |
| Predicted_High_NVDA    | Number             | Model daily high estimate          |
| Predicted_Low_NVDA     | Number             | Model daily low estimate           |
| Predicted_Open_NVDA    | Number             | Model predicted opening price      |

### Example DynamoDB Item
```json
{
  "PredictionDate": "2025-11-29",
  "Predicted_High_NVDA": 178.5401153564453,
  "Predicted_Low_NVDA": 169.96322631835938,
  "Predicted_Open_NVDA": 176.5255
}

* these are needed to create api gateway for dynamodb using lambda (js):
* arn: cannot be posted on github @alexa I will share this by text
* region: us east 2
* aws account id: will share by text



## Tasks

### 1. Define & document NVDA_Predictions schema

* Document field names and types
* Confirm timezone: **America/New_York**
* Provide schema reference to Alexa

### 2. Generate & publish daily model output

* Compute High / Low / Open predictions
* Write to DynamoDB using `PredictionDate` as PK

### 3. Coordinate with Alexa (Backend)

* Confirm field names
* Confirm strategy for fetching latest prediction (typically scan + sort OR fixed PK)

---

## Implementation Mechanisms

* Python + **boto3** DynamoDB client
* JSON validation
* Partition key: `PredictionDate`

---

## Deliverables

* NVDA_Predictions schema documentation
* Example prediction JSON
* ML pipeline script/notebook
* Feature importance metadata (if used)

---

# 🎨 Danielle — Frontend (React + Tailwind + Cognito + CloudFront)

## Responsibilities

Build the React UI with authentication, API integrations, visualizations, and guess-time enforcement.

---

## Tasks

### 1. Full React UI

Pages:

* Login / Signup (Cognito)
* Dashboard
* Make a Guess (locked outside allowed window)
* Leaderboard
* Daily Results

### 2. Authentication

* Cognito Hosted UI or Amazon Cognito JS SDK
* Store ID/Access tokens
* Send Authorization header on all API calls

### 3. API Integrations

Using Axios/fetch, call:

* `GET /game/range`
* `POST /game/guess`
* `GET /user/points`
* `GET /leaderboard`
* `GET /game/status`
* `GET /model/metadata`

### 4. Time-window enforcement

Guessing only allowed:
**5:15 PM → 7:00 AM ET**

Locked UI message:

> “Guess window closed. Reopens at 5:15 PM ET.”

### 5. Required Visualizations

* NVDA prediction vs user guess
* Feature importance bar chart
* Visualization 2 — Recent NVDA Opens 

### 6. Deployment

* Build → S3 upload
* Served through CloudFront
* CloudFormation used for provisioning

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

Build all backend APIs, DynamoDB business logic, scoring logic, and notification system.
**Must use AWS SDK v3 DynamoDBClient** to access ML’s NVDA_Predictions data.

---

## Tasks

## A. Build API Endpoints

### DynamoDB Tables Needed

* `NVDA_Predictions` (ML output)
* `Users`
* `Guesses`
* `Leaderboard`

### Use:

* `@aws-sdk/client-dynamodb`
* `@aws-sdk/lib-dynamodb` (DocumentClient)

---

## Endpoints (Full List)

### **1. GET /game/range**

* Read the **latest** item from `NVDA_Predictions`
* Return:

  * Predicted_High_NVDA
  * Predicted_Low_NVDA
  * Predicted_Open_NVDA

### **2. POST /game/guess**

* Validate guess-time window
* Write guess to DynamoDB
* Return model values

### **3. GET /game/status**

* User guess
* Predictions
* Score
* (Optional) Actual market open

### **4. GET /user/points**

* Sum previous scores

### **5. GET /leaderboard**

* Return top users

### **6. GET /model/metadata**

* Feature importance if provided

### **7. POST /admin/compute-scores**

* EventBridge scheduled @ market open
* Compute score differences
* Update leaderboard
* Send SNS notifications

---

## B. DynamoDBClient Requirements

Backend must interact with:
`NVDA_Predictions`, `Users`, `Guesses`, `Leaderboard`

Must know table ARN for IAM.

### ❗ DynamoDB ARN for NVDA_Predictions:

```
<INSERT NVDA_Predictions TABLE ARN HERE>
```

Backend needs this ARN for:

* Lambda execution role policies
* Resource-based DynamoDB permissions
* CloudFormation templates

---

## C. Time-Window Enforcement

Guessing allowed only between:
**5:15 PM → 7:00 AM ET**

Use:

* `luxon`
* or `Intl.DateTimeFormat` (ET conversion)

Return HTTP 403 if outside window.

---

## D. SNS Notifications

SNS payload format:

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
* API Gateway routing
* DynamoDB read/write logic
* Scoring + SNS system
* Documentation for Danielle

---

# 🔗 Amanda — Integration (CloudFormation + IAM + Scheduling + Deployment)

## Responsibilities

End-to-end infrastructure provisioning, IAM, CI/CD, Cognito, S3, and scheduling.

---

## Tasks

## A. CloudFormation — Infrastructure as Code

Must deploy:

### **Compute**

* All Lambda functions (API + scoring)

### **Delivery**

* API Gateway
* S3 website bucket
* CloudFront distribution

### **Authentication**

* Cognito User Pool
* Cognito Client

### **Data**

* DynamoDB tables:

  * Users
  * NVDA_Predictions
  * Guesses
  * Leaderboard

### **Notifications**

* SNS topic `game-results`

### **Scheduling**

* EventBridge → scoring Lambda at **9:31 AM ET**

### **IAM**

* Lambda execution roles (DDB read/write, SNS publish)
* CloudWatch logs
* API Gateway invoke permissions

---

## B. Deployment (CI/CD)

GitHub Actions:

* Build & deploy React to S3
* Deploy CloudFormation
* Upload Lambda artifacts
* CloudFront cache invalidation

---

## C. System Integration Checklist

* ML pipeline writes predictions to DynamoDB
* Backend fetches correct latest item
* Cognito authentication works in frontend
* Guess window enforced
* Scoring Lambda runs on schedule
* Notifications delivered
* Leaderboard updates correctly

---

## Deliverables

* CloudFormation stacks
* IAM roles/policies
* CI/CD pipeline
* EventBridge rules
* Full system integration test results

---

# ✔️ Final Summary (Quick Roles)

### **Astalaxmi (ML)**

Generate NVDA prediction output and write to `NVDA_Predictions`.

### **Danielle (Frontend)**

React UI, login, charts, time lockout, API integration.

### **Alexa (Backend)**

DynamoDBClient-based APIs, scoring logic, SNS, Lambda endpoints.

### **Amanda (Integration)**

CloudFormation, IAM, CI/CD, Cognito, S3, CloudFront, EventBridge.

---

```
```

