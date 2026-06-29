
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';


import authRoutes from './routes/auth.js';
import leetcodeRoutes from './routes/leetcode.js';
import leaderboardRoutes from './routes/leaderboard.js';
import mentorRoutes from './routes/mentor.js';
import knowledgeRoutes from './routes/knowledge.js';
import activityRoutes from './routes/activity.js';
import interviewRoutes from './routes/interviews.js';


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leetcode', leetcodeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/interviews', interviewRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
