const {
  getPredictionForDate,
} = require("../../db/predictionRepository");
const { saveUserGuess } = require("../../db/guessRepository");

function parseBody(event) {
  try {
    if (!event.body) return {};
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

exports.handler = async (event) => {
  try {
    const body = parseBody(event);

    const gameDate = body.gameDate || todayISO();
    const username = body.username || "anonymous";

    const userId =
      body.userId || "test-user"; //can later hook to Cognito

    const userGuess = Number(body.userGuess);
    if (Number.isNaN(userGuess)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "userGuess must be a number" }),
      };
    }

    const pred = await getPredictionForDate(gameDate);
    if (!pred) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "No bot prediction for this date",
          gameDate,
        }),
      };
    }

    const botPrediction = Number(pred.Predicted_Open_NVDA);

    let actualOpen = null;
    let userError = null;
    let botError = null;
    let didUserBeatBot = null;

    if (body.actualOpen !== undefined && body.actualOpen !== null) {
      actualOpen = Number(body.actualOpen);
      if (!Number.isNaN(actualOpen)) {
        userError = Math.abs(actualOpen - userGuess);
        botError = Math.abs(actualOpen - botPrediction);
        didUserBeatBot = userError < botError;
      }
    }

    await saveUserGuess({
      gameDate,
      userId,
      username,
      userGuess,
      botPrediction,
      actualOpen,
      userError,
      botError,
      didUserBeatBot,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameDate,
        username,
        botPrediction,
        actualOpen,
        userError,
        botError,
        didUserBeatBot,
      }),
    };
  } catch (err) {
    console.error("submitUserGuess error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};