import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { Server, Socket } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import * as qrcode from 'qrcode';
import logger from '../utils/logger';

export class WhatsAppManager {
  private clients: Map<string, Client> = new Map();
  private io: Server;
  private supabase: SupabaseClient;

  constructor(io: Server, supabase: SupabaseClient) {
    this.io = io;
    this.supabase = supabase;
  }

  async initializeClient(userId: string, socket: Socket) {
    // Check if client already exists
    if (this.clients.has(userId)) {
      const existingClient = this.clients.get(userId);
      if (existingClient?.info) {
        socket.emit('ready', { info: existingClient.info });
        return;
      }
    }

    // Update session status to connecting
    await this.supabase
      .from('whatsapp_sessions')
      .upsert({
        user_id: userId,
        status: 'connecting',
        qr_code: null
      });

    // Create new WhatsApp client
    const client = new Client({
      authStrategy: new LocalAuth({ 
        clientId: userId,
        dataPath: `/app/.wwebjs_auth/${userId}_${Date.now()}` 
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    // QR Code event
    client.on('qr', async (qr) => {
      logger.info(`QR Code generated for user: ${userId}`);
      const qrDataUrl = await qrcode.toDataURL(qr);
      
      // Save QR code to database
      await this.supabase
        .from('whatsapp_sessions')
        .update({
          qr_code: qrDataUrl,
          status: 'connecting'
        })
        .eq('user_id', userId);
      
      socket.emit('qr', qrDataUrl);
    });

    // Ready event
    client.on('ready', async () => {
      logger.info(`WhatsApp client ready for user: ${userId}`);
      
      // Update session status
      await this.supabase
        .from('whatsapp_sessions')
        .update({
          status: 'connected',
          qr_code: null,
          phone_number: client.info.wid.user,
          last_connected_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      socket.emit('ready', { info: client.info });
      
      // Load initial chats
      await this.loadChats(userId, client, socket);
    });

    // Message event
    client.on('message', async (msg: Message) => {
      logger.info(`New message for user ${userId}: ${msg.body}`);
      
      // Save message to database
      await this.saveMessage(userId, msg);
      
      // Emit to user's room
      this.io.to(userId).emit('message', {
        chatId: msg.from,
        message: await this.formatMessage(msg)
      });
    });

    // Message acknowledgment
    client.on('message_ack', async (msg: Message, ack) => {
      logger.info(`Message ack for user ${userId}: ${ack}`);
      
      // Update message status in database
      await this.supabase
        .from('messages')
        .update({ status: this.getStatusFromAck(ack) })
        .eq('message_id', msg.id._serialized)
        .eq('user_id', userId);
      
      this.io.to(userId).emit('message_ack', {
        messageId: msg.id._serialized,
        status: this.getStatusFromAck(ack)
      });
    });

    // Disconnected event
    client.on('disconnected', async (reason) => {
      logger.info(`WhatsApp disconnected for user ${userId}: ${reason}`);
      
      // Update session status
      await this.supabase
        .from('whatsapp_sessions')
        .update({ status: 'disconnected' })
        .eq('user_id', userId);
      
      socket.emit('disconnected', { reason });
      this.clients.delete(userId);
    });

    // Authentication failure
    client.on('auth_failure', async (msg) => {
      logger.error(`Auth failure for user ${userId}: ${msg}`);
      
      // Update session status
      await this.supabase
        .from('whatsapp_sessions')
        .update({ status: 'failed' })
        .eq('user_id', userId);
      
      socket.emit('auth_failure', { message: msg });
      this.clients.delete(userId);
    });

    // Initialize the client
    try {
      await client.initialize();
      this.clients.set(userId, client);
    } catch (error) {
      logger.error(`Error initializing client for user ${userId}:`, error);
      
      await this.supabase
        .from('whatsapp_sessions')
        .update({ status: 'failed' })
        .eq('user_id', userId);
      
      throw error;
    }
  }

  async loadChats(userId: string, client: Client, socket: Socket) {
    try {
      logger.info(`Loading chats for user: ${userId}`);
      const chats = await client.getChats();
      logger.info(`Found ${chats.length} chats for user: ${userId}`);
      const formattedChats = await Promise.all(
        chats.slice(0, 50).map(async (chat) => {
          const contact = await chat.getContact();
          const lastMessage = chat.lastMessage;
          
          // Save chat to database
          await this.supabase
            .from('chats')
            .upsert({
              user_id: userId,
              chat_id: chat.id._serialized,
              name: chat.name || contact.pushname || contact.number,
              phone_number: contact.number,
              is_group: chat.isGroup,
              is_archived: chat.archived,
              is_muted: chat.isMuted,
              unread_count: chat.unreadCount,
              last_message: lastMessage?.body,
              last_message_time: lastMessage?.timestamp ? new Date(lastMessage.timestamp * 1000).toISOString() : null
            });
          
          return {
            id: chat.id._serialized,
            name: chat.name || contact.pushname || contact.number,
            avatar: await contact.getProfilePicUrl(),
            isGroup: chat.isGroup,
            isArchived: chat.archived,
            isMuted: chat.isMuted,
            unreadCount: chat.unreadCount,
            lastMessage: lastMessage ? {
              body: lastMessage.body,
              timestamp: lastMessage.timestamp,
              fromMe: lastMessage.fromMe
            } : null
          };
        })
      );
      
      logger.info(`Emitting ${formattedChats.length} chats to user: ${userId}`);
      socket.emit('chats', formattedChats);
    } catch (error) {
      logger.error(`Error loading chats for user ${userId}:`, error);
      socket.emit('error', { message: 'Failed to load chats' });
    }
  }

  async getChats(userId: string, socket: Socket) {
    const client = this.clients.get(userId);
    if (!client) {
      socket.emit('error', { message: 'WhatsApp not connected' });
      return;
    }
    
    await this.loadChats(userId, client, socket);
  }

  async getMessages(userId: string, chatId: string, socket: Socket) {
    const client = this.clients.get(userId);
    if (!client) {
      socket.emit('error', { message: 'WhatsApp not connected' });
      return;
    }

    try {
      const chat = await client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit: 50 });
      
      const formattedMessages = await Promise.all(
        messages.map(async (msg) => {
          await this.saveMessage(userId, msg);
          return this.formatMessage(msg);
        })
      );
      
      socket.emit('messages', { chatId, messages: formattedMessages });
    } catch (error) {
      logger.error(`Error getting messages for user ${userId}:`, error);
      socket.emit('error', { message: 'Failed to get messages' });
    }
  }

  async sendMessage(userId: string, data: { chatId: string; message: string; quotedMessageId?: string }) {
    const client = this.clients.get(userId);
    if (!client) {
      throw new Error('WhatsApp not connected');
    }

    try {
      const chat = await client.getChatById(data.chatId);
      let sentMessage: Message;
      
      if (data.quotedMessageId) {
        const messages = await chat.fetchMessages({ limit: 100 });
        const quotedMessage = messages.find(m => m.id._serialized === data.quotedMessageId);
        if (quotedMessage) {
          sentMessage = await quotedMessage.reply(data.message);
        } else {
          sentMessage = await chat.sendMessage(data.message);
        }
      } else {
        sentMessage = await chat.sendMessage(data.message);
      }
      
      // Save to database
      await this.saveMessage(userId, sentMessage);
      
      // Emit to user's room
      this.io.to(userId).emit('message_sent', {
        chatId: data.chatId,
        message: await this.formatMessage(sentMessage)
      });
    } catch (error) {
      logger.error(`Error sending message for user ${userId}:`, error);
      throw error;
    }
  }

  async disconnectClient(userId: string) {
    const client = this.clients.get(userId);
    if (client) {
      await client.destroy();
      this.clients.delete(userId);
      
      // Update session status
      await this.supabase
        .from('whatsapp_sessions')
        .update({ status: 'disconnected' })
        .eq('user_id', userId);
    }
  }

  private async saveMessage(userId: string, msg: Message) {
    try {
      const contact = await msg.getContact();
      
      await this.supabase
        .from('messages')
        .upsert({
          user_id: userId,
          chat_id: msg.from,
          message_id: msg.id._serialized,
          content: msg.body,
          from_me: msg.fromMe,
          from_name: contact.pushname || contact.name,
          from_number: contact.number,
          type: msg.type,
          timestamp: msg.timestamp,
          status: this.getStatusFromAck(msg.ack)
        });
    } catch (error) {
      logger.error('Error saving message:', error);
    }
  }

  private async formatMessage(msg: Message) {
    const contact = await msg.getContact();
    
    return {
      id: msg.id._serialized,
      body: msg.body,
      fromMe: msg.fromMe,
      from: msg.from,
      to: msg.to,
      author: msg.author,
      timestamp: msg.timestamp,
      type: msg.type,
      hasMedia: msg.hasMedia,
      ack: msg.ack,
      contact: {
        name: contact.pushname || contact.name,
        number: contact.number
      }
    };
  }

  private getStatusFromAck(ack: number): string {
    switch (ack) {
      case 0: return 'pending';
      case 1: return 'sent';
      case 2: return 'delivered';
      case 3: return 'read';
      default: return 'failed';
    }
  }
}