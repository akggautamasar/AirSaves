import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database.js';
import { initializeBot } from './services/telegramBot.js';
import { setupRoutes } from './routes/index.js';
import { setupCronJobs } from './services/cronJobs.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize services
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDatabase();
    
    // Initialize Telegram bot
    const bot = initializeBot();
    
    // Setup routes
    setupRoutes(app);
    
    // Setup cron jobs for cleanup
    setupCronJobs();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info('Telegram File Saver Bot is now active!');
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    process.exit(0);
  });
});

startServer();