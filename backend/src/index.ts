import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { WhatsAppManager } from './services/whatsapp';
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import chatRoutes from './routes/chats';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import logger from './utils/logger';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// WhatsApp Manager
const whatsappManager = new WhatsAppManager(io, supabase);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/chats', authMiddleware, chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection
io.use(async (socket, next) => {
  try {
    logger.info('Socket.io authentication attempt');
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.error('No token provided in socket auth');
      return next(new Error('No authentication token provided'));
    }
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      logger.error('Token verification failed:', error);
      return next(new Error('Invalid authentication token'));
    }
    
    socket.data.userId = user.id;
    socket.data.email = user.email;
    logger.info(`Socket authenticated for user: ${user.email}`);
    next();
  } catch (err) {
    logger.error('Socket authentication error:', err);
    next(new Error('Authentication error'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.data.userId;
  logger.info(`User connected: ${userId}`);
  
  // Join user's room
  socket.join(userId);
  
  // Initialize WhatsApp client
  socket.on('initialize', async () => {
    try {
      await whatsappManager.initializeClient(userId, socket);
    } catch (error) {
      logger.error('Error initializing WhatsApp client:', error);
      socket.emit('error', { message: 'Failed to initialize WhatsApp' });
    }
  });
  
  // Send message
  socket.on('send-message', async (data) => {
    try {
      await whatsappManager.sendMessage(userId, data);
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Get chats
  socket.on('get-chats', async () => {
    try {
      await whatsappManager.getChats(userId, socket);
    } catch (error) {
      logger.error('Error getting chats:', error);
      socket.emit('error', { message: 'Failed to get chats' });
    }
  });
  
  // Get messages
  socket.on('get-messages', async (chatId: string) => {
    try {
      await whatsappManager.getMessages(userId, chatId, socket);
    } catch (error) {
      logger.error('Error getting messages:', error);
      socket.emit('error', { message: 'Failed to get messages' });
    }
  });
  
  // Disconnect WhatsApp
  socket.on('disconnect-whatsapp', async () => {
    try {
      await whatsappManager.disconnectClient(userId);
    } catch (error) {
      logger.error('Error disconnecting WhatsApp:', error);
    }
  });
  
  // Socket disconnect
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${userId}`);
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});