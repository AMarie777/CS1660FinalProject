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

exports.handler = async (event) => {
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: buildCors(), body: "" };
  }

  try {
    const date = todayISO();
    const pred = await getPredictionForDate(date);

    if (!pred) {
      return {
        statusCode: 404,
        headers: buildCors(),
        body: JSON.stringify({
          message: "No prediction found for today",
          gameDate: date,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: buildCors(),
      body: JSON.stringify({
        gameDate: date,
        modelPrediction: {
          predictedOpen: pred.Predicted_Open_NVDA,
          lower95: pred.Predicted_Low_NVDA,
          upper95: pred.Predicted_High_NVDA,
        },
      }),
    };
  } catch (err) {
    console.error("getTodayGame error:", err);
    return {
      statusCode: 500,
      headers: buildCors(),
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};