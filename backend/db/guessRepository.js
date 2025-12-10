const dynamo = require("./dynamoClient");
const TABLE_NAME = process.env.USER_GUESSES_TABLE || "UserGuesses1";

async function saveUserGuess(guess) {
  const item = {
    id: guess.id,          // partition key
    email: guess.email,
    guess: guess.guess,    // user prediction
    createdAt: Date.now()
  };

  await dynamo.put({
    TableName: TABLE_NAME,
    Item: item
  }).promise();

  return item;
}

async function getUserGuesses(id) {
  const res = await dynamo.query({
    TableName: TABLE_NAME,
    KeyConditionExpression: "id = :i",
    ExpressionAttributeValues: {
      ":i": id
    }
  }).promise();

  return res.Items || [];
}

module.exports = {
  saveUserGuess,
  getUserGuesses
};