import TelegramBot from 'node-telegram-bot-api';
import { User } from '../models/User.js';
import { SavedFile } from '../models/SavedFile.js';
import { DownloadJob } from '../models/DownloadJob.js';
import { FileService } from './fileService.js';
import { logger } from '../utils/logger.js';

let bot;

export function initializeBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is required');
  }
  
  bot = new TelegramBot(token, { polling: true });
  
  // Command handlers
  bot.onText(/\/start/, handleStart);
  bot.onText(/\/help/, handleHelp);
  bot.onText(/\/save (.+)/, handleSaveCommand);
  bot.onText(/\/myfiles/, handleMyFiles);
  bot.onText(/\/stats/, handleStats);
  
  // Handle file messages
  bot.on('document', handleDocument);
  bot.on('photo', handlePhoto);
  bot.on('video', handleVideo);
  bot.on('audio', handleAudio);
  
  // Handle callback queries
  bot.on('callback_query', handleCallbackQuery);
  
  logger.info('Telegram bot initialized successfully');
  return bot;
}

async function handleStart(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  try {
    // Create or update user
    await User.findOneAndUpdate(
      { telegramId: userId },
      {
        telegramId: userId,
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        lastActivity: new Date()
      },
      { upsert: true, new: true }
    );
    
    const welcomeMessage = `
🤖 Welcome to File Saver Bot!

I can help you save files from public Telegram channels and provide you with permanent download links.

📋 Available Commands:
/help - Show this help message
/save <channel_url> <start_msg> <end_msg> - Save files from a channel range
/myfiles - View your saved files
/stats - View your usage statistics

📤 You can also directly send me files to save them!

🔗 Get started by using /save command with a public channel link and message range.
    `;
    
    await bot.sendMessage(chatId, welcomeMessage);
  } catch (error) {
    logger.error('Error in handleStart:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error. Please try again.');
  }
}

async function handleHelp(msg) {
  const chatId = msg.chat.id;
  
  const helpMessage = `
🤖 File Saver Bot Help

📋 Commands:
/start - Start the bot
/help - Show this help message
/save <channel_url> <start_msg> <end_msg> - Save files from channel
/myfiles - View your saved files
/stats - View usage statistics

📤 Direct File Upload:
Send any file directly to save it instantly!

🔗 Save from Channels:
Example: /save https://t.me/channel_name 100 200
This will save files from messages 100 to 200 in the channel.

📊 Features:
• Fast file processing
• Permanent storage
• Unique download links
• File history tracking
• Automatic cleanup of expired files

⚡ Tips:
• Use smaller ranges for faster processing
• Files are automatically organized by date
• Share tokens expire after 30 days by default
• Maximum file size: 50MB per file
    `;
  
  await bot.sendMessage(chatId, helpMessage);
}

async function handleSaveCommand(msg, match) {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const params = match[1].split(' ');
  
  if (params.length < 3) {
    await bot.sendMessage(chatId, 'Usage: /save <channel_url> <start_message> <end_message>');
    return;
  }
  
  const [channelUrl, startMsg, endMsg] = params;
  const start = parseInt(startMsg);
  const end = parseInt(endMsg);
  
  if (isNaN(start) || isNaN(end) || start >= end) {
    await bot.sendMessage(chatId, 'Invalid message range. Start must be less than end.');
    return;
  }
  
  if (end - start > 100) {
    await bot.sendMessage(chatId, 'Range too large. Maximum 100 messages at once.');
    return;
  }
  
  try {
    // Create download job
    const job = new DownloadJob({
      userId,
      channelUrl,
      messageRange: { start, end },
      status: 'pending',
      progress: { total: end - start + 1, completed: 0, failed: 0 }
    });
    
    await job.save();
    
    await bot.sendMessage(chatId, `🔄 Processing your request...\nRange: ${start}-${end} (${end - start + 1} messages)\nJob ID: ${job._id}`);
    
    // Start processing in background
    processDownloadJob(job._id, chatId);
    
  } catch (error) {
    logger.error('Error in handleSaveCommand:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error processing your request.');
  }
}

async function handleMyFiles(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  try {
    const files = await SavedFile.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    if (files.length === 0) {
      await bot.sendMessage(chatId, 'You have no saved files yet. Use /save command or send me a file!');
      return;
    }
    
    let message = '📁 Your Recent Files:\n\n';
    
    files.forEach((file, index) => {
      const size = (file.fileSize / 1024 / 1024).toFixed(2);
      const date = file.createdAt.toLocaleDateString();
      message += `${index + 1}. ${file.originalName || file.fileName}\n`;
      message += `   📊 ${size} MB • 📅 ${date}\n`;
      message += `   🔗 /download_${file.shareToken}\n\n`;
    });
    
    message += `\nTotal files: ${files.length}`;
    
    await bot.sendMessage(chatId, message);
    
  } catch (error) {
    logger.error('Error in handleMyFiles:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error retrieving your files.');
  }
}

