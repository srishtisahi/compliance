import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { documentController } from '../controllers/document.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { logger } from '../../utils/logger';
// import { documentValidator } from '../validators/document.validator';

const router = Router();

router.use((req, res, next) => {
  logger.debug(`Request received for document route: ${req.method} ${req.originalUrl}`);
  next();
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use a temporary directory for initial storage
    cb(null, process.env.UPLOAD_TEMP_DIR || path.join(process.cwd(), 'uploads', 'temp'));
  },
  filename: (req, file, cb) => {
    // Use a temporary filename - the document service will handle secure naming
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to validate file types
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if the file type is supported
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'image/png',
    'image/jpeg'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

// Configure multer
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter
});

// GET all documents for current user
router.get('/', authMiddleware.protect, documentController.getUserDocuments);

// POST upload a document for processing
router.post(
  '/upload',
  upload.single('document'),
  (req, res, next) => { logger.debug('Reached document upload controller'); next(); },
  documentController.uploadDocument
);

// GET document processing status
router.get(
  '/:documentId/status',
  authMiddleware.protect,
  documentController.getDocumentStatus
);

// GET document analysis results
router.get(
  '/:documentId/analysis',
  authMiddleware.protect,
  documentController.getDocumentAnalysis
);

// DELETE document
router.delete(
  '/:documentId',
  authMiddleware.protect,
  documentController.deleteDocument
);

export default router; 