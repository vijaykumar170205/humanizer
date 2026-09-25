import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: 'Untitled Document',
    },
    originalText: {
      type: String,
      default: '',
    },
    currentText: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      enum: ['text', 'pdf', 'docx', 'md', 'txt'],
      default: 'text',
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      }
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ userId: 1, createdAt: -1 });

export const Document = mongoose.model('Document', documentSchema);
export default Document;
