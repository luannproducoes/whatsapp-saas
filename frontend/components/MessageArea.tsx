'use client';

import { useEffect, useState, useRef } from 'react';
import { useWhatsAppStore } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { format } from 'date-fns';
import { Send, Paperclip, Smile, MoreVertical, Search, Phone, Video } from 'lucide-react';

export default function MessageArea() {
  const { selectedChat, chats, messages, setMessages, addMessage } = useWhatsAppStore();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedChatData = chats.find(c => c.id === selectedChat);
  const chatMessages = messages[selectedChat || ''] || [];

  useEffect(() => {
    if (selectedChat) {
      loadMessages();
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('message', (data: any) => {
      if (data.chatId === selectedChat) {
        addMessage(data.chatId, data.message);
      }
    });

    socket.on('message_sent', (data: any) => {
      if (data.chatId === selectedChat) {
        addMessage(data.chatId, data.message);
      }
    });

    socket.on('messages', (data: any) => {
      if (data.chatId === selectedChat) {
        setMessages(data.chatId, data.messages);
      }
    });

    return () => {
      socket.off('message');
      socket.off('message_sent');
      socket.off('messages');
    };
  }, [selectedChat]);

  const loadMessages = () => {
    const socket = getSocket();
    if (socket && selectedChat) {
      socket.emit('get-messages', selectedChat);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !selectedChat) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('send-message', {
        chatId: selectedChat,
        message: inputMessage
      });
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">WhatsApp Web Clone</h2>
          <p className="text-gray-500">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            {selectedChatData?.avatar ? (
              <img src={selectedChatData.avatar} alt={selectedChatData.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                {selectedChatData?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{selectedChatData?.name}</h3>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-gray-800">
            <Video size={20} />
          </button>
          <button className="text-gray-600 hover:text-gray-800">
            <Phone size={20} />
          </button>
          <button className="text-gray-600 hover:text-gray-800">
            <Search size={20} />
          </button>
          <button className="text-gray-600 hover:text-gray-800">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {chatMessages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.fromMe
                  ? 'bg-green-100 text-gray-800'
                  : 'bg-white text-gray-800'
              }`}
            >
              <p className="break-words">{message.body}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-xs text-gray-500">
                  {format(new Date(message.timestamp * 1000), 'HH:mm')}
                </span>
                {message.fromMe && (
                  <span className="text-xs text-gray-500">
                    {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4 flex items-center gap-4">
        <button className="text-gray-600 hover:text-gray-800">
          <Smile size={24} />
        </button>
        <button className="text-gray-600 hover:text-gray-800">
          <Paperclip size={24} />
        </button>
        
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message"
          className="flex-1 px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        
        <button
          onClick={sendMessage}
          className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}