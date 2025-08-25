'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { initSocket, getSocket } from '@/lib/socket';
import { useWhatsAppStore } from '@/lib/store';
import toast, { Toaster } from 'react-hot-toast';
import ChatList from '@/components/ChatList';
import MessageArea from '@/components/MessageArea';
import QRCodeModal from '@/components/QRCodeModal';
import { LogOut, Wifi, WifiOff } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const { 
    isConnected, 
    isConnecting, 
    qrCode, 
    setConnected, 
    setConnecting, 
    setQrCode, 
    setChats 
  } = useWhatsAppStore();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/');
      return;
    }
    
    setUser(session.user);
    initializeSocket(session.access_token);
  };

  const initializeSocket = (token: string) => {
    const socket = initSocket(token);
    
    socket.on('connect', () => {
      console.log('Socket connected successfully');
      toast.success('Connected to server');
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      toast.error(`Connection failed: ${error.message}`);
      setConnecting(false);
    });
    
    socket.on('qr', (qr: string) => {
      setQrCode(qr);
      setConnecting(true);
      setConnected(false);
    });
    
    socket.on('ready', (data: any) => {
      setConnected(true);
      setConnecting(false);
      setQrCode(null);
      toast.success('WhatsApp connected!');
      socket.emit('get-chats');
    });
    
    socket.on('chats', (chats: any[]) => {
      setChats(chats);
    });
    
    socket.on('disconnected', () => {
      setConnected(false);
      setConnecting(false);
      toast.error('WhatsApp disconnected');
    });
    
    socket.on('error', (error: any) => {
      toast.error(error.message || 'An error occurred');
    });
  };

  const handleLogout = async () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('disconnect-whatsapp');
      socket.disconnect();
    }
    
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">WhatsApp Clone</h1>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi size={20} />
                <span className="text-sm">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={20} />
                <span className="text-sm">Disconnected</span>
              </>
            )}
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 hover:bg-green-700 px-3 py-2 rounded-lg transition"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <ChatList />
        <MessageArea />
      </div>
      
      {/* QR Code Modal */}
      {qrCode && <QRCodeModal qrCode={qrCode} />}
    </div>
  );
}