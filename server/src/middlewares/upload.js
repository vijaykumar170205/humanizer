import multer from 'multer';
import path from 'path';
import { config } from '../config/env.js';

// Memory storage keeps file buffers in RAM during extraction and prevents lingering disk clutter
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = config.upload.allowedExtensions.map((ext) => `.${ext.toLowerCase()}`);
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
    'application/octet-stream', // Some browsers send octet-stream for .md / .txt
  ];

  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error(`Unsupported file type '${ext}'. Please upload PDF, DOCX, TXT, or Markdown documents.`),
      false
    );
  }

  // Extension is valid
  cb(null, true);
};

export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize, // 10MB
    files: 1, // Single file upload
  },
  fileFilter,
});
