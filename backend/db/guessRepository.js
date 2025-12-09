const dynamo = require("./dynamoClient");
const TABLE_NAME = process.env.USER_GUESSES_TABLE || "UserGuesses";

/**
 * guess = {
 *   gameDate, userId, username,
 *   userGuess, botPrediction,
 *   actualOpen?, userError?, botError?, didUserBeatBot?
 * }
 */
async function saveUserGuess(guess) {
  const item = {
    gameDate: guess.gameDate,
    userId: guess.userId,
    username: guess.username,
    userGuess: guess.userGuess,
    botPrediction: guess.botPrediction,
    actualOpen:
      typeof guess.actualOpen === "number" ? guess.actualOpen : null,
    userError:
      typeof guess.userError === "number" ? guess.userError : null,
    botError: typeof guess.botError === "number" ? guess.botError : null,
    didUserBeatBot:
      typeof guess.didUserBeatBot === "boolean"
        ? guess.didUserBeatBot
        : null,
    createdAt: guess.createdAt || Date.now(),
  };

  await dynamo
    .put({
      TableName: TABLE_NAME,
      Item: item,
    })
    .promise();

  return item;
}

async function getGuessesForDate(gameDate) {
  const res = await dynamo
    .query({
      TableName: TABLE_NAME,
      KeyConditionExpression: "gameDate = :d",
      ExpressionAttributeValues: {
        ":d": gameDate,
      },
    })
    .promise();

  return res.Items || [];
}

module.exports = {
  saveUserGuess,
  getGuessesForDate,
};