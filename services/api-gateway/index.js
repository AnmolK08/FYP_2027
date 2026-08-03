import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Route Definitions
const routes = {
  '/api/auth': 'http://auth-service:3002',
  '/api/resume': 'http://auth-service:3002',
  '/api/activity': 'http://auth-service:3002',
  
  '/api/leetcode': 'http://leetcode-service:3003',
  '/api/leaderboard': 'http://leetcode-service:3003',
  
  '/api/interviews': 'http://interview-service:3004',
  '/api/problems': 'http://interview-service:3004',
  '/api/sd': 'http://interview-service:3004',
  '/api/tracks': 'http://interview-service:3004',
  
  '/api/mentor': 'http://ai-service:3005',
  '/api/knowledge': 'http://ai-service:3005',
  '/api/predict': 'http://ai-service:3005',
  '/api/quiz': 'http://ai-service:3005',
};

// Setup Proxies
for (const [path, target] of Object.entries(routes)) {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    // When using docker-compose, the target will be resolved via docker DNS.
    // However, if we're running locally without docker yet, we can fall back to localhost
    router: () => {
      // For local testing without docker, you might want to uncomment this or use ENV vars
      // return target.replace('auth-service', 'localhost');
      return target;
    }
  }));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err);
  res.status(500).json({ error: 'Gateway Error' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
