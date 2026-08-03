import express from 'express';
import cors from 'cors';
import interviewsRoutes from './routes/interviews.js';
import problemsRoutes from './routes/problems.js';
import systemDesignRoutes from './routes/systemDesign.js';
import tracksRoutes from './routes/tracks.js';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://api-gateway:3001'],
  credentials: true
}));
app.use(express.json());

app.use('/api/interviews', interviewsRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api/sd', systemDesignRoutes);
app.use('/api/tracks', tracksRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'interview-service' });
});

app.listen(PORT, () => {
  console.log(`Interview Service running on port ${PORT}`);
});
