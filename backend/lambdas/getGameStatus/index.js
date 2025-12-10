const { getUserGuess } = require("../../db/guessRepository");
const { getPredictionForDate } = require("../../db/predictionRepository");

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
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

exports.handler = async (event) => {
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: buildCors(), body: "" };
  }

  try {
    const email = getEmailFromAuth(event);

    const date = todayISO();
    const [guessRow, pred] = await Promise.all([
      email ? getUserGuess(email) : null,
      getPredictionForDate(date),
    ]);

    if (!pred) {
      return {
        statusCode: 200,
        headers: buildCors(),
        body: JSON.stringify({
          status: "NO_GAME",
          gameDate: date,
          userGuess: guessRow?.guess || null,
        }),
      };
    }

    const actual = pred.Actual_Open_NVDA;
    const status = Number.isFinite(actual) ? "CLOSED" : "OPEN";

    return {
      statusCode: 200,
      headers: buildCors(),
      body: JSON.stringify({
        status,
        gameDate: date,
        userGuess: guessRow?.guess || null,
        actualOpen: Number.isFinite(actual) ? actual : null,
      }),
    };
  } catch (err) {
    console.error("getGameStatus error:", err);
    return {
      statusCode: 500,
      headers: buildCors(),
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};