import { create } from 'zustand';

interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isGroup: boolean;
}

interface Message {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  from: string;
  type: string;
  status?: string;
}

interface WhatsAppStore {
  isConnected: boolean;
  isConnecting: boolean;
  qrCode: string | null;
  chats: Chat[];
  messages: Record<string, Message[]>;
  selectedChat: string | null;
  
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setQrCode: (qr: string | null) => void;
  setChats: (chats: Chat[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  setSelectedChat: (chatId: string | null) => void;
}

export const useWhatsAppStore = create<WhatsAppStore>((set) => ({
  isConnected: false,
  isConnecting: false,
  qrCode: null,
  chats: [],
  messages: {},
  selectedChat: null,
  
  setConnected: (connected) => set({ isConnected: connected }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setQrCode: (qr) => set({ qrCode: qr }),
  setChats: (chats) => set({ chats }),
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message]
    }
  })),
  setMessages: (chatId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: messages
    }
  })),
  setSelectedChat: (chatId) => set({ selectedChat: chatId })
}));