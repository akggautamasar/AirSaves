# Telegram File Saver Bot

A powerful Telegram bot that saves files from public channels with fast processing and permanent storage, providing users with unique download links.

## Features

- 🤖 **Telegram Bot Integration**: Full-featured bot with command handling
- 📁 **File Management**: Save files from public channels and direct uploads
- ⚡ **Fast Processing**: Optimized file downloading and storage
- 🔗 **Permanent Links**: Generate unique, shareable download links
- 📊 **User Statistics**: Track usage and file history
- 🔄 **Batch Processing**: Save multiple files from channel ranges
- 🗄️ **Database Integration**: MongoDB for metadata and user management
- 🛡️ **Security**: Rate limiting, file validation, and secure access
- 📱 **API Interface**: RESTful API for external integrations
- 🌐 **Cloud Ready**: Deployable on Koyeb, Render, and other platforms

## Prerequisites

- Node.js 18.x or higher
- MongoDB database
- Telegram Bot Token (from @BotFather)

## Quick Start

### 1. Get a Telegram Bot Token

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot with `/newbot`
3. Get your bot token

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
MONGODB_URI=mongodb://localhost:27017/telegram-file-bot
BASE_URL=http://localhost:3000
PORT=3000
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Application

```bash
# Development
npm run dev

# Production
npm start
```

## Bot Commands

- `/start` - Initialize the bot and get welcome message
- `/help` - Display help information
- `/save <channel_url> <start_msg> <end_msg>` - Save files from channel range
- `/myfiles` - View your saved files
- `/stats` - View usage statistics

## Usage Examples

### Save Files from Channel Range
```
/save https://t.me/channel_name 100 200
```
This saves files from messages 100-200 in the specified channel.

### Direct File Upload
Simply send any file directly to the bot to save it instantly.

### Access Saved Files
Use `/myfiles` to get download links for all your saved files.

## API Endpoints

- `GET /health` - Health check
- `GET /file/:token` - Download file by share token
- `GET /file/:token/info` - Get file information
- `GET /api/stats/:userId` - Get user statistics
- `GET /api/files/:userId` - Get user files
- `DELETE /api/files/:fileId` - Delete file
- `GET /api/jobs/:userId` - Get download jobs
- `GET /api/system/stats` - Get system statistics

## Database Schema

### User Model
- `telegramId`: Unique Telegram user ID
- `username`: Telegram username
- `firstName`: User's first name
- `lastName`: User's last name
- `filesCount`: Number of saved files
- `storageUsed`: Total storage used in bytes
- `lastActivity`: Last activity timestamp

### SavedFile Model
- `fileId`: Unique file identifier
- `originalName`: Original file name
- `fileName`: Stored file name
- `filePath`: Path to stored file
- `fileSize`: File size in bytes
- `mimeType`: MIME type
- `shareToken`: Unique share token
- `userId`: Owner's Telegram ID
- `downloadCount`: Number of downloads
- `expiresAt`: Expiration timestamp

### DownloadJob Model
- `userId`: User's Telegram ID
- `channelUrl`: Source channel URL
- `messageRange`: Start and end message IDs
- `status`: Job status (pending, processing, completed, failed)
- `progress`: Processing progress tracking

## Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Koyeb Deployment

1. Fork this repository
2. Connect your GitHub account to Koyeb
3. Set environment variables:
   - `TELEGRAM_BOT_TOKEN`
   - `MONGODB_URI`
   - `BASE_URL`
4. Deploy the service

### Render Deployment

1. Fork this repository
2. Connect your GitHub account to Render
3. Create a new Web Service
4. Set environment variables:
   - `TELEGRAM_BOT_TOKEN`
   - `MONGODB_URI`
   - `BASE_URL`
5. Deploy the service

### Environment Variables for Production

```env
NODE_ENV=production
TELEGRAM_BOT_TOKEN=your_bot_token
MONGODB_URI=mongodb://your_mongodb_connection_string
BASE_URL=https://your-domain.com
PORT=3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
LOG_LEVEL=INFO
```

## Features in Detail

### Fast File Processing
- Streaming downloads for large files
- Concurrent processing of multiple files
- Optimized storage with compression
- Chunked upload/download support

### Security Features
- Rate limiting to prevent abuse
- File type validation
- Secure token generation
- Expiration handling
- User access control

### Storage Management
- Automatic cleanup of expired files
- Storage quota management
- File deduplication
- Backup and recovery support

### Monitoring and Logging
- Comprehensive logging system
- Error tracking and reporting
- Performance metrics
- Usage analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue on GitHub
- Join our Telegram support group
- Check the documentation

## Changelog

### v1.0.0
- Initial release
- Core bot functionality
- File saving and sharing
- API endpoints
- Database integration
- Cloud deployment support