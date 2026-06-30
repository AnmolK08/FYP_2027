import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// DSA Bank data
const DSA_BANK = [
  { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', tags: ['Array', 'Hash Table'], url: 'https://leetcode.com/problems/two-sum/' },
  { id: 'valid-parens', title: 'Valid Parentheses', difficulty: 'Easy', tags: ['Stack', 'String'], url: 'https://leetcode.com/problems/valid-parentheses/' },
  { id: 'merge-lists', title: 'Merge Two Sorted Lists', difficulty: 'Easy', tags: ['Linked List', 'Recursion'], url: 'https://leetcode.com/problems/merge-two-sorted-lists/' },
  { id: 'max-subarray', title: 'Maximum Subarray', difficulty: 'Medium', tags: ['Array', 'Dynamic Programming'], url: 'https://leetcode.com/problems/maximum-subarray/' },
  { id: 'climb-stairs', title: 'Climbing Stairs', difficulty: 'Easy', tags: ['Dynamic Programming', 'Math'], url: 'https://leetcode.com/problems/climbing-stairs/' },
  { id: 'lru-cache', title: 'LRU Cache', difficulty: 'Medium', tags: ['Hash Table', 'Linked List', 'Design'], url: 'https://leetcode.com/problems/lru-cache/' },
  { id: 'word-break', title: 'Word Break', difficulty: 'Medium', tags: ['Dynamic Programming', 'Trie'], url: 'https://leetcode.com/problems/word-break/' },
  { id: 'course-schedule', title: 'Course Schedule', difficulty: 'Medium', tags: ['Graph', 'Topological Sort', 'BFS', 'DFS'], url: 'https://leetcode.com/problems/course-schedule/' },
  { id: 'median-streams', title: 'Median of Two Sorted Arrays', difficulty: 'Hard', tags: ['Array', 'Binary Search'], url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/' },
  { id: 'trap-water', title: 'Trapping Rain Water', difficulty: 'Hard', tags: ['Array', 'Two Pointers', 'Stack'], url: 'https://leetcodecom/problems/trapping-rain-water/' },
  { id: 'word-ladder', title: 'Word Ladder', difficulty: 'Hard', tags: ['Hash Table', 'BFS', 'String'], url: 'https://leetcode.com/problems/word-ladder/' },
  { id: 'serialize-tree', title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', tags: ['Tree', 'Design', 'DFS', 'BFS'], url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/' },
  { id: 'longest-palin', title: 'Longest Palindromic Substring', difficulty: 'Medium', tags: ['String', 'Dynamic Programming'], url: 'https://leetcode.com/problems/longest-palindromic-substring/' },
  { id: '3sum', title: '3Sum', difficulty: 'Medium', tags: ['Array', 'Two Pointers', 'Sorting'], url: 'https://leetcode.com/problems/3sum/' },
  { id: 'k-largest', title: 'Kth Largest Element', difficulty: 'Medium', tags: ['Heap', 'Quickselect'], url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/' },
  { id: 'island-count', title: 'Number of Islands', difficulty: 'Medium', tags: ['Graph', 'DFS', 'BFS'], url: 'https://leetcode.com/problems/number-of-islands/' },
];

// Get problems with filters
router.get('/', authMiddleware, (req, res) => {
  try {
    const { difficulty, tag, q } = req.query;
    let result = DSA_BANK;

    if (difficulty) {
      result = result.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (tag) {
      result = result.filter(p => p.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase()));
    }

    if (q) {
      result = result.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
    }

    res.json({ problems: result, total: result.length });
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ error: 'Failed to get problems' });
  }
});

export default router;
