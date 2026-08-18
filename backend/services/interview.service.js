import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database.js';

export const getInterviews = async (userId) => {
  return await prisma.mockInterview.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
};

export const createInterview = async (userId, interviewData) => {
  const { type, problemTitle, problemDescription, starterCode, language, durationMinutes } = interviewData;

  return await prisma.mockInterview.create({
    data: {
      id: uuidv4(),
      userId,
      type: type || 'coding',
      problemTitle,
      problemDescription,
      starterCode,
      language: language || 'javascript',
      durationMinutes: durationMinutes || 30,
      status: 'in_progress',
      startedAt: new Date(),
    },
  });
};

export const updateInterview = async (userId, interviewId, updateData) => {
  const { status, code, score, feedback } = updateData;

  await prisma.mockInterview.updateMany({
    where: {
      id: interviewId,
      userId,
    },
    data: {
      status: status || undefined,
      code: code !== undefined ? code : undefined,
      score: score !== undefined ? score : undefined,
      feedback: feedback !== undefined ? feedback : undefined,
      completedAt: status === 'completed' || status === 'abandoned' ? new Date() : undefined,
    },
  });

  return { success: true };
};

// Static Data Services

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
  { id: 'trap-water', title: 'Trapping Rain Water', difficulty: 'Hard', tags: ['Array', 'Two Pointers', 'Stack'], url: 'https://leetcode.com/problems/trapping-rain-water/' },
  { id: 'word-ladder', title: 'Word Ladder', difficulty: 'Hard', tags: ['Hash Table', 'BFS', 'String'], url: 'https://leetcode.com/problems/word-ladder/' },
  { id: 'serialize-tree', title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', tags: ['Tree', 'Design', 'DFS', 'BFS'], url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/' },
  { id: 'longest-palin', title: 'Longest Palindromic Substring', difficulty: 'Medium', tags: ['String', 'Dynamic Programming'], url: 'https://leetcode.com/problems/longest-palindromic-substring/' },
  { id: '3sum', title: '3Sum', difficulty: 'Medium', tags: ['Array', 'Two Pointers', 'Sorting'], url: 'https://leetcode.com/problems/3sum/' },
  { id: 'k-largest', title: 'Kth Largest Element', difficulty: 'Medium', tags: ['Heap', 'Quickselect'], url: 'https://leetcode.com/problems/kth-largest-element-in-an-array/' },
  { id: 'island-count', title: 'Number of Islands', difficulty: 'Medium', tags: ['Graph', 'DFS', 'BFS'], url: 'https://leetcode.com/problems/number-of-islands/' },
];

export const getProblems = (difficulty, tag, q) => {
  let result = DSA_BANK;
  if (difficulty) result = result.filter(p => p.difficulty.toLowerCase() === difficulty.toLowerCase());
  if (tag) result = result.filter(p => p.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase()));
  if (q) result = result.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
  return result;
};

const SD_TOPICS = [
  { id: 'url-shortener', title: 'Design URL Shortener (TinyURL)', level: 'easy', tags: ['hashing', 'db', 'cache'] },
  { id: 'rate-limiter', title: 'Design Rate Limiter', level: 'easy', tags: ['redis', 'sliding window'] },
  { id: 'chat-app', title: 'Design WhatsApp / Chat App', level: 'medium', tags: ['websocket', 'queue', 'fanout'] },
  { id: 'insta', title: 'Design Instagram Feed', level: 'medium', tags: ['timeline', 'cdn', 'sharding'] },
  { id: 'uber', title: 'Design Uber / Ride-hailing', level: 'hard', tags: ['geo', 'matching', 'payments'] },
  { id: 'youtube', title: 'Design YouTube / Video Streaming', level: 'hard', tags: ['cdn', 'transcoding', 'storage'] },
  { id: 'google-drive', title: 'Design Google Drive', level: 'medium', tags: ['storage', 'sync', 'chunking'] },
  { id: 'twitter', title: 'Design Twitter', level: 'medium', tags: ['timeline', 'fanout', 'cache'] },
  { id: 'search', title: 'Design Search Engine', level: 'hard', tags: ['crawler', 'index', 'ranking'] },
  { id: 'notif', title: 'Design Notification Service', level: 'easy', tags: ['queue', 'push', 'sms'] },
];

export const getSystemDesignTopics = () => SD_TOPICS;

const TRACKS = [
  {
    id: 'sde-fresher',
    title: 'SDE Fresher Track',
    weeks: 12,
    description: 'DSA → System Design Basics → Mock interviews → Resume',
    modules: [
      { w: 1, title: 'Arrays & Hashing' }, { w: 2, title: 'Two Pointers & Sliding Window' },
      { w: 3, title: 'Stack & Queue' }, { w: 4, title: 'Linked List & Trees' },
      { w: 5, title: 'Graphs' }, { w: 6, title: 'DP basics' },
      { w: 7, title: 'DP advanced' }, { w: 8, title: 'System Design 101' },
      { w: 9, title: 'Mock Coding Round' }, { w: 10, title: 'Mock System Design' },
      { w: 11, title: 'Behavioral & Resume' }, { w: 12, title: 'Mock interviews + revise' }
    ]
  },
  {
    id: 'contest-grandmaster',
    title: 'Contest Grandmaster Track',
    weeks: 16,
    description: 'From green to Knight on LeetCode',
    modules: [
      { w: 1, title: 'Greedy patterns' }, { w: 2, title: 'Math & Number theory' },
      { w: 3, title: 'Combinatorics' }, { w: 4, title: 'Graph theory I' },
      { w: 5, title: 'Graph theory II' }, { w: 6, title: 'Bitmask DP' },
      { w: 7, title: 'Segment Trees' }, { w: 8, title: 'DSU' }
    ]
  }
];

export const getTracks = () => TRACKS;
