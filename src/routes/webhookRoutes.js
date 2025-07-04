import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Telegram webhook endpoint
router.post('/telegram', (req, res) => {
  try {
    const update = req.body;
    logger.info('Received Telegram webhook:', update);
    
    // Process webhook update
    // This would be used instead of polling in production
    
    res.status(200).json({ ok: true });
    
  } catch (error) {
    logger.error('Error processing Telegram webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check for webhooks
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    webhooks: ['telegram']
  });
});

export { router as webhookRoutes };