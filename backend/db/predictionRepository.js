const dynamo = require("./dynamoClient");
const TABLE_NAME = process.env.PREDICTIONS_TABLE || "NVDA_Predictions";

async function getPredictionForDate(predictionDate) {
  const res = await dynamo
    .get({
      TableName: TABLE_NAME,
      Key: { Prediction_Date: predictionDate },
    })
    .promise();

  return res.Item || null;
}

module.exports = {
  getPredictionForDate,
};