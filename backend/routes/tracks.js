import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Learning tracks data
const TRACKS = [
  {
    id: 'sde-fresher',
    title: 'SDE Fresher Track',
    weeks: 12,
    description: 'DSA → System Design Basics → Mock interviews → Resume',
    modules: [
      { w: 1, title: 'Arrays & Hashing' },
      { w: 2, title: 'Two Pointers & Sliding Window' },
      { w: 3, title: 'Stack & Queue' },
      { w: 4, title: 'Linked List & Trees' },
      { w: 5, title: 'Graphs' },
      { w: 6, title: 'DP basics' },
      { w: 7, title: 'DP advanced' },
      { w: 8, title: 'System Design 101' },
      { w: 9, title: 'Mock Coding Round' },
      { w: 10, title: 'Mock System Design' },
      { w: 11, title: 'Behavioral & Resume' },
      { w: 12, title: 'Mock interviews + revise' }
    ]
  },
  {
    id: 'contest-grandmaster',
    title: 'Contest Grandmaster Track',
    weeks: 16,
    description: 'From green to Knight on LeetCode',
    modules: [
      { w: 1, title: 'Greedy patterns' },
      { w: 2, title: 'Math & Number theory' },
      { w: 3, title: 'Combinatorics' },
      { w: 4, title: 'Graph theory I' },
      { w: 5, title: 'Graph theory II' },
      { w: 6, title: 'Bitmask DP' },
      { w: 7, title: 'Segment Trees' },
      { w: 8, title: 'DSU' }
    ]
  }
];

// Get learning tracks
router.get('/', authMiddleware, (req, res) => {
  try {
    res.json({ tracks: TRACKS });
  } catch (error) {
    console.error('Get tracks error:', error);
    res.status(500).json({ error: 'Failed to get tracks' });
  }
});

export default router;
