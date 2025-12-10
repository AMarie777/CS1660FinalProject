const { getUserAllGuesses } = require("./db/guessRepository");
const { getPredictionForDate } = require("./db/predictionRepository");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function buildCors() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
  };
}

function getEmailFromAuth(event) {
  const h = event?.headers || {};
  const auth = h.Authorization || h.authorization;
  if (!auth) return null;

  // If it's "Bearer token", strip the prefix. Otherwise, just use the raw value.
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : auth.trim();
  return token || null;
}

exports.handler = async (event) => {
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: buildCors(), body: "" };
  }

  try {
    const email = getEmailFromAuth(event);
    if (!email) {
      return {
        statusCode: 400,
        headers: buildCors(),
        body: JSON.stringify({ message: "Missing email" }),
      };
    }

    // Get all user guesses across all game dates
    const allGuesses = await getUserAllGuesses(email);
    
    if (!allGuesses || allGuesses.length === 0) {
      return {
        statusCode: 200,
        headers: buildCors(),
        body: JSON.stringify({ points: 0 }),
      };
    }

    // Calculate points for each game where results are available
    let totalPoints = 0;

    for (const guessRow of allGuesses) {
      const gameDate = guessRow.gameDate;
      
      try {
        // Get prediction for this game date
        const pred = await getPredictionForDate(gameDate);
        
        if (!pred) continue; // No prediction for this date
        
        const actual = pred.Actual_Open_NVDA;
        if (!Number.isFinite(actual)) continue; // Market hasn't opened yet for this date
        
        // Calculate if user beat bot for this game
        const userError = Math.abs(guessRow.guess - actual);
        const botError = Math.abs(pred.Predicted_Open_NVDA - actual);
        
        if (userError < botError) {
          totalPoints += 1;
        }
      } catch (err) {
        console.error(`Error calculating points for game date ${gameDate}:`, err);
        // Continue to next guess
      }
    }

    return {
      statusCode: 200,
      headers: buildCors(),
      body: JSON.stringify({ points: totalPoints }),
    };
  } catch (err) {
    console.error("getUserPoints error:", err);
    return {
      statusCode: 500,
      headers: buildCors(),
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};