/**
 * scoring.js
 *
 * Lucy V1 scoring formulae — the single source of truth for all score
 * calculations.  No DB calls, no network calls — pure functions only.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  FORMULA REFERENCE (V1)                                      │
 * │                                                              │
 * │  leetcodeScore  = easy×1 + medium×3 + hard×6                 │
 * │                 + floor(contestRating × 0.5)                 │
 * │                                                              │
 * │  codeforcesScore = Σ tag-solved × difficultyWeight(tag)      │
 * │                  + floor(cfRating × 0.5)                     │
 * │                                                              │
 * │  lucyScore      = leetcodeScore + codeforcesScore            │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Codeforces difficulty weights
 * ─────────────────────────────
 * Codeforces problems carry a "rating" in the API but problems inside the
 * tagStats blob only carry a tag name and solved count.  We map tag names to
 * a weight using the standard CF rating → difficulty tier mapping so every
 * user is scored consistently.
 *
 * Weight table (mirrors the CF rating colour scheme):
 *   ≤ 1199  → 1   (newbie / grey)
 *   1200-1599 → 2 (pupil / green)
 *   1600-1999 → 3 (specialist-expert / cyan-blue)
 *   2000-2399 → 4 (candidate master-master / violet)
 *   ≥ 2400  → 5   (grandmaster+ / red)
 *
 * Because per-problem ratings are not stored in tagStats, we use the user's
 * own CF rating bracket to weight ALL their solved problems uniformly.
 * This is intentional — it rewards users who are solving hard problems
 * relative to their current level, without requiring per-problem difficulty
 * storage.
 *
 * Adding a new provider in future: define a new export `<provider>Score()`
 * function here, add it to `lucyScore()`, and update the leaderboard service.
 */

// ─── LeetCode ─────────────────────────────────────────────────────────────────

/**
 * Calculate the LeetCode component of Lucy Score.
 *
 * @param {object} p
 * @param {number} p.easy             – problems solved (Easy)
 * @param {number} p.medium           – problems solved (Medium)
 * @param {number} p.hard             – problems solved (Hard)
 * @param {number} p.contestRating    – LeetCode contest rating (0 if unrated)
 * @returns {number} leetcodeScore (non-negative integer)
 */
export const calcLeetcodeScore = ({ easy = 0, medium = 0, hard = 0, contestRating = 0 }) => {
  const solvedPoints = easy * 1 + medium * 3 + hard * 6;
  const ratingBonus  = Math.floor((contestRating || 0) * 0.5);
  return Math.max(0, solvedPoints + ratingBonus);
};

// ─── Codeforces difficulty weight ─────────────────────────────────────────────

/**
 * CF rating → per-problem difficulty weight.
 * Used to weight ALL solved problems for a given user uniformly.
 *
 * @param {number} cfRating  – user's current CF rating
 * @returns {number} weight 1–5
 */
export const cfDifficultyWeight = (cfRating = 0) => {
  if (cfRating >= 2400) return 5;
  if (cfRating >= 2000) return 4;
  if (cfRating >= 1600) return 3;
  if (cfRating >= 1200) return 2;
  return 1;
};

// ─── Codeforces ───────────────────────────────────────────────────────────────

/**
 * Calculate the Codeforces score using the V2 rating-wise formula.
 *
 * Formula:
 *   codeforcesScore = floor(currentRating / 2)
 *                   + Σ( ratingWiseSolved[i].count × (i + 1) )
 *
 * Where ratingWiseSolved is sorted by problem rating ascending and i is
 * the 0-based index.  Problems without a rating are excluded.
 *
 * This replaces the old uniform-weight formula so every difficulty bucket
 * contributes a distinct multiplier (1 for easiest, 2 for next, etc.).
 *
 * @param {object}   p
 * @param {number}   p.rating           – current CF rating (0 if unrated)
 * @param {Array}    p.ratingWiseSolved  – [{rating, count}] sorted ascending
 * @returns {number} codeforcesScore (non-negative integer)
 */
export const calcCodeforcesScore = ({ rating = 0, ratingWiseSolved = [] }) => {
  const ratingBonus  = Math.floor((rating || 0) / 2);
  const solvedPoints = (ratingWiseSolved || []).reduce(
    (sum, bucket, i) => sum + (bucket.count || 0) * (i + 1),
    0
  );
  return Math.max(0, ratingBonus + solvedPoints);
};

// ─── Lucy (combined) ──────────────────────────────────────────────────────────

/**
 * Calculate the combined Lucy Score from both platform scores.
 *
 * @param {number} leetcodeScore
 * @param {number} codeforcesScore
 * @returns {number} lucyScore
 */
export const calcLucyScore = (leetcodeScore = 0, codeforcesScore = 0) =>
  Math.max(0, (leetcodeScore || 0) + (codeforcesScore || 0));

/**
 * Convenience helper: compute all three scores in one call.
 * Accepts partial data — any missing field defaults to 0.
 *
 * @param {object} p
 * @param {number} [p.lcEasy]
 * @param {number} [p.lcMedium]
 * @param {number} [p.lcHard]
 * @param {number} [p.lcContestRating]
 * @param {number} [p.cfTotalSolved]
 * @param {number} [p.cfRating]
 * @returns {{ leetcodeScore: number, codeforcesScore: number, lucyScore: number }}
 */
export const computeAllScores = ({
  lcEasy           = 0,
  lcMedium         = 0,
  lcHard           = 0,
  lcContestRating  = 0,
  cfRating         = 0,
  cfRatingWiseSolved = [],
} = {}) => {
  const leetcodeScore   = calcLeetcodeScore({ easy: lcEasy, medium: lcMedium, hard: lcHard, contestRating: lcContestRating });
  const codeforcesScore = calcCodeforcesScore({ rating: cfRating, ratingWiseSolved: cfRatingWiseSolved });
  const lucyScore       = calcLucyScore(leetcodeScore, codeforcesScore);
  return { leetcodeScore, codeforcesScore, lucyScore };
};
