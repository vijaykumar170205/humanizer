import { extractTextFromFile } from '../services/file-processing/fileParser.js';
import Document from '../models/Document.js';
import { recordUsage } from '../middlewares/usageLimiter.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';
import { countWords } from '../utils/textProcessor.js';

/**
 * @desc   Upload and extract text from PDF, DOCX, TXT, or MD
 * @route  POST /api/files/upload
 */
export const uploadAndExtract = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file attached. Please select a PDF, DOCX, TXT, or Markdown file.', 400);
    }

    const extraction = await extractTextFromFile(req.file);

    if (req.user) {
      await recordUsage({
        userId: req.user._id,
        wordsProcessed: 0,
        filesProcessed: 1,
      });
    }

    return successResponse(
      res,
      extraction,
      `Successfully extracted ${extraction.wordCount.toLocaleString()} words from ${extraction.metadata.originalName}.`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Save document draft to user library
 * @route  POST /api/files/save-document
 */
export const saveDocument = async (req, res, next) => {
  try {
    const { title = 'Untitled Document', originalText = '', currentText = '', fileType = 'text', tags = [] } = req.body;

    const wordCount = countWords(currentText || originalText);

    const doc = await Document.create({
      userId: req.user._id,
      title,
      originalText,
      currentText,
      fileType,
      wordCount,
      tags,
    });

    return successResponse(res, doc, 'Document saved to library.', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get user documents with search & pagination
 * @route  GET /api/files/documents
 */
export const getDocuments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = { userId: req.user._id, isArchived: false };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const total = await Document.countDocuments(query);
    const docs = await Document.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return paginatedResponse(res, docs, total, page, limit, 'Documents retrieved.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get single document by ID
 * @route  GET /api/files/documents/:id
 */
export const getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) {
      return errorResponse(res, 'Document not found.', 404);
    }
    return successResponse(res, doc, 'Document retrieved.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update document
 * @route  PATCH /api/files/documents/:id
 */
export const updateDocument = async (req, res, next) => {
  try {
    const { title, currentText, tags } = req.body;
    const doc = await Document.findOne({ _id: req.params.id, userId: req.user._id });
    if (!doc) {
      return errorResponse(res, 'Document not found.', 404);
    }

    if (title !== undefined) doc.title = title;
    if (currentText !== undefined) {
      doc.currentText = currentText;
      doc.wordCount = countWords(currentText);
    }
    if (tags !== undefined) doc.tags = tags;

    await doc.save();
    return successResponse(res, doc, 'Document updated.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete document
 * @route  DELETE /api/files/documents/:id
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!doc) {
      return errorResponse(res, 'Document not found.', 404);
    }
    return successResponse(res, {}, 'Document deleted successfully.');
  } catch (error) {
    next(error);
  }
};
