import React, { useMemo } from 'react';
import { Service } from '../../types';

interface ServiceConfirmationModalProps {
  isOpen: boolean;
  services: Service[] | null;
  onConfirm: () => void;
  onDecline: () => void;
  onCancel: () => void;
}

const ServiceConfirmationModal: React.FC<ServiceConfirmationModalProps> = ({
  isOpen,
  services,
  onConfirm,
  onDecline,
  onCancel,
}) => {
  const { totalDuration, totalPrice } = useMemo(() => {
    if (!services) return { totalDuration: 0, totalPrice: 0 };
    return services.reduce(
      (acc, service) => {
        const price = typeof service.price === 'string' ? parseFloat(service.price) : service.price;
        const duration = typeof service.duration === 'string' ? parseInt(service.duration, 10) : service.duration;
        acc.totalDuration += isNaN(duration) ? 0 : duration;
        acc.totalPrice += isNaN(price) ? 0 : price;
        return acc;
      },
      { totalDuration: 0, totalPrice: 0 }
    );
  }, [services]);

  if (!isOpen || !services || services.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-sm mx-auto text-center">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-secondary mb-2">Has seleccionado:</h3>
          <div className="p-3 bg-gray-50 rounded-lg mb-4 text-left">
            {services.map(service => (
              <h4 key={service.id} className="font-semibold text-secondary">- {service.name}</h4>
            ))}
            <div className="mt-2 pt-2 border-t border-gray-200 text-right">
                <p className="text-sm text-light-text">Duración Total: {totalDuration} min</p>
                <p className="font-semibold text-primary mt-1">Precio Total: {totalPrice.toFixed(2)}€</p>
            </div>
          </div>
        </div>
        <p className="text-light-text mb-6">¿Quieres añadir otro servicio más para <strong>el mismo día</strong>?</p>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex justify-center space-x-4">
            <button onClick={onDecline} className="px-8 py-2 rounded-lg font-semibold bg-gray-200 text-secondary hover:bg-gray-300 transition-colors">
              No
            </button>
            <button onClick={onConfirm} className="px-8 py-2 rounded-lg font-semibold bg-gray-200 text-secondary hover:bg-gray-300 transition-colors">
              Sí
            </button>
          </div>
          <button onClick={onCancel} className="px-6 py-2 rounded-lg font-semibold text-light-text hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceConfirmationModal;
