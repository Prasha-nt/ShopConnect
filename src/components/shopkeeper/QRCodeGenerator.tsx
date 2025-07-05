import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Shop } from '../../types';
import toast from 'react-hot-toast';

interface QRCodeGeneratorProps {
  shop: Shop;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ shop }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const shopUrl = `${window.location.origin}/shop/${shop.id}`;

  useEffect(() => {
    generateQRCode();
  }, [shop]);

  const generateQRCode = async () => {
    try {
      const qr = await QRCode.toDataURL(shopUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qr);
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `${shop.name}-qr-code.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const copyShopUrl = () => {
    navigator.clipboard.writeText(shopUrl);
    toast.success('Shop URL copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          QR Code for {shop.name}
        </h3>
        <p className="text-gray-600">
          Customers can scan this QR code to visit your shop
        </p>
      </div>

      {qrCodeUrl && (
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="w-64 h-64 object-contain"
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Shop URL
          </label>
          <div className="flex">
            <input
              type="text"
              value={shopUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
            />
            <Button
              type="button"
              onClick={copyShopUrl}
              className="rounded-l-none"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button
          onClick={downloadQRCode}
          className="w-full"
          disabled={!qrCodeUrl}
        >
          <Download className="w-4 h-4 mr-2" />
          Download QR Code
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          How to use:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Print the QR code and display it in your shop</li>
          <li>• Customers can scan it with their phone camera</li>
          <li>• They'll be directed to your shop's product page</li>
          <li>• No app installation required for customers</li>
        </ul>
      </div>
    </div>
  );
};