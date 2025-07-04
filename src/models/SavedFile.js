import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const savedFileSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true,
    unique: true,
    default: uuidv4
  },
  originalName: String,
  fileName: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  telegramFileId: String,
  telegramMessageId: String,
  sourceChannel: String,
  sourceChannelId: String,
  userId: {
    type: String,
    required: true,
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  shareToken: {
    type: String,
    unique: true,
    default: uuidv4
  },
  expiresAt: Date,
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
savedFileSchema.index({ userId: 1, createdAt: -1 });
savedFileSchema.index({ shareToken: 1 });
savedFileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SavedFile = mongoose.model('SavedFile', savedFileSchema);