// backend/lambdas/submitUserGuess/index.js

const guessRepo = require("./db/guessRepository");

function buildCors() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
}

exports.handler = async (event) => {
  // Handle preflight
  if (event && event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: buildCors(),
      body: "",
    };
  }

  try {
    console.log("submitUserGuess event.headers:", event.headers);

    // Get email from Authorization header (plain email)
    const headers = event.headers || {};
    const rawAuth =
      headers.Authorization ||
      headers.authorization ||
      headers.AUTHORIZATION ||
      null;

    if (!rawAuth || typeof rawAuth !== "string" || !rawAuth.trim()) {
      return {
        statusCode: 400,
        headers: buildCors(),
        body: JSON.stringify({
          message: "Missing email in Authorization header",
        }),
      };
    }

    const email = rawAuth.trim(); // <- JUST THE EMAIL

    // Parse body
    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      console.error("Failed to parse body JSON:", e);
      return {
        statusCode: 400,
        headers: buildCors(),
        body: JSON.stringify({ message: "Invalid JSON body" }),
      };
    }

    const guess = body.guess;
    if (typeof guess !== "number" || !isFinite(guess) || guess <= 0) {
      return {
        statusCode: 400,
        headers: buildCors(),
        body: JSON.stringify({ message: "Invalid guess" }),
      };
    }

    console.log("Saving guess for email:", email, "guess:", guess);

    // Get today's date
    const today = new Date().toISOString().slice(0, 10);

    // Save into DynamoDB (UserGuesses1) with game date
    await guessRepo.saveUserGuess(email, guess, today);

    return {
      statusCode: 200,
      headers: buildCors(),
      body: JSON.stringify({
        email,
        guess,
        message: "Guess saved",
      }),
    };
  } catch (err) {
    console.error("submitUserGuess error:", err);
    return {
      statusCode: 500,
      headers: buildCors(),
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};