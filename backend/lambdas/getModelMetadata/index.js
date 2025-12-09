// Mock/model metadata endpoint
// In production, this could pull from a DynamoDB table or S3 file with feature importance data

const TOP_METRICS = [
  'Close_NVDA_lag3',
  'EMA_12_NVDA',
  'Close_^GSPC_lag3',
  'ES_High',
  'NVDA_vs_SP500_C',
  'NVDA_vs_SP500_C_lag3',
  'Low_NVDA',
  'High_^GSPC',
];

// Mock data - in production, this should come from the ML pipeline or model training output
const MOCK_METRICS = {
  'Close_NVDA_lag3': { value: 144.20, importance: 1 },
  'EMA_12_NVDA': { value: 143.85, importance: 2 },
  'Close_^GSPC_lag3': { value: 5420.50, importance: 3 },
  'ES_High': { value: 5440.00, importance: 4 },
  'NVDA_vs_SP500_C': { value: 2.66, importance: 5 },
  'NVDA_vs_SP500_C_lag3': { value: 2.64, importance: 6 },
  'Low_NVDA': { value: 143.10, importance: 7 },
  'High_^GSPC': { value: 5435.00, importance: 8 },
};

const MOCK_FEATURE_IMPORTANCE = TOP_METRICS.map((name, index) => ({
  name,
  importance: 9 - index, // Higher importance for first metrics
  metric: name,
}));

exports.handler = async (event) => {
  try {
    // TODO: In production, fetch actual metrics from:
    // - DynamoDB table with latest feature values
    // - Model training output stored in S3
    // - Real-time calculation from data_lambda

    const response = {
      topMetrics: MOCK_METRICS,
      metrics: MOCK_METRICS,
      featureImportance: MOCK_FEATURE_IMPORTANCE,
      externalLinks: {
        yahooFinance: [
          { name: 'NVDA', url: 'https://finance.yahoo.com/quote/NVDA' },
          { name: 'AMD', url: 'https://finance.yahoo.com/quote/AMD' },
          { name: 'TSM', url: 'https://finance.yahoo.com/quote/TSM' },
          { name: 'S&P500 (^GSPC)', url: 'https://finance.yahoo.com/quote/%5EGSPC' },
          { name: 'VIX (^VIX)', url: 'https://finance.yahoo.com/quote/%5EVIX' },
          { name: 'SOXX', url: 'https://finance.yahoo.com/quote/SOXX' },
          { name: 'SMH', url: 'https://finance.yahoo.com/quote/SMH' },
          { name: 'S&P Futures (ES=F)', url: 'https://finance.yahoo.com/quote/ES%3DF' },
        ],
        macro: [
          { name: 'FRED 10-Year Treasury Yield (DGS10)', url: 'https://fred.stlouisfed.org/series/DGS10' },
        ],
        sentiment: [
          { name: 'CNN Fear & Greed Index', url: 'https://api.alternative.me/fng/?limit=0' },
        ],
      },
    };

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error("getModelMetadata error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};

