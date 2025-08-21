'use client';

import { useWhatsAppStore } from '@/lib/store';
import { format } from 'date-fns';
import { Search, Archive, Users } from 'lucide-react';

export default function ChatList() {
  const { chats, selectedChat, setSelectedChat } = useWhatsAppStore();

  return (
    <div className="w-1/3 min-w-[300px] bg-white border-r border-gray-200 flex flex-col">
      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search or start new chat"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200">
        <button className="text-sm font-medium text-green-600">All</button>
        <button className="text-sm text-gray-600 hover:text-gray-800">Unread</button>
        <button className="text-sm text-gray-600 hover:text-gray-800">Groups</button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Users size={48} className="mb-4" />
            <p>No chats yet</p>
            <p className="text-sm">Connect WhatsApp to see your chats</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer ${
                selectedChat === chat.id ? 'bg-gray-100' : ''
              }`}
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                {chat.avatar ? (
                  <img src={chat.avatar} alt={chat.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xl font-semibold text-gray-600">
                    {chat.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 truncate">{chat.name}</h3>
                  {chat.lastMessageTime && (
                    <span className="text-xs text-gray-500">
                      {format(new Date(chat.lastMessageTime), 'HH:mm')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">{chat.lastMessage || 'No messages'}</p>
              </div>

              {/* Unread Badge */}
              {chat.unreadCount > 0 && (
                <div className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {chat.unreadCount}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}