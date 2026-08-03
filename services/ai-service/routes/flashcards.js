import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

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

// Get flashcards
router.get('/flashcards', authMiddleware, (req, res) => {
  try {
    res.json({ cards: FLASHCARDS });
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ error: 'Failed to get flashcards' });
  }
});

export default router;
