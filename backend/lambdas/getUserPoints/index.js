const dynamo = require("./db/dynamoClient");

const TABLE_NAME = process.env.USER_GUESSES_TABLE || "UserGuesses1";

function getUserId(event) {
  // Cognito / authorizer (future)
  if (event.requestContext && event.requestContext.authorizer) {
    return (
      event.requestContext.authorizer.userId ||
      event.requestContext.authorizer.claims?.sub
    );
  }

  // Fallback: query param or header, then "anonymous"
  const qs = (event && event.queryStringParameters) || {};
  return qs.userId || event.headers?.["x-user-id"] || "anonymous";
}

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);

    // Scan all guesses for this user
    const res = await dynamo
      .scan({
        TableName: TABLE_NAME,
        FilterExpression: "userId = :u",
        ExpressionAttributeValues: {
          ":u": userId,
        },
      })
      .promise();

    const guesses = res.Items || [];

    // Count wins where didUserBeatBot === true
    const finished = guesses.filter(
      (g) => typeof g.didUserBeatBot === "boolean"
    );
    const points = finished.filter((g) => g.didUserBeatBot === true).length;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
      },
      body: JSON.stringify({
        userId,
        points,
        gamesPlayed: finished.length,
      }),
    };
  } catch (err) {
    console.error("getUserPoints error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};