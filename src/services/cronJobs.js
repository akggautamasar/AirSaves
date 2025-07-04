import cron from 'node-cron';
import { FileService } from './fileService.js';
import { logger } from '../utils/logger.js';

export function setupCronJobs() {
  // Clean up expired files every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Starting cleanup of expired files...');
    try {
      const deletedCount = await FileService.cleanupExpiredFiles();
      logger.info(`Cleanup completed: ${deletedCount} files removed`);
    } catch (error) {
      logger.error('Error in cleanup cron job:', error);
    }
  });
  
  // Generate daily reports at midnight
  cron.schedule('0 0 * * *', async () => {
    logger.info('Generating daily report...');
    try {
      // Add your daily report logic here
      logger.info('Daily report generated successfully');
    } catch (error) {
      logger.error('Error generating daily report:', error);
    }
  });
  
  logger.info('Cron jobs scheduled successfully');
}