import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { cleanWhitespace, countWords, countCharacters } from '../../utils/textProcessor.js';

/**
 * Extract clean, structured text from an uploaded document buffer (PDF, DOCX, TXT, MD)
 */
export const extractTextFromFile = async (file) => {
  if (!file || !file.buffer) {
    throw new Error('No valid file buffer provided for extraction.');
  }

  const filename = file.originalname || 'document.txt';
  const ext = path.extname(filename).toLowerCase();
  let extractedText = '';
  let metadata = {
    originalName: filename,
    sizeBytes: file.size,
    mimeType: file.mimetype,
    extension: ext.replace('.', ''),
  };

  try {
    switch (ext) {
      case '.pdf': {
        const pdfData = await pdfParse(file.buffer);
        extractedText = pdfData.text;
        metadata.pages = pdfData.numpages;
        metadata.pdfInfo = pdfData.info;
        break;
      }

      case '.docx':
      case '.doc': {
        const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = docxResult.value;
        if (docxResult.messages && docxResult.messages.length > 0) {
          metadata.warnings = docxResult.messages.map((m) => m.message);
        }
        break;
      }

      case '.txt':
      case '.md':
      case '.markdown': {
        extractedText = file.buffer.toString('utf-8');
        break;
      }

      default: {
        // Fallback UTF-8 attempt for text-like extensions
        extractedText = file.buffer.toString('utf-8');
        break;
      }
    }

    // Clean whitespace and normalize formatting
    const cleanedText = cleanWhitespace(extractedText);
    const wordCount = countWords(cleanedText);
    const charCount = countCharacters(cleanedText);

    return {
      text: cleanedText,
      wordCount,
      charCount,
      metadata,
    };
  } catch (error) {
    throw new Error(`Failed to extract text from ${filename}: ${error.message}`);
  }
};
