const dynamo = require("./db/dynamoClient");

const PRED_TABLE = process.env.PREDICTIONS_TABLE || "NVDA_Predictions1";
const GUESSES_TABLE = process.env.USER_GUESSES_TABLE || "UserGuesses1";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

exports.handler = async (event) => {
  try {
    const qs = (event && event.queryStringParameters) || {};
    const gameDate = qs.gameDate || todayISO();

    // 1) Check if we have a prediction for that date
    const predRes = await dynamo
      .get({
        TableName: PRED_TABLE,
        Key: { PredictionDate: gameDate },
      })
      .promise();

    const hasPrediction = !!predRes.Item;

    // 2) Count finished guesses (where didUserBeatBot exists)
    const guessesRes = await dynamo
      .scan({
        TableName: GUESSES_TABLE,
        FilterExpression:
          "gameDate = :d AND attribute_exists(didUserBeatBot)",
        ExpressionAttributeValues: {
          ":d": gameDate,
        },
      })
      .promise();

    const finishedCount = (guessesRes.Items || []).length;

    let status = "NO_GAME";
    if (hasPrediction && finishedCount === 0) status = "OPEN";
    if (hasPrediction && finishedCount > 0) status = "CLOSED";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
      },
      body: JSON.stringify({
        gameDate,
        hasPrediction,
        finishedCount,
        status,
      }),
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