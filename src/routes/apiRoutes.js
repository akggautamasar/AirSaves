import express from 'express';
import { SavedFile } from '../models/SavedFile.js';
import { User } from '../models/User.js';
import { DownloadJob } from '../models/DownloadJob.js';
import { FileService } from '../services/fileService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get user statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ telegramId: userId });
    const filesCount = await SavedFile.countDocuments({ userId });
    const totalSize = await SavedFile.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);
    
    const stats = {
      user: user,
      filesCount: filesCount,
      totalSize: totalSize.length > 0 ? totalSize[0].totalSize : 0,
      sizeInMB: totalSize.length > 0 ? (totalSize[0].totalSize / 1024 / 1024).toFixed(2) : 0
    };
    
    res.json(stats);
    
  } catch (error) {
    logger.error('Error getting user stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user files
router.get('/files/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const files = await SavedFile.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const totalFiles = await SavedFile.countDocuments({ userId });
    
    const response = {
      files: files.map(file => ({
        fileId: file.fileId,
        fileName: file.originalName || file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        downloadCount: file.downloadCount,
        shareToken: file.shareToken,
        createdAt: file.createdAt,
        expiresAt: file.expiresAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFiles / limit),
        totalFiles: totalFiles,
        hasNext: page * limit < totalFiles,
        hasPrev: page > 1
      }
    };
    
    res.json(response);
    
  } catch (error) {
    logger.error('Error getting user files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete file
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    await FileService.deleteFile(fileId, userId);
    
    res.json({ message: 'File deleted successfully' });
    
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get download jobs
router.get('/jobs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const jobs = await DownloadJob.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json(jobs);
    
  } catch (error) {
    logger.error('Error getting download jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system statistics
router.get('/system/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFiles = await SavedFile.countDocuments();
    const totalStorage = await SavedFile.aggregate([
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);
    
    const stats = {
      totalUsers,
      totalFiles,
      totalStorage: totalStorage.length > 0 ? totalStorage[0].totalSize : 0,
      storageInGB: totalStorage.length > 0 ? (totalStorage[0].totalSize / 1024 / 1024 / 1024).toFixed(2) : 0
    };
    
    res.json(stats);
    
  } catch (error) {
    logger.error('Error getting system stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as apiRoutes };