import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTodayGame, getStockData, submitUserGuess } from '../services/gameService';
import './Game.css';

function Game() {
  const [prediction, setPrediction] = useState('');
  const [gameData, setGameData] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [submittedGuess, setSubmittedGuess] = useState(null);
  const { user, logout } = useAuth();

  // Fetch today's game data and stock data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch both game data (ML predictions) and stock data (from data_lambda) in parallel
        const errors = [];
        const [gameDataResult, stockDataResult] = await Promise.all([
          getTodayGame().catch(err => {
            console.error('Error fetching game data:', err);
            errors.push(`Game data: ${err.message || 'Failed to load'}`);
            return null;
          }),
          getStockData().catch(err => {
            console.error('Error fetching stock data:', err);
            errors.push(`Stock data: ${err.message || 'Failed to load'}`);
            return null;
          })
        ]);
        
        if (gameDataResult) {
          setGameData(gameDataResult);
        }
        if (stockDataResult) {
          setStockData(stockDataResult);
        }
        
        // Show error only if both failed, or show specific errors
        if (!gameDataResult && !stockDataResult) {
          setError(errors.length > 0 ? errors.join('; ') : 'Failed to load data. Please check your API configuration.');
        } else if (errors.length > 0) {
          // Show warning if only one failed
          console.warn('Partial data loaded:', errors);
        }
      } catch (err) {
        setError(err.message || 'Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const guessValue = parseFloat(prediction);
    if (isNaN(guessValue) || guessValue <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSubmitResult(null);
      
      const result = await submitUserGuess(
        guessValue,
        user?.id || user?.email || 'anonymous',
        user?.name || user?.email || 'Anonymous'
      );
      
      setSubmitResult(result);
      setSubmittedGuess(guessValue);
      setPrediction(''); // Clear input after successful submission
    } catch (err) {
      setError(err.message || 'Failed to submit guess');
      console.error('Error submitting guess:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="game-container">
        <div className="game-header">
          <h1 className="title">BEAT THE BOT</h1>
          <div className="user-section">
            <span className="user-name">{user?.name || user?.email}</span>
            <button onClick={logout} className="logout-button">Logout</button>
          </div>
        </div>
        <div className="loading-message">Loading game data...</div>
      </div>
    );
  }

  if (error && !gameData) {
    return (
      <div className="game-container">
        <div className="game-header">
          <h1 className="title">BEAT THE BOT</h1>
          <div className="user-section">
            <span className="user-name">{user?.name || user?.email}</span>
            <button onClick={logout} className="logout-button">Logout</button>
          </div>
        </div>
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  const stockName = gameData?.symbol || 'NVDA';
  const priceRange = gameData?.modelPrediction 
    ? { 
        low: gameData.modelPrediction.lower95, 
        high: gameData.modelPrediction.upper95 
      }
    : { low: 0, high: 0 };
  const botPrediction = gameData?.modelPrediction?.predictedOpen || null;

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="title">BEAT THE BOT</h1>
        <div className="user-section">
          <span className="user-name">{user?.name || user?.email}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </div>
      
      {gameData && (
        <>
          <div className="game-date">
            Game Date: {gameData.gameDate || new Date().toISOString().slice(0, 10)}
          </div>
          
          <p className="instruction">
            {stockName} opening price will be in the range of [
            <strong>${priceRange.low.toFixed(2)}</strong>, 
            <strong>${priceRange.high.toFixed(2)}</strong>].
          </p>
          
          <div className="bot-prediction">
            <h3 className="bot-prediction-title">🤖 Bot's Prediction</h3>
            <div className="bot-prediction-value">
              ${botPrediction?.toFixed(2) || 'N/A'}
            </div>
            <p className="bot-prediction-note">
              (95% confidence interval: ${priceRange.low.toFixed(2)} - ${priceRange.high.toFixed(2)})
            </p>
          </div>

          {stockData && (
            <div className="data-section">
              <h3 className="data-title">Stock Data</h3>
              <div className="data-item">
                <span className="data-label">Previous Close:</span>
                <span className="data-value">${stockData.previousClose?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Latest Open:</span>
                <span className="data-value">${stockData.latestOpen?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Latest High:</span>
                <span className="data-value">${stockData.latestHigh?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Latest Low:</span>
                <span className="data-value">${stockData.latestLow?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">52 Week High:</span>
                <span className="data-value">${stockData.week52High?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="data-item">
                <span className="data-label">52 Week Low:</span>
                <span className="data-value">${stockData.week52Low?.toFixed(2) || 'N/A'}</span>
              </div>
            </div>
          )}
          
          <h2 className="question">What do you think the opening price will be?</h2>
          
          <form onSubmit={handleSubmit} className="prediction-form">
            <input
              type="number"
              step="0.01"
              min="0"
              className="prediction-input"
              placeholder="Enter your prediction"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              disabled={submitting}
              required
            />
            <button 
              type="submit" 
              className="submit-button"
              disabled={submitting || !prediction}
            >
              {submitting ? 'Submitting...' : 'Submit Guess'}
            </button>
          </form>

          {error && (
            <div className="error-message">{error}</div>
          )}

          {submitResult && (
            <div className="submit-result">
              <h3 className="result-title">Guess Submitted!</h3>
              <div className="result-details">
                <div className="result-item">
                  <span className="result-label">Your Guess:</span>
                  <span className="result-value">${(submittedGuess || 0).toFixed(2)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Bot's Prediction:</span>
                  <span className="result-value">${submitResult.botPrediction?.toFixed(2) || botPrediction?.toFixed(2) || 'N/A'}</span>
                </div>
                {submitResult.didUserBeatBot !== null && (
                  <div className={`result-item ${submitResult.didUserBeatBot ? 'result-success' : 'result-failure'}`}>
                    <span className="result-label">
                      {submitResult.didUserBeatBot ? '🎉 You beat the bot!' : '🤖 Bot was closer'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Game;

