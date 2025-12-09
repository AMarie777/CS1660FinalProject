import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getTodayGame, 
  submitUserGuess, 
  getGameStatus,
  getUserPoints,
  getModelMetadata 
} from '../services/gameService';
import ModelMetrics from './ModelMetrics';
import { PredictionComparison, FeatureImportance, RecentOpens } from './Charts';
import './Game.css';

// Import mock data for fallback
const MOCK_GAME_DATA = {
  gameDate: new Date().toISOString().slice(0, 10),
  symbol: 'NVDA',
  modelPrediction: {
    predictedOpen: 145.50,
    lower95: 142.30,
    upper95: 148.70,
  },
};

// Check if we're in demo mode (using mock data)
const isDemoMode = !import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL.includes('your-api-gateway-url');

function Game() {
  const [prediction, setPrediction] = useState('');
  const [gameData, setGameData] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [userPoints, setUserPoints] = useState(null);
  const [modelMetadata, setModelMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const { user, logout } = useAuth();

  // Fetch all game data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch data in parallel
        const [gameDataResult, statusResult, pointsResult, metadataResult] = await Promise.allSettled([
          getTodayGame().catch(err => {
            console.error('Error fetching game data:', err);
            // Return fallback data instead of throwing
            return MOCK_GAME_DATA;
          }),
          getGameStatus().catch(err => {
            console.error('Error fetching game status:', err);
            return null;
          }),
          getUserPoints().catch(err => {
            console.error('Error fetching user points:', err);
            return { points: 0 };
          }),
          getModelMetadata().catch(err => {
            console.error('Error fetching model metadata:', err);
            return null;
          }),
        ]);

        if (gameDataResult.status === 'fulfilled') {
          setGameData(gameDataResult.value);
        } else {
          console.error('Error fetching game data:', gameDataResult.reason);
          setGameData(MOCK_GAME_DATA);
        }

        if (statusResult.status === 'fulfilled' && statusResult.value) {
          setGameStatus(statusResult.value);
          // If user already submitted, show their guess
          if (statusResult.value.userGuess) {
            setSubmitResult({
              userGuess: statusResult.value.userGuess,
              botPrediction: statusResult.value.modelPrediction?.predictedOpen,
            });
          }
        }

        if (pointsResult.status === 'fulfilled' && pointsResult.value) {
          setUserPoints(pointsResult.value.points || 0);
        }

        if (metadataResult.status === 'fulfilled' && metadataResult.value) {
          setModelMetadata(metadataResult.value);
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
      
      const result = await submitUserGuess(
        guessValue,
        user?.id || user?.email || 'anonymous',
        user?.name || user?.email || 'Anonymous'
      );
      
      setSubmitResult(result);
      setPrediction('');
      // Refresh game status to get updated data
      try {
        const statusResult = await getGameStatus();
        setGameStatus(statusResult);
      } catch (err) {
        console.error('Error refreshing game status:', err);
      }
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
          <h1 className="title">📈 BEAT THE BOT</h1>
          <div className="user-section">
            {userPoints !== null && (
              <span className="user-points">Points: {userPoints}</span>
            )}
            <span className="user-name">{user?.name || user?.email}</span>
            <button onClick={logout} className="logout-button">Logout</button>
          </div>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link active">Game</Link>
          <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
        </div>
        <div className="loading-message">Loading game data...</div>
      </div>
    );
  }

  // Always show game interface, even if some APIs fail
  if (error && !gameData) {
    return (
      <div className="game-container">
        <div className="game-header">
          <h1 className="title">📈 BEAT THE BOT</h1>
          <div className="user-section">
            {userPoints !== null && (
              <span className="user-points">Points: {userPoints}</span>
            )}
            <span className="user-name">{user?.name || user?.email}</span>
            <button onClick={logout} className="logout-button">Logout</button>
          </div>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link active">Game</Link>
          <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
        </div>
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  const currentGameData = gameData || MOCK_GAME_DATA;
  const stockName = currentGameData?.symbol || 'NVDA';
  const priceRange = currentGameData?.modelPrediction 
    ? { 
        low: currentGameData.modelPrediction.lower95 || currentGameData.modelPrediction.Predicted_Low_NVDA || 142.30, 
        high: currentGameData.modelPrediction.upper95 || currentGameData.modelPrediction.Predicted_High_NVDA || 148.70 
      }
    : { low: 142.30, high: 148.70 };
  const botPrediction = currentGameData?.modelPrediction?.predictedOpen || currentGameData?.modelPrediction?.Predicted_Open_NVDA || 145.50;
  const userGuess = submitResult?.userGuess || gameStatus?.userGuess || null;
  const actualOpen = gameStatus?.actualOpen || submitResult?.actualOpen || null;

  return (
    <div className="game-container">
      <div className="game-header">
        <h1 className="title">📈 BEAT THE BOT</h1>
        <div className="user-section">
          {userPoints !== null && (
            <span className="user-points">Points: {userPoints}</span>
          )}
          <span className="user-name">{user?.name || user?.email}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </div>

      <div className="nav-links">
        <Link to="/" className="nav-link active">Game</Link>
        <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
      </div>

      {/* Show demo mode notice if using fallback data */}
      {isDemoMode && (
        <div className="demo-notice">
          🎮 Demo Mode: Using mock data. Set VITE_API_BASE_URL environment variable to connect to backend API.
        </div>
      )}
      
      {(gameData || true) && (
        <>
          <div className="game-date">
            Game Date: {(gameData || MOCK_GAME_DATA).gameDate || new Date().toISOString().slice(0, 10)}
          </div>

          {/* User Guess Section - Show input if no guess submitted yet */}
          {!userGuess ? (
            <div className="prediction-section">
              <h2 className="question">What do you think NVIDIA's opening price will be tomorrow?</h2>
              
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
                  {submitting ? 'Submitting...' : 'Lock Prediction'}
                </button>
              </form>
              
              <p className="prediction-note">
                Once you submit, your prediction will be locked and cannot be changed.
              </p>
            </div>
          ) : (
            <>
              {/* Show locked prediction */}
              <div className="submit-result">
                <h3 className="result-title">✅ Your Prediction is Locked!</h3>
                <div className="result-details">
                  <div className="result-item">
                    <span className="result-label">Your Guess:</span>
                    <span className="result-value">${userGuess.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Reveal Model Range AFTER submission */}
              <div className="bot-prediction">
                <h3 className="bot-prediction-title">🤖 Model's Prediction Range</h3>
                <p className="bot-prediction-reveal">
                  Model expects NVDA to open between <strong>${priceRange.low.toFixed(2)}</strong> and <strong>${priceRange.high.toFixed(2)}</strong>
                </p>
                {botPrediction && (
                  <div className="bot-prediction-value">
                    Model's predicted open: ${botPrediction.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Show actual results if available (next day) */}
              {actualOpen && (
                <div className="actual-results">
                  <h3 className="result-title">📊 Results</h3>
                  <div className="result-details">
                    <div className="result-item">
                      <span className="result-label">Actual Opening Price:</span>
                      <span className="result-value">${actualOpen.toFixed(2)}</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">Your Error:</span>
                      <span className="result-value">${Math.abs(userGuess - actualOpen).toFixed(2)}</span>
                    </div>
                    {botPrediction && (
                      <div className="result-item">
                        <span className="result-label">Bot's Error:</span>
                        <span className="result-value">${Math.abs(botPrediction - actualOpen).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Step 4: Show Model Inputs - Only AFTER user submits */}
          {userGuess && (
            <>
              {/* Top 5-8 Metrics with live values + importance */}
              {(modelMetadata || gameData) && (
                <ModelMetrics 
                  metrics={modelMetadata?.topMetrics || modelMetadata?.metrics || {}}
                  featureImportance={modelMetadata?.featureImportance || []}
                />
              )}

              {/* Visualizations - Only show after submission */}
              {botPrediction && (
                <div className="charts-section">
                  <PredictionComparison 
                    userGuess={userGuess}
                    botPrediction={botPrediction}
                    actualOpen={actualOpen}
                  />
                </div>
              )}
            </>
          )}

          {/* Feature Importance Chart */}
          {modelMetadata?.featureImportance && modelMetadata.featureImportance.length > 0 && (
            <FeatureImportance featureData={modelMetadata.featureImportance} />
          )}

          {/* Recent Opens Chart */}
          {gameStatus?.recentOpens && gameStatus.recentOpens.length > 0 && (
            <RecentOpens recentData={gameStatus.recentOpens} />
          )}
        </>
      )}
    </div>
  );
}

export default Game;
