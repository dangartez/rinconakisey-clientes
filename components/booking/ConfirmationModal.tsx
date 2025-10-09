
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bookingDetails: {
    serviceName: string;
    professionalName: string;
    dateTime: string;
    price: number;
  };
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bookingDetails,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      aria-labelledby="confirmation-dialog-title"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-md w-full"
        role="document"
      >
        <h2 
          id="confirmation-dialog-title" 
          className="text-2xl font-bold text-center text-secondary mb-4"
        >
          Confirmar tu Cita
        </h2>
        <p className="text-center text-light-text mb-6">
            Por favor, revisa los detalles de tu cita antes de confirmar.
        </p>
        
        <div className="space-y-3 p-4 bg-light-bg rounded-lg border border-gray-200 mb-6">
            <div>
                <h3 className="font-semibold text-sm text-light-text">Servicio</h3>
                <p className="text-base text-secondary">{bookingDetails.serviceName}</p>
            </div>
             <div>
                <h3 className="font-semibold text-sm text-light-text">Profesional</h3>
                <p className="text-base text-secondary">{bookingDetails.professionalName}</p>
            </div>
            <div>
                <h3 className="font-semibold text-sm text-light-text">Fecha y Hora</h3>
                <p className="text-base text-secondary">{bookingDetails.dateTime}</p>
            </div>
             <div>
                <h3 className="font-semibold text-sm text-light-text">Total</h3>
                <p className="text-lg font-bold text-primary">{bookingDetails.price}€</p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-1/2 order-2 sm:order-1 bg-white text-secondary py-3 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-100 transition-colors"
            aria-label="Cancelar y volver a la reserva"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-1/2 order-1 sm:order-2 bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105"
            aria-label="Confirmar la reserva"
          >
            Confirmar Cita
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
