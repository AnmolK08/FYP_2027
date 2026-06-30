import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Predict contest rating delta
router.post('/contest', authMiddleware, (req, res) => {
  try {
    const { current_rating, predicted_rank, participants } = req.body;

    if (!current_rating || !predicted_rank) {
      return res.status(400).json({ error: 'current_rating and predicted_rank are required' });
    }

    const parts = participants || 20000;
    
    // Elo-ish projection: average opponent rating ~ 1500, performance from rank percentile
    const pct = Math.max(0.001, Math.min(0.999, predicted_rank / Math.max(1, parts)));
    const perf = 1500 - 400 * (pct - 0.5) * 4; // simple linear mapping
    
    const k = 32;
    const expected = 1 / (1 + Math.pow(10, (1500 - current_rating) / 400));
    const actual = 1 - pct;
    const delta = Math.round(k * (actual - expected) * 10) / 10;
    const new_rating = Math.round((current_rating + delta) * 10) / 10;
    
    res.json({
      delta,
      new_rating,
      performance: Math.round(perf * 10) / 10,
      percentile: Math.round((1 - pct) * 100 * 10) / 10
    });
  } catch (error) {
    console.error('Predict contest error:', error);
    res.status(500).json({ error: 'Failed to predict contest' });
  }
});

export default router;
