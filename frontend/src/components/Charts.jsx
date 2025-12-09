import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import './Charts.css';

/**
 * Prediction Comparison Chart
 * Shows user guess vs bot prediction
 */
export function PredictionComparison({ userGuess, botPrediction, actualOpen = null }) {
  const data = [
    { name: 'Your Guess', value: userGuess },
    { name: "Bot's Prediction", value: botPrediction },
    ...(actualOpen ? [{ name: 'Actual Open', value: actualOpen }] : []),
  ];

  return (
    <div className="chart-container">
      <h4 className="chart-title">Prediction Comparison</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Legend />
          <Bar dataKey="value" fill="#0066cc" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Feature Importance Chart
 * Shows top metrics by importance
 */
export function FeatureImportance({ featureData = [] }) {
  // Sort by importance and take top 10
  const sortedData = [...featureData]
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .slice(0, 10)
    .map(item => ({
      name: item.name || item.metric,
      importance: item.importance || 0,
    }));

  if (sortedData.length === 0) {
    return (
      <div className="chart-container">
        <h4 className="chart-title">Feature Importance</h4>
        <p className="no-data">No feature importance data available</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h4 className="chart-title">Top Feature Importance</h4>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={sortedData} layout="vertical" margin={{ left: 100, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={90} />
          <Tooltip />
          <Legend />
          <Bar dataKey="importance" fill="#28a745" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Recent NVDA Opens Chart
 * Shows historical opening prices
 */
export function RecentOpens({ recentData = [] }) {
  if (recentData.length === 0) {
    return (
      <div className="chart-container">
        <h4 className="chart-title">Recent NVDA Opens</h4>
        <p className="no-data">No historical data available</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = recentData.map(item => ({
    date: item.date || item.Date,
    open: item.open || item.Open || item.actualOpen || 0,
  }));

  return (
    <div className="chart-container">
      <h4 className="chart-title">Recent NVDA Opening Prices</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Legend />
          <Line type="monotone" dataKey="open" stroke="#0066cc" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

