export const predictContestDelta = (currentRating, predictedRank, participants) => {
  const rating = Number(currentRating);
  const rank = Number(predictedRank);
  const totalParticipants = participants === undefined ? 20000 : Number(participants);

  if (!Number.isFinite(rating) || !Number.isFinite(rank) || !Number.isFinite(totalParticipants)) {
    const error = new Error('current_rating, predicted_rank, and participants must be numbers');
    error.statusCode = 400;
    throw error;
  }

  if (rating < 0 || rank < 1 || totalParticipants < 1 || rank > totalParticipants) {
    const error = new Error('current_rating must be non-negative, and predicted_rank must be between 1 and participants');
    error.statusCode = 400;
    throw error;
  }

  const parts = Math.round(totalParticipants);
  const pct = rank / parts;
  const perf = 1500 - 400 * (pct - 0.5) * 4;
  
  const k = 32;
  const expected = 1 / (1 + Math.pow(10, (1500 - rating) / 400));
  const actual = 1 - pct;
  const delta = Math.round(k * (actual - expected) * 10) / 10;
  const new_rating = Math.round((rating + delta) * 10) / 10;
  
  return {
    delta,
    new_rating,
    performance: Math.round(perf * 10) / 10,
    percentile: Math.round((1 - pct) * 100 * 10) / 10
  };
};

// Flashcards data
const FLASHCARDS = [
  { q: 'Time complexity of inserting into a hash map?', a: 'O(1) amortized average; O(n) worst case due to collisions / rehashing.' },
  { q: 'When to use BFS vs DFS?', a: 'BFS for shortest path in unweighted graphs / level-order. DFS for path existence, topo sort, cycles, backtracking.' },
  { q: 'What is dynamic programming?', a: 'Solving a problem by combining solutions to overlapping subproblems, usually via memoization or tabulation.' },
  { q: 'Time complexity of QuickSort?', a: 'Average O(n log n); worst case O(n²) when pivots are poor (e.g. already sorted).' },
  { q: 'Difference between process and thread?', a: 'Process = isolated memory space; thread = lightweight, shares memory inside a process.' },
  { q: 'CAP theorem in one line?', a: 'In a distributed system you can only have 2 of: Consistency, Availability, Partition tolerance.' },
  { q: 'ACID stands for?', a: 'Atomicity, Consistency, Isolation, Durability — guarantees of a database transaction.' },
  { q: 'What is a Trie used for?', a: 'Prefix-based string search — autocomplete, dictionary lookup, IP routing.' },
  { q: 'Heap vs BST?', a: 'Heap = priority order (min/max at root), partial order. BST = full order, supports range queries.' },
  { q: 'Two-pointer technique — when?', a: 'Sorted arrays / linked lists, palindrome checks, container/water problems, removing duplicates.' },
];

export const getFlashcards = () => {
  return FLASHCARDS;
};
