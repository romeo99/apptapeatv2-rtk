import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode } from 'lucide-react';

export default function QRScan() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
              <QrCode className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">Scanner le QR code</h1>
            <p className="text-gray-600">
              Scannez le QR code sur votre table pour accéder au menu
            </p>
          </div>
          
          {/* Simulated QR scanner view */}
          <div className="relative aspect-square max-w-xs mx-auto mb-8 bg-black/5 rounded-lg overflow-hidden">
            <div className="absolute inset-4 border-2 border-white/50 rounded-lg"></div>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-0.5 bg-emerald-500 animate-scan"></div>
            </div>
          </div>

          <button
            onClick={() => navigate('/restaurant')}
            className="w-full bg-emerald-600 text-white rounded-full py-3 font-medium"
          >
            Scanner
          </button>
        </div>
      </div>
    </div>
  );
}