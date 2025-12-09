const { getUserAllGuesses } = require("../../db/guessRepository");

function getUserId(event) {
  // Extract userId from Cognito authorizer or fallback to query/header
  if (event.requestContext && event.requestContext.authorizer) {
    return event.requestContext.authorizer.userId || event.requestContext.authorizer.claims?.sub;
  }
  // Fallback for development/testing
  const qs = (event && event.queryStringParameters) || {};
  return qs.userId || event.headers?.['x-user-id'] || 'anonymous';
}

exports.handler = async (event) => {
  try {
    const userId = getUserId(event);

    // Get all user guesses
    const guesses = await getUserAllGuesses(userId);

    // Count wins (where didUserBeatBot === true)
    const points = guesses.filter(g => g.didUserBeatBot === true).length;

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,OPTIONS"
      },
      body: JSON.stringify({ points }),
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

