import express from 'express';
import cors from 'cors';
import mentorRoutes from './routes/mentor.js';
import knowledgeRoutes from './routes/knowledge.js';
import predictorRoutes from './routes/predictor.js';
import flashcardsRoutes from './routes/flashcards.js';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://api-gateway:3001'],
  credentials: true
}));
app.use(express.json());

app.use('/api/mentor', mentorRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/predict', predictorRoutes);
app.use('/api/quiz', flashcardsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-service' });
});

app.listen(PORT, () => {
  console.log(`AI Service running on port ${PORT}`);
});
