const { getGuessesForDate } = require("../../db/guessRepository");

function getGameDate(event) {
  const qs = (event && event.queryStringParameters) || {};
  return qs.gameDate || new Date().toISOString().slice(0, 10);
}

exports.handler = async (event) => {
  try {
    const gameDate = getGameDate(event);
    const guesses = await getGuessesForDate(gameDate);

    const finished = guesses.filter(
      (g) => typeof g.userError === "number"
    );

    finished.sort((a, b) => a.userError - b.userError);

    const leaderboard = finished.slice(0, 20).map((g, i) => ({
      rank: i + 1,
      username: g.username,
      userError: g.userError,
      botError: g.botError,
      didUserBeatBot: g.didUserBeatBot,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameDate, leaderboard }),
    };
  } catch (err) {
    console.error("getLeaderboard error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};