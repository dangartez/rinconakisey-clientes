import React from 'react';
import { Promotion } from '../../types';

interface PromotionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (promotion: Promotion) => void;
  promotion: Promotion | null;
}

const PromotionDetailModal: React.FC<PromotionDetailModalProps> = ({
  isOpen,
  onClose,
  onBook,
  promotion,
}) => {
  if (!isOpen || !promotion) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-0 md:p-4 animate-fadeIn" // p-0 on mobile for full screen
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full h-full md:max-w-4xl md:max-h-[90vh] flex flex-col" // Full height/width on mobile, wider on desktop
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - always visible */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-10 bg-white/70 rounded-full p-2 text-gray-800 hover:bg-white transition-colors"
            aria-label="Cerrar modal"
        >
            &times;
        </button>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <img
            src={promotion.image_url || 'https://picsum.photos/seed/promo/800/400'}
            alt={promotion.title}
            className="w-full h-auto object-contain bg-gray-100 rounded-t-none md:rounded-t-2xl" // Image, no fixed height, rounded-t-none on mobile
          />

          <div className="p-4 md:p-8"> {/* Text content, padding adjusted */}
            <h2 className="text-3xl font-bold text-gray-900">{promotion.title}</h2>
            <div className="mt-4 flex items-baseline space-x-3">
              <span className="text-4xl font-bold text-primary">{promotion.promo_price}€</span>
              {promotion.original_price && (
                <span className="text-2xl text-gray-400 line-through">{promotion.original_price}€</span>
              )}
            </div>
            <p className="mt-6 text-gray-700 whitespace-pre-wrap">{promotion.description}</p>
          </div>
        </div>

        {/* Fixed Footer with buttons */}
        <div className="bg-gray-50 px-4 md:px-8 py-3 md:py-5 rounded-b-none md:rounded-b-2xl flex justify-end items-center space-x-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => onBook(promotion)}
            className="px-8 py-3 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            Reservar Promoción
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromotionDetailModal;
