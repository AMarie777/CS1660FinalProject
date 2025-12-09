import React, { useState } from 'react';
import './ModelMetrics.css';

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

const EXTERNAL_LINKS = {
  yahooFinance: {
    title: 'Yahoo Finance Price Data',
    links: [
      { name: 'NVDA', url: 'https://finance.yahoo.com/quote/NVDA' },
      { name: 'AMD', url: 'https://finance.yahoo.com/quote/AMD' },
      { name: 'TSM', url: 'https://finance.yahoo.com/quote/TSM' },
      { name: 'S&P500 (^GSPC)', url: 'https://finance.yahoo.com/quote/%5EGSPC' },
      { name: 'VIX (^VIX)', url: 'https://finance.yahoo.com/quote/%5EVIX' },
      { name: 'SOXX', url: 'https://finance.yahoo.com/quote/SOXX' },
      { name: 'SMH', url: 'https://finance.yahoo.com/quote/SMH' },
      { name: 'S&P Futures (ES=F)', url: 'https://finance.yahoo.com/quote/ES%3DF' },
    ],
  },
  macro: {
    title: 'Macro Indicators',
    links: [
      { name: 'FRED 10-Year Treasury Yield (DGS10)', url: 'https://fred.stlouisfed.org/series/DGS10' },
    ],
  },
  sentiment: {
    title: 'Sentiment Indicator',
    links: [
      { name: 'CNN Fear & Greed Index', url: 'https://api.alternative.me/fng/?limit=0' },
    ],
  },
};

function ModelMetrics({ metrics = {}, featureImportance = [] }) {
  const [expanded, setExpanded] = useState({
    externalLinks: false,
    fullFeatures: false,
  });

  // Format metric values
  const formatMetricValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return String(value);
  };

  return (
    <div className="model-metrics-container">
      <h3 className="metrics-title">📊 Model Metrics & Data Sources</h3>

      {/* Top 8 Metrics */}
      <div className="metrics-section">
        <h4 className="section-title">Top Metrics (by Importance)</h4>
        <div className="metrics-table-container">
          <table className="metrics-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Metric Name</th>
                <th>Value Today</th>
                <th>Importance</th>
              </tr>
            </thead>
            <tbody>
              {TOP_METRICS.map((metricName, index) => {
                const metricData = metrics[metricName] || {};
                const importance = featureImportance.find(f => f.name === metricName)?.importance || index + 1;
                return (
                  <tr key={metricName}>
                    <td className="rank-cell">#{index + 1}</td>
                    <td className="metric-name-cell">{metricName}</td>
                    <td className="metric-value-cell">
                      {formatMetricValue(metricData.value || metricData)}
                    </td>
                    <td className="importance-cell">{importance}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* External Links Section */}
      <div className="metrics-section">
        <button
          className="expand-button"
          onClick={() => setExpanded({ ...expanded, externalLinks: !expanded.externalLinks })}
        >
          {expanded.externalLinks ? '▼' : '▶'} Show All External Data Sources
        </button>
        
        {expanded.externalLinks && (
          <div className="external-links-container">
            {Object.entries(EXTERNAL_LINKS).map(([key, section]) => (
              <div key={key} className="link-section">
                <h5 className="link-section-title">{section.title}</h5>
                <ul className="link-list">
                  {section.links.map((link) => (
                    <li key={link.name} className="link-item">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link"
                      >
                        {link.name} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Feature List */}
      <div className="metrics-section">
        <button
          className="expand-button"
          onClick={() => setExpanded({ ...expanded, fullFeatures: !expanded.fullFeatures })}
        >
          {expanded.fullFeatures ? '▼' : '▶'} Expand Full Feature List
        </button>
        
        {expanded.fullFeatures && (
          <div className="full-features-container">
            <p className="features-description">
              The model uses hundreds of engineered features, including:
            </p>
            <ul className="features-list">
              <li>Lags (1–5 days)</li>
              <li>Technical indicators (EMA, MACD, RSI, ATR, OBV)</li>
              <li>Futures data</li>
              <li>Relative performance (NVDA vs SP500, NVDA vs TSM, NVDA vs AMD, NVDA vs SOXX, etc.)</li>
              <li>Volatility measures</li>
              <li>Fear & Greed Index</li>
              <li>1-month and 1-year z-scores</li>
              <li>Breadth indicators (HILO indexes for S&P500 constituents)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModelMetrics;

