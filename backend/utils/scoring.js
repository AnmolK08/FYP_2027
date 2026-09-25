// Lucy V1 scoring formulae. Pure functions — no DB calls, no network calls.
//
// Formulae:
//   leetcodeScore  = easy×1 + medium×3 + hard×6 + floor(contestRating × 0.5)
//   codeforcesScore = floor(rating / 2) + Σ( ratingWiseSolved[i].count × (i + 1) )
//   lucyScore      = leetcodeScore + codeforcesScore
//
// CF difficulty buckets (ratingWiseSolved) are sorted ascending by problem
// rating. The 0-based index i becomes the multiplier, so harder buckets
// are always worth more. Problems without a rating are excluded from scoring.
//
// To add a new provider: add a calcXScore() here, wire it into calcLucyScore,
// and update the leaderboard service.

export const calcLeetcodeScore = ({ easy = 0, medium = 0, hard = 0, contestRating = 0 }) => {
  const solvedPoints = easy * 1 + medium * 3 + hard * 6;
  const ratingBonus  = Math.floor((contestRating || 0) * 0.5);
  return Math.max(0, solvedPoints + ratingBonus);
};

// Maps a CF user's current rating to a uniform difficulty weight (1–5).
// Used when per-problem ratings aren't available in the tagStats blob.
export const cfDifficultyWeight = (cfRating = 0) => {
  if (cfRating >= 2400) return 5;
  if (cfRating >= 2000) return 4;
  if (cfRating >= 1600) return 3;
  if (cfRating >= 1200) return 2;
  return 1;
};

export const calcCodeforcesScore = ({ rating = 0, ratingWiseSolved = [] }) => {
  const ratingBonus  = Math.floor((rating || 0) / 2);
  const solvedPoints = (ratingWiseSolved || []).reduce(
    (sum, bucket, i) => sum + (bucket.count || 0) * (i + 1),
    0
  );
  return Math.max(0, ratingBonus + solvedPoints);
};

export const calcLucyScore = (leetcodeScore = 0, codeforcesScore = 0) =>
  Math.max(0, (leetcodeScore || 0) + (codeforcesScore || 0));

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
