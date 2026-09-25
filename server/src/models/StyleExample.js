import mongoose from 'mongoose';
import crypto from 'crypto';

const styleExampleSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Text is required for a style example'],
      trim: true,
    },
    textHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    style: {
      type: String,
      required: true,
      default: 'Natural',
      index: true,
    },
    tone: {
      type: String,
      required: true,
      default: 'Natural',
      index: true,
    },
    domain: {
      type: String,
      default: 'General',
      index: true,
    },
    complexity: {
      type: String,
      enum: ['Simple', 'Medium', 'Advanced'],
      default: 'Medium',
      index: true,
    },
    language: {
      type: String,
      default: 'English',
      index: true,
    },
    source: {
      type: String,
      default: 'original',
    },
    sourceId: {
      type: String,
      default: '',
    },
    license: {
      type: String,
      default: 'original',
    },
    originalText: {
      type: String,
      default: '',
    },
    revisionText: {
      type: String,
      default: '',
    },
    task: {
      type: String,
      default: '',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    embedding: {
      type: [Number],
      default: undefined,
    },
    embeddingModel: {
      type: String,
      default: 'nomic-embed-text',
    },
    embeddingHash: {
      type: String,
      default: '',
    },
    embeddingVersion: {
      type: Number,
      default: 1,
    },
    embeddedAt: {
      type: Date,
      default: null,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to compute textHash and word count
styleExampleSchema.pre('validate', function (next) {
  if (this.text) {
    this.text = this.text.trim();
    if (!this.textHash) {
      this.textHash = crypto.createHash('sha256').update(this.text).digest('hex');
    }
    this.wordCount = this.text.split(/\s+/).filter(Boolean).length;
    this.characterCount = this.text.length;
  }
  next();
});

// Helper static method to generate text hash
styleExampleSchema.statics.hashText = (text) => {
  return crypto.createHash('sha256').update((text || '').trim()).digest('hex');
};

export const StyleExample = mongoose.model('StyleExample', styleExampleSchema);
export default StyleExample;
