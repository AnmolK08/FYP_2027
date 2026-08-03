import express from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ATS Keywords for different roles
const ATS_KEYWORDS = {
  'Software Engineer': ['python', 'javascript', 'java', 'data structures', 'algorithms', 'system design', 'git', 'sql', 'rest api', 'docker', 'kubernetes', 'aws', 'testing', 'agile'],
  'Data Scientist': ['python', 'pandas', 'numpy', 'sklearn', 'machine learning', 'deep learning', 'statistics', 'sql', 'tableau', 'tensorflow', 'pytorch', 'etl'],
  'Frontend Engineer': ['react', 'typescript', 'javascript', 'css', 'html', 'redux', 'next.js', 'webpack', 'testing', 'accessibility', 'responsive'],
  'Backend Engineer': ['python', 'java', 'go', 'node', 'sql', 'nosql', 'microservices', 'docker', 'kubernetes', 'redis', 'kafka', 'rest', 'graphql'],
};

// Score resume
router.post('/score', authMiddleware, (req, res) => {
  try {
    const { text, target_role } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    const role = target_role || 'Software Engineer';
    const lowerText = text.toLowerCase();
    const keywords = ATS_KEYWORDS[role] || ATS_KEYWORDS['Software Engineer'];

    const matched = keywords.filter(k => lowerText.includes(k));
    const missing = keywords.filter(k => !lowerText.includes(k));
    const score = Math.round((matched.length / keywords.length) * 100);

    const words = text.split(/\s+/).length;
    const bullets = (text.match(/•/g) || []).length + (text.match(/- /g) || []).length;

    const issues = [];
    if (words < 200) issues.push('Resume is too short — aim for 350–600 words.');
    if (words > 900) issues.push('Resume is too long — trim to under 1 page (~600 words).');
    if (bullets < 6) issues.push('Add more bullet points to highlight achievements.');
    if (!lowerText.includes('experience') && !lowerText.includes('intern')) {
      issues.push('Missing an Experience/Internship section.');
    }
    if (!lowerText.includes('project')) {
      issues.push('Add a Projects section with measurable impact.');
    }

    res.json({
      score,
      matched,
      missing,
      word_count: words,
      issues,
      role
    });
  } catch (error) {
    console.error('Resume score error:', error);
    res.status(500).json({ error: 'Failed to score resume' });
  }
});

// Get available roles
router.get('/roles', (req, res) => {
  try {
    res.json({ roles: Object.keys(ATS_KEYWORDS) });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

export default router;
