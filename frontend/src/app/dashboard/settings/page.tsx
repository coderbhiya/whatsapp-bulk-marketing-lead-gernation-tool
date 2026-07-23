'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, CheckCircle, RefreshCcw, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const [status, setStatus] = useState<{ ready: boolean, qr: string }>({ ready: false, qr: '' });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 3 seconds
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStatus({ ready: false, qr: '' });
      fetchStatus();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your WhatsApp connection and account preferences.</p>
      </header>

      <div className="card p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-gray-400" />
          WhatsApp Connection
        </h2>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center text-gray-500 flex-col gap-3">
            <RefreshCcw className="w-6 h-6 animate-spin text-gray-400" />
            <p className="text-sm font-medium">Checking connection status...</p>
          </div>
        ) : status.ready ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-1">WhatsApp Connected</h3>
            <p className="text-green-600 text-sm mb-6 max-w-sm">
              Your account is successfully linked. You can now send campaigns to your contacts.
            </p>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 text-sm font-medium transition-colors">
              <LogOut className="w-4 h-4" />
              Disconnect Device
            </button>
          </div>
        ) : status.qr ? (
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-md font-medium text-gray-900 mb-2">Scan QR Code to Connect</h3>
            <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
              1. Open WhatsApp on your phone<br />
              2. Tap Menu or Settings and select Linked Devices<br />
              3. Tap on Link a Device and point your phone to this screen
            </p>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
              <QRCodeSVG value={status.qr} size={256} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCcw className="w-4 h-4 animate-spin text-[#25D366]" />
                Waiting for connection...
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-red-600 underline transition-colors"
              >
                Reset & Regenerate QR
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 flex justify-center items-center text-gray-500 flex-col gap-3 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <RefreshCcw className="w-6 h-6 animate-spin text-gray-400" />
            <p className="text-sm font-medium">Initializing WhatsApp Client...</p>
            <p className="text-xs text-gray-400">Please wait, generating QR code.</p>
            <button
              onClick={handleLogout}
              className="mt-2 text-xs text-gray-500 hover:text-red-600 underline transition-colors"
            >
              Cancel & Restart Client
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
