import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '../icons';

interface BookingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'success' | 'error';
  message: string;
  title?: string;
}

const BookingResultModal: React.FC<BookingResultModalProps> = ({ isOpen, onClose, status, message, title }) => {
  if (!isOpen) return null;

  const isSuccess = status === 'success';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-dialog-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-sm w-full text-center">
        {isSuccess ? (
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        ) : (
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        )}

        <h2 id="result-dialog-title" className="text-2xl font-bold text-secondary mb-2">
          {title ? title : (isSuccess ? '¡Reserva Completada!' : 'Error en la Reserva')}
        </h2>

        <p className="text-light-text mb-6">{message}</p>

        <button
          onClick={onClose}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
            isSuccess ? 'bg-primary hover:bg-primary-light' : 'bg-secondary hover:bg-opacity-90'
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default BookingResultModal;
