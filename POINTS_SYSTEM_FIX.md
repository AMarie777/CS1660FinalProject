# Points System Fix

## Issues Found and Fixed

### 1. **Points Only Calculated for Today**
   - **Problem:** `getUserPoints` only checked today's game and returned 0 or 1 point
   - **Fix:** Now calculates total points across ALL past games where the user beat the bot

### 2. **DynamoDB Schema Issue**
   - **Problem:** Guesses were stored with only `email` as key, overwriting previous guesses
   - **Fix:** Updated to store guesses with composite key: `email` + `gameDate`
   - This allows multiple guesses across different game dates

### 3. **Missing Accumulation Logic**
   - **Problem:** No way to sum points across historical games
   - **Fix:** Added `getUserAllGuesses()` function to fetch all user guesses, then calculate points for each completed game

## Changes Made

### `backend/db/guessRepository.js`
- ✅ Added `gameDate` parameter to `saveUserGuess()` 
- ✅ Updated `getUserGuess()` to accept `gameDate` parameter
- ✅ Added `getUserAllGuesses()` function to scan all guesses for a user
- ✅ Added `getUserGuessToday()` for backward compatibility

### `backend/lambdas/submitUserGuess/index.js`
- ✅ Updated to pass `gameDate` when saving guesses

### `backend/lambdas/getGameStatus/index.js`
- ✅ Updated to pass `gameDate` when fetching guesses

### `backend/lambdas/getUserPoints/index.js`
- ✅ **MAJOR FIX:** Now fetches ALL user guesses across all game dates
- ✅ Loops through each guess and calculates if user beat bot
- ✅ Returns total accumulated points across all completed games

### `infra/template.yml`
- ✅ Added DynamoDB `Scan` permission (already had it, but verified)
- ✅ Added permissions for `UserGuesses1` table

## How It Works Now

1. **When user submits guess:**
   - Guess is saved with `email` + `gameDate` as composite key
   - Multiple guesses across different dates are preserved

2. **When calculating points:**
   - Fetches ALL guesses for the user
   - For each guess, checks if that game date has actual results
   - Compares user error vs bot error for each completed game
   - Awards 1 point per game where user beat bot
   - Returns total accumulated points

3. **Points are awarded when:**
   - User's prediction error < Bot's prediction error
   - Actual opening price is available (market has opened)

## Important Notes

⚠️ **DynamoDB Table Structure Must Match:**
The table needs a composite key:
- **Partition Key:** `email`
- **Sort Key:** `gameDate` (or use GSI if different structure)

If your table currently only has `email` as the key, you'll need to:
1. Create a new table with the correct structure, OR
2. Migrate existing data to the new structure

## Testing

To verify points are working:
1. Submit guesses for multiple game dates
2. Wait for market to open (so actual prices are available)
3. Check `/user/points` endpoint - should return total across all games

