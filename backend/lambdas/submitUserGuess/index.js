const { saveUserGuess } = require("../../db/guessRepository");

function buildCors() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };
}

function parseBody(event) {
  if (!event?.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

function getEmailFromAuth(event) {
  const h = event?.headers || {};
  const auth = h.Authorization || h.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

exports.handler = async (event) => {
  if (event?.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: buildCors(), body: "" };
  }

  try {
    const email = getEmailFromAuth(event);
    const body = parseBody(event);

    if (!email) {
      return {
        statusCode: 400,
        headers: buildCors(),
        body: JSON.stringify({ message: "Missing email in Authorization header" }),
      };
    }

    const guess = Number(body.guess);
    if (!Number.isFinite(guess)) {
      return {
        statusCode: 400,
        headers: buildCors(),
        body: JSON.stringify({ message: "guess must be a number" }),
      };
    }

    const saved = await saveUserGuess({ email, guess });

    return {
      statusCode: 200,
      headers: buildCors(),
      body: JSON.stringify(saved),
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