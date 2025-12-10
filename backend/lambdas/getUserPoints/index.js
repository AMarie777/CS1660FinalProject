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
    if (!email) {
      return {
        statusCode: 400,
        headers: buildCors(),
        body: JSON.stringify({ message: "Missing email" }),
      };
    }

    const date = todayISO();

    const [guessRow, pred] = await Promise.all([
      getUserGuess(email),
      getPredictionForDate(date),
    ]);

    if (!guessRow || !pred) {
      return {
        statusCode: 200,
        headers: buildCors(),
        body: JSON.stringify({ points: 0 }),
      };
    }

    const actual = pred.Actual_Open_NVDA;
    if (!Number.isFinite(actual)) {
      return {
        statusCode: 200,
        headers: buildCors(),
        body: JSON.stringify({ points: 0 }),
      };
    }

    const userError = Math.abs(guessRow.guess - actual);
    const botError = Math.abs(pred.Predicted_Open_NVDA - actual);

    const points = userError < botError ? 1 : 0;

    return {
      statusCode: 200,
      headers: buildCors(),
      body: JSON.stringify({ points }),
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