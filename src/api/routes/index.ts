import { Router } from 'express';
import complianceRoutes from './compliance.routes';
import authRoutes from './auth.routes';
import documentRoutes from './document.routes';
import perplexityRoutes from './perplexity.routes';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is up and running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/compliance', complianceRoutes);
router.use('/documents', documentRoutes);
router.use('/perplexity', perplexityRoutes);

export default router; 