import React from 'react';
import QRCode from 'react-qr-code';
import { X, Copy } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export function InviteModal({ isOpen, onClose, classroom }) {
  const { showToast } = useToast();

  if (!isOpen || !classroom) return null;

  const joinUrl = `${window.location.origin}/join-class?code=${classroom.code}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        showToast({ type: 'success', message: 'Đã sao chép vào clipboard!' });
      },
      () => {
        showToast({ type: 'error', message: 'Không thể sao chép.' });
      },
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center animate-in fade-in-25">
      <div className="bg-white rounded-2xl shadow-2xl p-8 m-4 max-w-md w-full transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mời học sinh tham gia</h2>
            <p className="text-gray-600 mt-1">
              Lớp: <span className="font-semibold">{classroom.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Học sinh có thể quét mã QR hoặc sử dụng mã lớp để tham gia.
          </p>

          <div className="p-4 bg-gray-50 rounded-lg inline-block border border-gray-200">
            <QRCode value={joinUrl} size={200} />
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-500">Hoặc sử dụng mã lớp:</p>
            <div className="mt-2 flex items-center justify-center gap-2 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg px-4 py-3 max-w-xs mx-auto">
              <p className="text-2xl font-bold tracking-widest text-blue-700">{classroom.code}</p>
              <button
                onClick={() => copyToClipboard(classroom.code)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-500">Hoặc chia sẻ đường dẫn:</p>
            <div className="mt-2 flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2 max-w-xs mx-auto">
              <p className="text-sm font-medium text-green-800 truncate">{joinUrl}</p>
              <button
                onClick={() => copyToClipboard(joinUrl)}
                className="p-2 text-green-700 hover:bg-green-100 rounded-lg flex-shrink-0"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="w-full max-w-xs mx-auto px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Đã xong
          </button>
        </div>
      </div>
    </div>
  );
}
