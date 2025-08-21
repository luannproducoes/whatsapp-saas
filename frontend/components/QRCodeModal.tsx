'use client';

import { Loader2 } from 'lucide-react';

interface QRCodeModalProps {
  qrCode: string;
}

export default function QRCodeModal({ qrCode }: QRCodeModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-4">Connect WhatsApp</h2>
        
        <div className="mb-4">
          <p className="text-gray-600 text-center mb-6">
            Scan this QR code with your WhatsApp mobile app
          </p>
          
          {qrCode ? (
            <div className="flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-64 h-64" />
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin" size={48} />
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-500">
          <p className="mb-2">To connect:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open WhatsApp on your phone</li>
            <li>Go to Settings → Linked Devices</li>
            <li>Tap on Link a Device</li>
            <li>Scan this QR code</li>
          </ol>
        </div>
      </div>
    </div>
  );
}