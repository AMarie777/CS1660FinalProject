const { getPredictionForDate } = require("../../db/predictionRepository");

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

exports.handler = async () => {
  try {
    const gameDate = todayISO();
    const pred = await getPredictionForDate(gameDate);

    if (!pred) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "No prediction found for today",
          gameDate,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameDate: pred.PredictionDate,
        symbol: "NVDA",
        modelPrediction: {
          predictedOpen: pred.Predicted_Open_NVDA,
          lower95: pred.Predicted_Low_NVDA,
          upper95: pred.Predicted_High_NVDA,
        },
      }),
    };
  } catch (err) {
    console.error("getTodayGame error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};