import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getTodayGame,
  submitUserGuess,
  getGameStatus,
  getUserPoints,
  getModelMetadata,
} from "../services/gameService";
import ModelMetrics from "./ModelMetrics";
import { PredictionComparison, FeatureImportance } from "./Charts";
import "./Game.css";

// Fallback if backend is unreachable
const MOCK_GAME_DATA = {
  gameDate: new Date().toISOString().slice(0, 10),
  modelPrediction: {
    predictedOpen: 145.5,
    lower95: 142.3,
    upper95: 148.7,
  },
};

function Game() {
  const [prediction, setPrediction] = useState("");
  const [gameData, setGameData] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [modelMetadata, setModelMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const { user, logout } = useAuth();

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    try {
      setLoading(true);
      setError(null);

      const [rangeRes, statusRes, pointsRes, metadataRes] =
        await Promise.allSettled([
          getTodayGame(),
          getGameStatus(),
          getUserPoints(),
          getModelMetadata(),
        ]);

      // Prediction range
      if (rangeRes.status === "fulfilled" && rangeRes.value) {
        setGameData(rangeRes.value);
      } else {
        setGameData(MOCK_GAME_DATA);
      }

      // Game status
      if (statusRes.status === "fulfilled" && statusRes.value) {
        setGameStatus(statusRes.value);

        if (statusRes.value.userGuess !== null) {
          setSubmitResult({ userGuess: statusRes.value.userGuess });
        }
      }

      // Points
      if (pointsRes.status === "fulfilled" && pointsRes.value) {
        setUserPoints(pointsRes.value.points || 0);
      }

      // Model Metadata
      if (metadataRes.status === "fulfilled" && metadataRes.value) {
        setModelMetadata(metadataRes.value);
      }
    } catch (err) {
      console.error("Error loading:", err);
      setError("Failed to load game data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Prevent duplicate submissions
    const currentGuess = submitResult?.userGuess ?? gameStatus?.userGuess ?? null;
    if (currentGuess) {
      setError("You have already submitted a prediction. Only one guess per game is allowed.");
      return;
    }

    const guessValue = Number(prediction);
    if (!Number.isFinite(guessValue) || guessValue <= 0) {
      setError("Please enter a valid positive number.");
      return;
    }

    try {
      setSubmitting(true);
      
      // Submit the guess
      const result = await submitUserGuess(guessValue);
      
      // Immediately set the userGuess from the submitted value
      // This ensures the UI updates right away
      const submittedGuess = result.guess || result.userGuess || guessValue;
      setSubmitResult({ userGuess: submittedGuess });
      setPrediction("");

      // Refresh all game data after submission
      const [statusRes, pointsRes, metadataRes] = await Promise.allSettled([
        getGameStatus(),
        getUserPoints(),
        getModelMetadata()
      ]);

      // Update game status
      if (statusRes.status === "fulfilled" && statusRes.value) {
        setGameStatus(statusRes.value);
        // Ensure userGuess is set from status if available
        if (statusRes.value.userGuess !== null && statusRes.value.userGuess !== undefined) {
          setSubmitResult({ userGuess: statusRes.value.userGuess });
        }
      }

      // Update points
      if (pointsRes.status === "fulfilled" && pointsRes.value) {
        setUserPoints(pointsRes.value.points || 0);
      }

      // Update model metadata
      if (metadataRes.status === "fulfilled" && metadataRes.value) {
        setModelMetadata(metadataRes.value);
      }
    } catch (err) {
      console.error("Submit error:", err);
      // Reset submitResult on error so user can try again
      setSubmitResult(null);
      if (err.message?.includes("already") || err.message?.includes("duplicate")) {
        setError("You have already submitted a prediction for this game. Only one guess per game is allowed.");
      } else {
        setError("Failed to submit prediction. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="game-container">
        <Header user={user} userPoints={userPoints} logout={logout} />
        <div className="loading-message">Loading game data...</div>
      </div>
    );
  }

  const current = gameData || MOCK_GAME_DATA;
  const status = gameStatus?.status || "OPEN";
  const userGuess = submitResult?.userGuess ?? gameStatus?.userGuess ?? null;

  const predictionRange = current.modelPrediction || MOCK_GAME_DATA.modelPrediction;
  const botPrediction = predictionRange.predictedOpen;
  const actualOpen = gameStatus?.actualOpen || null;

  return (
    <div className="game-container">
      <Header user={user} userPoints={userPoints} logout={logout} />

      <div className="game-date">Game Date: {current.gameDate}</div>

      {/* USER HAS NOT GUESSED YET - Show prediction form */}
      {!userGuess && status !== "CLOSED" && (
        <div className="prediction-section">
          {/* Show Model Prediction BEFORE user guesses */}
          <div className="model-prediction-preview">
            <h3 className="model-preview-title">Model's Prediction Range</h3>
            <div className="model-preview-range-display">
              <div className="model-guess-item">
                <div className="model-guess-label">Low Guess</div>
                <div className="model-guess-value range-low">
                  ${predictionRange.lower95.toFixed(2)}
                </div>
              </div>
              <div className="model-guess-separator">to</div>
              <div className="model-guess-item">
                <div className="model-guess-label">High Guess</div>
                <div className="model-guess-value range-high">
                  ${predictionRange.upper95.toFixed(2)}
                </div>
              </div>
            </div>
            <p className="model-preview-description">
              Model expects NVDA to open within this range
            </p>
          </div>

          <h2 className="question">What will NVDA open at tomorrow?</h2>
          <p className="instruction-text">
            Enter your prediction for NVIDIA's opening price. Once you submit, your guess will be locked and you won't be able to change it.
          </p>

          <form onSubmit={handleSubmit} className="prediction-form">
            <input
              type="number"
              step="0.01"
              className="prediction-input"
              placeholder="Enter your prediction (e.g., 145.50)"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              disabled={submitting}
              required
            />
            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? "Locking..." : "Lock Prediction"}
            </button>
          </form>
        </div>
      )}

      {/* USER HAS SUBMITTED - Full reveal of all information */}
      {userGuess && (
        <div className="submitted-view">
          {/* Comparison Section - User vs Model */}
          <div className="comparison-section">
            <h2 className="comparison-title">Your Prediction vs Model Prediction</h2>
            <div className="predictions-comparison-grid">
              <div className="prediction-card user-prediction">
                <div className="prediction-label">Your Prediction</div>
                <div className="prediction-value user-value">
                  ${Number(userGuess).toFixed(2)}
                </div>
                <div className="prediction-status">Locked</div>
              </div>
              <div className="prediction-card model-prediction">
                <div className="prediction-label">Model's Prediction</div>
                <div className="prediction-value model-value">
                  ${botPrediction.toFixed(2)}
                </div>
                <div className="prediction-status">Predicted Open</div>
              </div>
            </div>
          </div>

          {/* Model Range Display */}
          <div className="bot-prediction reveal-section">
            <h3>Model Prediction Range</h3>
            <div className="model-range-display">
              <p className="range-message">
                The model expects NVDA to open between{" "}
                <strong className="range-low">${predictionRange.lower95.toFixed(2)}</strong> and{" "}
                <strong className="range-high">${predictionRange.upper95.toFixed(2)}</strong>
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section-reveal">
            <h2 className="section-title">Visualizations</h2>
            
            {/* Prediction Comparison Chart */}
            {botPrediction && (
              <div className="chart-wrapper">
                <PredictionComparison
                  userGuess={userGuess}
                  botPrediction={botPrediction}
                  actualOpen={actualOpen}
                />
              </div>
            )}

            {/* Feature Importance Chart */}
            {modelMetadata?.featureImportance && modelMetadata.featureImportance.length > 0 && (
              <div className="chart-wrapper">
                <FeatureImportance featureData={modelMetadata.featureImportance} />
              </div>
            )}
          </div>

          {/* Model Metrics and Information */}
          {modelMetadata && (
            <div className="information-reveal">
              <h2 className="section-title">Model Metrics & Data Sources</h2>
              <ModelMetrics
                metrics={modelMetadata.topMetrics || {}}
                featureImportance={modelMetadata.featureImportance || []}
              />
            </div>
          )}

          {/* Results (if market has opened) */}
          {actualOpen && (
            <div className="actual-results">
              <h2 className="section-title">Market Results</h2>
              <div className="results-grid">
                <div className="result-item">
                  <span className="result-label">Actual Opening Price:</span>
                  <span className="result-value actual">${actualOpen.toFixed(2)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Your Prediction Error:</span>
                  <span className="result-value">${Math.abs(userGuess - actualOpen).toFixed(2)}</span>
                </div>
                <div className="result-item">
                  <span className="result-label">Model Prediction Error:</span>
                  <span className="result-value">${Math.abs(botPrediction - actualOpen).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

function Header({ user, userPoints, logout }) {
  return (
    <div className="game-header">
      <h1 className="title">📈 BEAT THE BOT</h1>
      <div className="user-section">
        <span className="user-points">Points: {userPoints}</span>
        <span className="user-name">{user?.name || user?.email}</span>
        <button onClick={logout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
}

export default Game;