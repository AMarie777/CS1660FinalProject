const { getPredictionForDate } = require("../../db/predictionRepository");
const { getUserGuess, getUserAllGuesses } = require("../../db/guessRepository");

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getUserId(event) {
  // Extract userId from Cognito authorizer or fallback to query/header
  if (event.requestContext && event.requestContext.authorizer) {
    return event.requestContext.authorizer.userId || event.requestContext.authorizer.claims?.sub;
  }
  // Fallback for development/testing
  const qs = (event && event.queryStringParameters) || {};
  return qs.userId || event.headers?.['x-user-id'] || 'anonymous';
}

exports.handler = async (event) => {
  try {
    const gameDate = todayISO();
    const userId = getUserId(event);

    // Get prediction for today
    const pred = await getPredictionForDate(gameDate);
    
    // Get user's guess for today if it exists
    const userGuessData = await getUserGuess(gameDate, userId);

    // Calculate user points from all guesses
    const allGuesses = await getUserAllGuesses(userId);
    const userPoints = allGuesses.filter(g => g.didUserBeatBot === true).length;

    const response = {
      gameDate,
      userGuess: userGuessData?.userGuess || null,
      modelPrediction: pred ? {
        predictedOpen: pred.Predicted_Open_NVDA,
        lower95: pred.Predicted_Low_NVDA,
        upper95: pred.Predicted_High_NVDA,
      } : null,
      actualOpen: userGuessData?.actualOpen || null,
      userPoints,
    };

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
      body: JSON.stringify(response),
    };
  } catch (err) {
    console.error("getGameStatus error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};

