// backend/db/guessRepository.js

const dynamo = require("./dynamoClient");
const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.USER_GUESSES_TABLE || "UserGuesses1";

async function saveUserGuess(email, guess) {
  const cmd = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      email,
      guess,
    },
  });

  await dynamo.send(cmd);
  return { email, guess };
}

async function getUserGuess(email) {
  const cmd = new GetCommand({
    TableName: TABLE_NAME,
    Key: { email },
  });

  const res = await dynamo.send(cmd);
  return res.Item || null;
}

module.exports = {
  saveUserGuess,
  getUserGuess,
};