import mongoose from 'mongoose';

const downloadJobSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  channelUrl: String,
  messageRange: {
    start: Number,
    end: Number
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  progress: {
    total: Number,
    completed: Number,
    failed: Number
  },
  files: [{
    messageId: Number,
    fileId: String,
    status: String,
    error: String
  }],
  startedAt: Date,
  completedAt: Date,
  error: String
}, {
  timestamps: true
});

export const DownloadJob = mongoose.model('DownloadJob', downloadJobSchema);