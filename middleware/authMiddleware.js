import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Assuming 'Bearer <token>'
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded user to the request object
    next(); // Pass control to the next middleware or route handler
  } catch (error) {
    console.error('Token verification error:', error); // Log error (for debugging)
    res.status(403).json({ message: 'Invalid token. Access denied.' });
  }
};

export default authMiddleware;

