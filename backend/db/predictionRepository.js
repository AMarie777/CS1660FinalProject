// backend/db/predictionRepository.js

const dynamo = require("./dynamoClient");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = process.env.PREDICTIONS_TABLE || "NVDA_Predictions";

/**
 * Get one prediction row for a given date (YYYY-MM-DD).
 */
async function getPredictionForDate(date) {
  console.log("predictionRepository.getPredictionForDate called with:", date);

  const cmd = new GetCommand({
    TableName: TABLE_NAME,
    Key: { PredictionDate: date },
  });

  const res = await dynamo.send(cmd);
  console.log("DynamoDB get result:", res);

  return res.Item || null;
}

// VERY IMPORTANT: export as an object with this key
module.exports = {
  getPredictionForDate,
};