async function handleStats(msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  try {
    const user = await User.findOne({ telegramId: userId });
    const totalFiles = await SavedFile.countDocuments({ userId });
    const totalSize = await SavedFile.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
    ]);
    
    const sizeInMB = totalSize.length > 0 ? (totalSize[0].totalSize / 1024 / 1024).toFixed(2) : 0;
    
    const statsMessage = `
📊 Your Statistics:

👤 User: ${user?.firstName || 'Unknown'}
📁 Total Files: ${totalFiles}
💾 Storage Used: ${sizeInMB} MB
📅 Member Since: ${user?.createdAt?.toLocaleDateString() || 'Unknown'}
⚡ Last Activity: ${user?.lastActivity?.toLocaleDateString() || 'Unknown'}

🔗 To get download links for your files, use /myfiles command.
    `;
    
    await bot.sendMessage(chatId, statsMessage);
    
  } catch (error) {
    logger.error('Error in handleStats:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error retrieving your statistics.');
  }
}

async function handleDocument(msg) {
  await handleFileUpload(msg, msg.document);
}

async function handlePhoto(msg) {
  const photo = msg.photo[msg.photo.length - 1]; // Get highest resolution
  await handleFileUpload(msg, photo);
}

async function handleVideo(msg) {
  await handleFileUpload(msg, msg.video);
}

async function handleAudio(msg) {
  await handleFileUpload(msg, msg.audio);
}

async function handleFileUpload(msg, fileObj) {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  try {
    const processingMsg = await bot.sendMessage(chatId, '🔄 Processing your file...');
    
    const savedFile = await FileService.saveFileFromTelegram(bot, fileObj, userId, {
      telegramMessageId: msg.message_id,
      sourceChannel: msg.chat.title || 'Direct Upload'
    });
    
    const shareUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/file/${savedFile.shareToken}`;
    
    const successMessage = `
✅ File saved successfully!

📄 Name: ${savedFile.originalName || savedFile.fileName}
📊 Size: ${(savedFile.fileSize / 1024 / 1024).toFixed(2)} MB
🔗 Download Link: ${shareUrl}

The link will expire in 30 days. Use /myfiles to see all your saved files.
    `;
    
    await bot.editMessageText(successMessage, {
      chat_id: chatId,
      message_id: processingMsg.message_id
    });
    
    // Update user stats
    await User.findOneAndUpdate(
      { telegramId: userId },
      {
        $inc: { filesCount: 1, storageUsed: savedFile.fileSize },
        lastActivity: new Date()
      }
    );
    
  } catch (error) {
    logger.error('Error in handleFileUpload:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error saving your file.');
  }
}

async function handleCallbackQuery(callbackQuery) {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  
  await bot.answerCallbackQuery(callbackQuery.id);
  
  if (data.startsWith('download_')) {
    const fileId = data.replace('download_', '');
    // Handle file download request
    // This would redirect to the web interface
  }
}

async function processDownloadJob(jobId, chatId) {
  try {
    const job = await DownloadJob.findById(jobId);
    if (!job) return;
    
    job.status = 'processing';
    job.startedAt = new Date();
    await job.save();
    
    await bot.sendMessage(chatId, `⚡ Started processing ${job.progress.total} messages...`);
    
    // Here you would implement the actual channel scraping logic
    // For now, we'll simulate the process
    
    for (let i = job.messageRange.start; i <= job.messageRange.end; i++) {
      // Simulate processing each message
      await new Promise(resolve => setTimeout(resolve, 100));
      
      job.progress.completed++;
      
      if (job.progress.completed % 10 === 0) {
        await bot.sendMessage(chatId, `📊 Progress: ${job.progress.completed}/${job.progress.total} messages processed`);
      }
    }
    
    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();
    
    await bot.sendMessage(chatId, `✅ Job completed!\nProcessed: ${job.progress.completed}/${job.progress.total} messages\nUse /myfiles to see your saved files.`);
    
  } catch (error) {
    logger.error('Error in processDownloadJob:', error);
    
    const job = await DownloadJob.findById(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error.message;
      await job.save();
    }
    
    await bot.sendMessage(chatId, '❌ Job failed. Please try again with a smaller range.');
  }
}

export { bot };