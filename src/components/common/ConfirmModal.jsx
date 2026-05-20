import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate-in fade-in-25">
      <div className="bg-white rounded-xl shadow-2xl p-6 m-4 max-w-sm w-full transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title || 'Yêu cầu xác nhận'}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="mt-4 text-sm text-gray-600 leading-relaxed">
          {message || 'Bạn có chắc chắn muốn thực hiện hành động này?'}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
