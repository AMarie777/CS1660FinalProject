// db/dynamoClient.js - CommonJS version for AWS Lambda (Node 20)

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const REGION = process.env.AWS_REGION || "us-east-2";

const client = new DynamoDBClient({
  region: REGION,
});

const dynamo = DynamoDBDocumentClient.from(client);

module.exports = dynamo;
