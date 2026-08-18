const ATS_KEYWORDS = {
  'Software Engineer': ['python', 'javascript', 'java', 'data structures', 'algorithms', 'system design', 'git', 'sql', 'rest api', 'docker', 'kubernetes', 'aws', 'testing', 'agile'],
  'Data Scientist': ['python', 'pandas', 'numpy', 'sklearn', 'machine learning', 'deep learning', 'statistics', 'sql', 'tableau', 'tensorflow', 'pytorch', 'etl'],
  'Frontend Engineer': ['react', 'typescript', 'javascript', 'css', 'html', 'redux', 'next.js', 'webpack', 'testing', 'accessibility', 'responsive'],
  'Backend Engineer': ['python', 'java', 'go', 'node', 'sql', 'nosql', 'microservices', 'docker', 'kubernetes', 'redis', 'kafka', 'rest', 'graphql'],
};

export const scoreResume = (text, targetRole) => {
  if (!text) {
    const error = new Error('Resume text is required');
    error.statusCode = 400;
    throw error;
  }

  const role = targetRole || 'Software Engineer';
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

  return {
    score,
    matched,
    missing,
    word_count: words,
    issues,
    role,
  };
};

export const getAvailableRoles = () => {
  return Object.keys(ATS_KEYWORDS);
};
