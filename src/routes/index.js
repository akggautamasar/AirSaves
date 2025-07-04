import express from 'express';
import { fileRoutes } from './fileRoutes.js';
import { apiRoutes } from './apiRoutes.js';
import { webhookRoutes } from './webhookRoutes.js';

export function setupRoutes(app) {
  // API routes
  app.use('/api', apiRoutes);
  
  // File serving routes
  app.use('/file', fileRoutes);
  
  // Webhook routes
  app.use('/webhook', webhookRoutes);
  
  // Root route
  app.get('/', (req, res) => {
    res.json({
      message: 'Telegram File Saver Bot API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        file: '/file/:token',
        api: '/api/*',
        webhook: '/webhook/*'
      }
    });
  });
}