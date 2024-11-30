import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const adminMiddleware = {
  // Middleware for ensuring that the user is an admin
  isAdmin: async (req, res, next) => {
    try {
      const authorizationHeader = req.headers.authorization;

      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token is missing or invalid' });
      }

      const token = authorizationHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token

      // Find the user associated with the decoded token
      const user = await User.findById(decoded.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied: User is not an admin' });
      }

      req.user = user; // Attach user to the request
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message); // Log error for debugging
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token', error: error.message });
    }
  },

  // Middleware for general token verification (admin-only routes)
  adminAuth: async (req, res, next) => {
    try {
      const authorizationHeader = req.headers.authorization;
 
      if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        return res.status(403).json({ error: 'Access denied: Missing or malformed token' });
      }
 
      const token = authorizationHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token
 
      // Retrieve user from database
      const user = await User.findById(decoded.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Not authorized as admin' });
      }
 
      req.user = user; // Attach user info to the request
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message); // Log error for debugging
      return res.status(400).json({ error: 'Invalid token', message: error.message });
    }
  }
 
};

export default adminMiddleware;





