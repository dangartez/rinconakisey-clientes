import React, { useEffect } from 'react';
import { CheckCircleIcon } from '../icons';

interface SuccessToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const SuccessToast: React.FC<SuccessToastProps> = ({ isOpen, onClose, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex items-center w-full max-w-xs p-4 space-x-4 text-gray-500 bg-white rounded-lg shadow-lg"
      role="alert"
    >
      <CheckCircleIcon className="w-8 h-8 text-green-500" />
      <div className="text-base font-normal text-secondary">{message}</div>
    </div>
  );
};

export default SuccessToast;
