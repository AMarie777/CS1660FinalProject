import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../services/gameService';
import './Leaderboard.css';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameDate, setGameDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLeaderboard();
        setLeaderboard(data.leaderboard || []);
        setGameDate(data.gameDate || new Date().toISOString().slice(0, 10));
      } catch (err) {
        setError(err.message || 'Failed to load leaderboard');
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">🏆 Leaderboard</h1>
        <div className="user-section">
          <span className="user-name">{user?.name || user?.email}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </div>

      <div className="nav-links">
        <Link to="/" className="nav-link">Game</Link>
        <Link to="/leaderboard" className="nav-link active">Leaderboard</Link>
      </div>

      {gameDate && (
        <div className="leaderboard-date">
          Game Date: {gameDate}
        </div>
      )}

      {loading && (
        <div className="loading-message">Loading leaderboard...</div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {!loading && !error && (
        <>
          {leaderboard.length === 0 ? (
            <div className="no-results">
              <p>No results available yet. Check back after the market opens!</p>
            </div>
          ) : (
            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Username</th>
                    <th>Error</th>
                    <th>Bot Error</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr key={entry.rank} className={entry.didUserBeatBot ? 'winner-row' : ''}>
                      <td className="rank-cell">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                      </td>
                      <td className="username-cell">{entry.username}</td>
                      <td className="error-cell">${entry.userError?.toFixed(2) || 'N/A'}</td>
                      <td className="error-cell">${entry.botError?.toFixed(2) || 'N/A'}</td>
                      <td className="result-cell">
                        {entry.didUserBeatBot ? (
                          <span className="beat-bot">✅ Beat Bot</span>
                        ) : (
                          <span className="bot-won">🤖 Bot Closer</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Leaderboard;

