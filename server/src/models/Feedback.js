import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    userEmail: String,
    toolUsed: {
      type: String,
      default: 'humanizer',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedbackType: {
      type: String,
      enum: ['rewrite_quality', 'bug', 'feature_request', 'general'],
      default: 'rewrite_quality',
    },
    originalSnippet: {
      type: String,
      maxlength: 1000,
    },
    rewrittenSnippet: {
      type: String,
      maxlength: 1000,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1500,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
