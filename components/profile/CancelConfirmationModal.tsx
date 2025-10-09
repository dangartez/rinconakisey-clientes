import React from 'react';
import { Appointment } from '../../types';
import { ExclamationTriangleIcon } from '../icons';

interface CancelConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  appointment: Appointment | null;
  serviceName: string;
  professionalName: string;
}

const CancelConfirmationModal: React.FC<CancelConfirmationModalProps> = ({ isOpen, onClose, onConfirm, appointment, serviceName, professionalName }) => {
  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-md w-full">
        <div className="flex items-center justify-center flex-col text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 id="cancel-dialog-title" className="text-2xl font-bold text-secondary mb-2">Anular Cita</h2>
            <p className="text-light-text mb-6">¿Estás seguro de que quieres anular esta cita?</p>
        </div>
        
        <div className="space-y-3 p-4 bg-light-bg rounded-lg border border-gray-200 mb-6 text-sm">
            <p><span className="font-semibold text-light-text">Servicio:</span> <span className="text-secondary">{serviceName}</span></p>
            <p><span className="font-semibold text-light-text">Profesional:</span> <span className="text-secondary">{professionalName}</span></p>
            <p><span className="font-semibold text-light-text">Fecha:</span> <span className="text-secondary">{appointment.start.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {appointment.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span></p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-1/2 order-2 sm:order-1 bg-white text-secondary py-3 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-1/2 order-1 sm:order-2 bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-transform transform hover:scale-105"
          >
            Confirmar Anulación
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmationModal;