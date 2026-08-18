/**
 * Middleware responsibilities:
 * - Handle reusable request-processing logic
 * - Check authentication
 * - Pass control using next()
 */

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // In a real app: Verify token using jwt.verify
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.user = decoded;
    
    // Mock user for example
    req.user = { id: 'user_id', role: 'user' };
    
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
