import mongoose from 'mongoose';

const rewriteHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalText: {
      type: String,
      required: true,
    },
    rewrittenText: {
      type: String,
      required: true,
    },
    toolUsed: {
      type: String,
      enum: [
        'humanizer',
        'paraphraser',
        'grammar',
        'detector',
        'essay',
        'sentence',
        'paragraph',
        'article',
      ],
      default: 'humanizer',
      index: true,
    },
    tone: {
      type: String,
      required: false,
    },
    style: {
      type: String,
      required: false,
    },
    length: {
      type: String,
      required: false,
    },
    language: {
      type: String,
      default: 'English',
    },
    customInstruction: {
      type: String,
      default: '',
    },
    wordCountOriginal: {
      type: Number,
      default: 0,
    },
    wordCountRewritten: {
      type: Number,
      default: 0,
    },
    diffSummary: {
      addedWords: { type: Number, default: 0 },
      removedWords: { type: Number, default: 0 },
      similarityPercentage: { type: Number, default: 100 },
    },
    aiProvider: {
      type: String,
      default: 'gemini',
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

rewriteHistorySchema.index({ userId: 1, createdAt: -1 });

export const RewriteHistory = mongoose.model('RewriteHistory', rewriteHistorySchema);
export default RewriteHistory;
