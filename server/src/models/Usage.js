import mongoose from 'mongoose';

const usageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    yearMonth: {
      type: String, // e.g., "2026-08"
      required: true,
      index: true,
    },
    wordsProcessed: {
      type: Number,
      default: 0,
    },
    requestsCount: {
      type: Number,
      default: 0,
    },
    filesProcessed: {
      type: Number,
      default: 0,
    },
    aiGenerations: {
      type: Number,
      default: 0,
    },
    toolBreakdown: {
      humanizer: { type: Number, default: 0 },
      paraphraser: { type: Number, default: 0 },
      grammar: { type: Number, default: 0 },
      detector: { type: Number, default: 0 },
      essay: { type: Number, default: 0 },
      sentence: { type: Number, default: 0 },
      paragraph: { type: Number, default: 0 },
      article: { type: Number, default: 0 },
    },
    lastRequestAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

usageSchema.index({ userId: 1, yearMonth: 1 }, { unique: true });

export const Usage = mongoose.model('Usage', usageSchema);
export default Usage;
