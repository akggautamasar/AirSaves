import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';
import { SavedFile } from '../models/SavedFile.js';
import { logger } from '../utils/logger.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class FileService {
  static async saveFileFromTelegram(bot, fileObj, userId, metadata = {}) {
    try {
      const fileId = fileObj.file_id;
      const fileName = fileObj.file_name || `file_${Date.now()}`;
      
      // Get file info from Telegram
      const fileInfo = await bot.getFile(fileId);
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
      
      // Download file
      const response = await axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream'
      });
      
      // Create unique filename
      const fileExt = path.extname(fileName) || '.bin';
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExt}`;
      const filePath = path.join(UPLOAD_DIR, uniqueFileName);
      
      // Save file to disk
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', async () => {
          try {
            // Get file stats
            const stats = fs.statSync(filePath);
            const fileSize = stats.size;
            
            // Detect MIME type
            const buffer = fs.readFileSync(filePath, { start: 0, end: 1024 });
            const fileType = await fileTypeFromBuffer(buffer);
            
            // Create database record
            const savedFile = new SavedFile({
              originalName: fileName,
              fileName: uniqueFileName,
              filePath: filePath,
              fileSize: fileSize,
              mimeType: fileType?.mime || 'application/octet-stream',
              telegramFileId: fileId,
              telegramMessageId: metadata.telegramMessageId,
              sourceChannel: metadata.sourceChannel,
              sourceChannelId: metadata.sourceChannelId,
              userId: userId,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
            
            await savedFile.save();
            
            logger.info(`File saved: ${fileName} (${fileSize} bytes)`);
            resolve(savedFile);
            
          } catch (error) {
            // Clean up file if database save fails
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            reject(error);
          }
        });
        
        writer.on('error', reject);
      });
      
    } catch (error) {
      logger.error('Error saving file from Telegram:', error);
      throw error;
    }
  }
  
  static async getFileByToken(shareToken) {
    try {
      const savedFile = await SavedFile.findOne({ shareToken });
      
      if (!savedFile) {
        throw new Error('File not found');
      }
      
      if (savedFile.expiresAt && savedFile.expiresAt < new Date()) {
        throw new Error('File expired');
      }
      
      if (!fs.existsSync(savedFile.filePath)) {
        throw new Error('File not found on disk');
      }
      
      // Increment download count
      savedFile.downloadCount++;
      await savedFile.save();
      
      return savedFile;
      
    } catch (error) {
      logger.error('Error getting file by token:', error);
      throw error;
    }
  }
  
  static async deleteFile(fileId, userId) {
    try {
      const savedFile = await SavedFile.findOne({ fileId, userId });
      
      if (!savedFile) {
        throw new Error('File not found or not authorized');
      }
      
      // Delete from disk
      if (fs.existsSync(savedFile.filePath)) {
        fs.unlinkSync(savedFile.filePath);
      }
      
      // Delete from database
      await SavedFile.findByIdAndDelete(savedFile._id);
      
      logger.info(`File deleted: ${savedFile.fileName}`);
      return true;
      
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }
  
  static async cleanupExpiredFiles() {
    try {
      const expiredFiles = await SavedFile.find({
        expiresAt: { $lt: new Date() }
      });
      
      let deletedCount = 0;
      
      for (const file of expiredFiles) {
        try {
          // Delete from disk
          if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
          }
          
          // Delete from database
          await SavedFile.findByIdAndDelete(file._id);
          deletedCount++;
          
        } catch (error) {
          logger.error(`Error deleting expired file ${file.fileName}:`, error);
        }
      }
      
      logger.info(`Cleaned up ${deletedCount} expired files`);
      return deletedCount;
      
    } catch (error) {
      logger.error('Error cleaning up expired files:', error);
      throw error;
    }
  }
}