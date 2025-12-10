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

    const guessValue = Number(prediction);
    if (!Number.isFinite(guessValue) || guessValue <= 0) {
      setError("Please enter a valid positive number.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await submitUserGuess(guessValue);

      setSubmitResult(result);
      setPrediction("");

      // Refresh game status
      const newStatus = await getGameStatus();
      setGameStatus(newStatus);

      const updatedPoints = await getUserPoints();
      setUserPoints(updatedPoints.points || 0);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit prediction.");
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

      {/* USER HAS NOT GUESSED YET */}
      {!userGuess && status !== "CLOSED" && (
        <div className="prediction-section">
          <h2 className="question">What will NVDA open at?</h2>

          <form onSubmit={handleSubmit} className="prediction-form">
            <input
              type="number"
              step="0.01"
              className="prediction-input"
              placeholder="Enter your guess"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
              disabled={submitting}
            />
            <button type="submit" className="submit-button" disabled={submitting}>
              {submitting ? "Submitting..." : "Lock Prediction"}
            </button>
          </form>
        </div>
      )}

      {/* USER HAS SUBMITTED */}
      {userGuess && (
        <>
          <div className="submit-result">
            <h3>Your Prediction is Locked:</h3>
            <p>${Number(userGuess).toFixed(2)}</p>
          </div>

          {/* Show model range */}
          <div className="bot-prediction">
            <h3>🤖 Model Prediction Range</h3>
            <p>
              Between <strong>${predictionRange.lower95.toFixed(2)}</strong> and{" "}
              <strong>${predictionRange.upper95.toFixed(2)}</strong>
            </p>
            <p>Model predicted open: ${botPrediction.toFixed(2)}</p>
          </div>

          {/* RESULTS (if market has opened) */}
          {actualOpen && (
            <div className="actual-results">
              <h3>📊 Results</h3>
              <div>Actual Open: ${actualOpen.toFixed(2)}</div>
              <div>Your Error: ${Math.abs(userGuess - actualOpen).toFixed(2)}</div>
              <div>
                Bot Error: ${Math.abs(botPrediction - actualOpen).toFixed(2)}
              </div>
            </div>
          )}

          {/* Charts after submission */}
          {botPrediction && (
            <PredictionComparison
              userGuess={userGuess}
              botPrediction={botPrediction}
              actualOpen={actualOpen}
            />
          )}

          {modelMetadata?.featureImportance && (
            <FeatureImportance featureData={modelMetadata.featureImportance} />
          )}
        </>
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