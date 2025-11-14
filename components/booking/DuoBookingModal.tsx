import React, { useState, useEffect, useMemo } from 'react';
import { Service, Promotion } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';

interface DuoBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  promotionContext?: Promotion | null; // Opcional
  onSlotSelected: (slot: string) => void;
}

const DuoBookingModal: React.FC<DuoBookingModalProps> = ({ isOpen, onClose, service, promotionContext, onSlotSelected }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const modalTitle = promotionContext?.title || service?.name || 'Reservar Servicio Dúo';

  const weekDays = useMemo(() => {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1 + (weekOffset * 7));
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        return date;
    });
  }, [weekOffset]);

  useEffect(() => {
    if (!isOpen || !service) return;

    const fetchSlots = async () => {
      setIsLoading(true);
      const startDate = weekDays[0].toISOString().split('T')[0];
      const endDate = weekDays[6].toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('get_available_slots_for_duo_service', {
        p_service_id: service.id,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) {
        console.error('Error fetching duo slots:', error);
        setAvailableSlots([]);
      } else {
        setAvailableSlots(data.map((slot: any) => slot.slot_start));
      }
      setIsLoading(false);
    };

    fetchSlots();
  }, [isOpen, service, weekOffset]);

  const handleSelectSlot = (slot: string) => {
    onSlotSelected(slot);
    onClose();
  };

  const groupedSlots = useMemo(() => {
    const groups: { [key: string]: string[] } = {};
    const today = new Date();
    today.setHours(0,0,0,0);

    availableSlots.forEach(slot => {
        const date = new Date(slot);
        if (date < today) return; // Don't show past slots

        const dateString = date.toISOString().split('T')[0];
        if (!groups[dateString]) {
            groups[dateString] = [];
        }
        groups[dateString].push(slot);
    });
    return groups;
  }, [availableSlots]);

  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl transform transition-all max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-secondary text-center">Reservar "{modalTitle}"</h2>
          <p className="text-center text-light-text mt-1">Este servicio requiere dos profesionales. Selecciona un día y una hora disponibles.</p>
        </div>
        
        <div className="p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" disabled={weekOffset === 0}><ChevronLeftIcon className="w-6 h-6" /></button>
                <span className="font-semibold text-secondary text-lg text-center">
                    {weekDays[0].toLocaleDateString('es-ES', { month: 'long' })} - {weekDays[6].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon className="w-6 h-6" /></button>
            </div>

            {isLoading ? (
              <div className="text-center p-8">Buscando huecos disponibles...</div>
            ) : Object.keys(groupedSlots).length === 0 ? (
              <div className="text-center p-8 text-gray-500">No hay huecos disponibles para esta semana.</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedSlots).map(([dateStr, slots]) => (
                  <div key={dateStr}>
                    <h3 className="font-bold text-primary text-lg mb-3 capitalize">
                      {new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {slots.map(slot => (
                        <button 
                          key={slot} 
                          onClick={() => handleSelectSlot(slot)} 
                          className="px-4 py-3 rounded-lg font-semibold transition bg-secondary text-white hover:bg-primary"
                        >
                          {new Date(slot).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="p-4 bg-gray-50 rounded-b-2xl flex justify-center mt-auto">
            <button onClick={onClose} className="px-8 py-3 font-semibold text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                Cancelar
            </button>
        </div>
      </div>
    </div>
  );
};

export default DuoBookingModal;
