import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

// Ideally, this would use JWT tokens or other proper authentication
// For now, we'll implement a simple auth middleware to satisfy the route requirements

/**
 * Authentication Middleware
 */
export class AuthMiddleware {
  /**
   * Protect routes - require authentication
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  protect(req: Request, res: Response, next: NextFunction): void {
    try {
      // Get token from header (would be a JWT token in a real application)
      const token = req.headers.authorization?.split(' ')[1];
      
      // Check if token exists
      if (!token) {
        res.status(401).json({
          status: 'error',
          message: 'Authentication required. Please login.'
        });
        return;
      }

      // In a real application, verify the token and get the user from it
      // For now, we'll mock the user for development purposes
      
      // Mock user for development
      // In a real app, this would be the decoded user from the JWT
      const user = {
        id: 'mock-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      };
      
      // Add user to request
      (req as any).user = user;
      
      // Call next middleware
      next();
    } catch (error) {
      logger.error('Error in authentication middleware:', error);
      res.status(401).json({
        status: 'error',
        message: 'Authentication failed. Please login again.'
      });
    }
  }
  
  /**
   * Restrict routes to specific roles
   * @param roles Array of allowed roles
   */
  restrictTo(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const user = (req as any).user;
        
        if (!user) {
          res.status(401).json({
            status: 'error',
            message: 'Authentication required. Please login.'
          });
          return;
        }
        
        // Check if user's role is allowed
        if (!roles.includes(user.role)) {
          res.status(403).json({
            status: 'error',
            message: 'You do not have permission to perform this action'
          });
          return;
        }
        
        // User has permission, call next middleware
        next();
      } catch (error) {
        logger.error('Error in role restriction middleware:', error);
        res.status(403).json({
          status: 'error',
          message: 'Permission denied'
        });
      }
    };
  }
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware(); 