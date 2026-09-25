import { Router } from 'express';
import {
  uploadAndExtract,
  saveDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} from '../controllers/fileController.js';
import { uploadDocument } from '../middlewares/upload.js';
import { protect, optionalAuth } from '../middlewares/auth.js';
import { uploadLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// File upload & text extraction (PDF, DOCX, TXT, MD)
router.post('/upload', uploadLimiter, optionalAuth, uploadDocument.single('file'), uploadAndExtract);

// User saved documents management (Protected)
router.post('/save-document', protect, saveDocument);
router.get('/documents', protect, getDocuments);
router.get('/documents/:id', protect, getDocumentById);
router.patch('/documents/:id', protect, updateDocument);
router.delete('/documents/:id', protect, deleteDocument);

export default router;
