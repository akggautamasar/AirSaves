import express from 'express';
import fs from 'fs';
import path from 'path';
import { FileService } from '../services/fileService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get file by share token
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const savedFile = await FileService.getFileByToken(token);
    
    if (!savedFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const filePath = savedFile.filePath;
    const fileName = savedFile.originalName || savedFile.fileName;
    
    // Set appropriate headers
    res.setHeader('Content-Type', savedFile.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', savedFile.fileSize);
    
    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      logger.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' });
      }
    });
    
    logger.info(`File downloaded: ${fileName} (${savedFile.downloadCount} downloads)`);
    
  } catch (error) {
    logger.error('Error in file download:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get file info by share token
router.get('/:token/info', async (req, res) => {
  try {
    const { token } = req.params;
    const savedFile = await FileService.getFileByToken(token);
    
    if (!savedFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const fileInfo = {
      fileName: savedFile.originalName || savedFile.fileName,
      fileSize: savedFile.fileSize,
      mimeType: savedFile.mimeType,
      downloadCount: savedFile.downloadCount,
      createdAt: savedFile.createdAt,
      expiresAt: savedFile.expiresAt
    };
    
    res.json(fileInfo);
    
  } catch (error) {
    logger.error('Error getting file info:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as fileRoutes };