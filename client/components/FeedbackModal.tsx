import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'success' | 'error';
}

export const FeedbackModal = ({ isOpen, onClose, title, message, type }: FeedbackModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 rounded-full p-3 ${type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {type === 'success' ? <CheckCircle size={32} /> : <XCircle size={32} />}
          </div>
          
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500">{message}</p>
          
          <button 
            onClick={onClose}
            className={`mt-6 w-full rounded-xl py-3 text-sm font-bold text-white transition ${
              type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {type === 'success' ? 'Continue' : 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  );
};