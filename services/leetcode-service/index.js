import express from 'express';
import cors from 'cors';
import leetcodeRoutes from './routes/leetcode.js';
import leaderboardRoutes from './routes/leaderboard.js';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://api-gateway:3001'],
  credentials: true
}));
app.use(express.json());

app.use('/api/leetcode', leetcodeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'leetcode-service' });
});

app.listen(PORT, () => {
  console.log(`LeetCode Service running on port ${PORT}`);
});
