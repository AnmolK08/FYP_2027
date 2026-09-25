const MAX_RECENT_SUBMISSIONS = 20;

export const ratingToRank = (rating) => {
  if (rating >= 3000) return 'legendary grandmaster';
  if (rating >= 2600) return 'international grandmaster';
  if (rating >= 2400) return 'grandmaster';
  if (rating >= 2300) return 'international master';
  if (rating >= 2100) return 'master';
  if (rating >= 1900) return 'candidate master';
  if (rating >= 1600) return 'expert';
  if (rating >= 1400) return 'specialist';
  if (rating >= 1200) return 'pupil';
  if (rating > 0)     return 'newbie';
  return 'unrated';
};

export const mapUserInfo = (cfUser) => ({
  handle:       cfUser.handle        || null,
  avatar:       cfUser.titlePhoto    || cfUser.avatar || null,
  firstName:    cfUser.firstName     || null,
  lastName:     cfUser.lastName      || null,
  country:      cfUser.country       || null,
  city:         cfUser.city          || null,
  organization: cfUser.organization  || null,

  rating:       cfUser.rating        ?? 0,
  maxRating:    cfUser.maxRating      ?? 0,
  rank:         cfUser.rank           || ratingToRank(cfUser.rating   ?? 0),
  maxRank:      cfUser.maxRank        || ratingToRank(cfUser.maxRating ?? 0),

  contribution:   cfUser.contribution   ?? 0,
  friendOfCount:  cfUser.friendOfCount  ?? 0,
});

export const mapSubmissions = (submissions) => {
  if (!Array.isArray(submissions) || submissions.length === 0) {
    return {
      totalSolved: 0,
      totalSubmissions: 0,
      contestsAttended: 0,
      ratingWiseSolved: [],
      tagStats: [],
      verdictStats: [],
      languageStats: [],
      recentSubmissions: [],
    };
  }

  const solvedProblems = new Set(); // dedup key: "contestId_index"
  const ratingMap       = new Map(); // problem rating → solved count
  const tagMap          = new Map(); // tag → solved count (unique problems only)
  const verdictMap      = new Map(); // verdict → total submission count
  const languageMap     = new Map(); // language → total submission count

  for (const sub of submissions) {
    const { verdict, problem, programmingLanguage: lang } = sub;

    verdictMap.set(verdict, (verdictMap.get(verdict) || 0) + 1);

    if (lang) {
      languageMap.set(lang, (languageMap.get(lang) || 0) + 1);
    }

    if (verdict !== 'OK') continue;

    const problemKey = `${problem.contestId ?? problem.problemsetName ?? 'ps'}_${problem.index}`;
    if (solvedProblems.has(problemKey)) continue;

    solvedProblems.add(problemKey);

    if (typeof problem.rating === 'number' && problem.rating > 0) {
      ratingMap.set(problem.rating, (ratingMap.get(problem.rating) || 0) + 1);
    }

    for (const tag of problem.tags || []) {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    }
  }

  const ratingWiseSolved = Array.from(ratingMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([rating, count]) => ({ rating, count }));

  const tagStats = Array.from(tagMap.entries())
    .map(([tag, solved]) => ({ tag, solved }))
    .sort((a, b) => b.solved - a.solved);

  const verdictStats = Array.from(verdictMap.entries())
    .map(([verdict, count]) => ({ verdict, count }))
    .sort((a, b) => b.count - a.count);

  const languageStats = Array.from(languageMap.entries())
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);

  const recentSubmissions = submissions
    .slice(0, MAX_RECENT_SUBMISSIONS)
    .map((sub) => ({
      id:          sub.id,
      contestId:   sub.contestId || null,
      problem:     `${sub.problem.contestId ?? ''}${sub.problem.index} – ${sub.problem.name}`,
      verdict:     sub.verdict,
      language:    sub.programmingLanguage,
      timeMs:      sub.timeConsumedMillis,
      memoryBytes: sub.memoryConsumedBytes,
      createdAt:   sub.creationTimeSeconds
        ? new Date(sub.creationTimeSeconds * 1000).toISOString()
        : null,
    }));

  return {
    totalSolved:      solvedProblems.size,
    totalSubmissions: submissions.length,
    contestsAttended: 0, // overridden by mapRatingHistory
    ratingWiseSolved,
    tagStats,
    verdictStats,
    languageStats,
    recentSubmissions,
  };
};

export const mapRatingHistory = (ratingChanges) => {
  if (!Array.isArray(ratingChanges) || ratingChanges.length === 0) {
    return { ratingHistory: [], contestsAttended: 0 };
  }

  const ratingHistory = ratingChanges.map((rc) => ({
    contestId:   rc.contestId,
    contestName: rc.contestName,
    rank:        rc.rank,
    oldRating:   rc.oldRating,
    newRating:   rc.newRating,
    timestamp:   rc.ratingUpdateTimeSeconds
      ? new Date(rc.ratingUpdateTimeSeconds * 1000).toISOString()
      : null,
  }));

  return {
    ratingHistory,
    contestsAttended: ratingHistory.length,
  };
};

export const buildCodeforcesPayload = (cfUser, submissions, ratingChanges) => {
  const profile          = mapUserInfo(cfUser);
  const subStats         = mapSubmissions(submissions);
  const { ratingHistory, contestsAttended } = mapRatingHistory(ratingChanges);

  return {
    handle:            profile.handle,
    avatar:            profile.avatar,
    firstName:         profile.firstName,
    lastName:          profile.lastName,
    country:           profile.country,
    city:              profile.city,
    organization:      profile.organization,

    rating:            profile.rating,
    maxRating:         profile.maxRating,
    rank:              profile.rank,
    maxRank:           profile.maxRank,

    contribution:      profile.contribution,
    friendOfCount:     profile.friendOfCount,

    totalSolved:       subStats.totalSolved,
    totalSubmissions:  subStats.totalSubmissions,
    // ratingHistory length is more accurate than counting from submissions
    contestsAttended:  contestsAttended || subStats.contestsAttended,

    ratingHistory,
    ratingWiseSolved:  subStats.ratingWiseSolved,
    tagStats:          subStats.tagStats,
    verdictStats:      subStats.verdictStats,
    languageStats:     subStats.languageStats,
    recentSubmissions: subStats.recentSubmissions,
  };
};
