const dynamo = require("./dynamoClient");

const TABLE_NAME = process.env.USER_GUESSES_TABLE || "UserGuesses1";

/**
 * Saves a user's guess.
 * Overwrites the row because PK = email.
 */
async function saveUserGuess({ email, guess }) {
  const item = {
    email,
    guess,
  };

  await dynamo
    .put({
      TableName: TABLE_NAME,
      Item: item,
    })
    .promise();

  return item;
}

/**
 * Retrieves the user's guess.
 */
async function getUserGuess(email) {
  const res = await dynamo
    .get({
      TableName: TABLE_NAME,
      Key: { email },
    })
    .promise();

  return res.Item || null;
}

module.exports = {
  saveUserGuess,
  getUserGuess,
};