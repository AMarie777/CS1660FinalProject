// backend/db/guessRepository.js

const dynamo = require("./dynamoClient");
const { PutCommand, GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.USER_GUESSES_TABLE || "UserGuesses1";

// Save guess with game date (composite key: email + gameDate)
async function saveUserGuess(email, guess, gameDate) {
  const cmd = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      email,
      gameDate: gameDate || new Date().toISOString().slice(0, 10),
      guess,
      createdAt: new Date().toISOString(),
    },
  });

  await dynamo.send(cmd);
  return { email, gameDate, guess };
}

// Get user's guess for a specific game date
async function getUserGuess(email, gameDate) {
  const cmd = new GetCommand({
    TableName: TABLE_NAME,
    Key: { 
      email,
      gameDate: gameDate || new Date().toISOString().slice(0, 10),
    },
  });

  const res = await dynamo.send(cmd);
  return res.Item || null;
}

// Get all guesses for a user (for calculating total points)
async function getUserAllGuesses(email) {
  try {
    const cmd = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
    });

    const res = await dynamo.send(cmd);
    return res.Items || [];
  } catch (err) {
    console.error("Error getting all user guesses:", err);
    return [];
  }
}

// Backward compatibility - get guess for today
async function getUserGuessToday(email) {
  const today = new Date().toISOString().slice(0, 10);
  return getUserGuess(email, today);
}

module.exports = {
  saveUserGuess,
  getUserGuess,
  getUserGuessToday,
  getUserAllGuesses,
};