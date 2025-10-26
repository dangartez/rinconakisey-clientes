import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Service, Professional, Appointment } from '../types';
import { supabase } from '../lib/supabaseClient';

interface BookingState {
    services: Service[];
    professional: Professional | null;
    date: Date | null;
    time: string | null;
    appointmentsToEdit: Appointment[] | null;
}

interface BookingContextType {
  bookingState: BookingState;
  addService: (service: Service) => void;
  removeService: (serviceId: number) => void;
  clearServices: () => void;
  setService: (service: Service) => void;
  setProfessional: (professional: Professional | null) => void;
  setDateTime: (date: Date, time: string) => void;
  setAppointmentToEdit: (appointment: Appointment | null) => void;
  setupGroupEdit: (appointments: Appointment[], services: Service[]) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialState: BookingState = {
    services: [],
    professional: null,
    date: null,
    time: null,
    appointmentsToEdit: null,
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookingState, setBookingState] = useState<BookingState>(initialState);

  const addService = useCallback((service: Service) => {
    setBookingState(prev => ({
      ...prev,
      services: [...prev.services, service]
    }));
  }, []);

  const removeService = useCallback((serviceId: number) => {
    setBookingState(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== serviceId)
    }));
  }, []);

  const clearServices = useCallback(() => {
    setBookingState(prev => ({ ...initialState, appointmentsToEdit: prev.appointmentsToEdit }));
  }, []);

  const setService = useCallback((service: Service) => {
    setBookingState(prev => ({ ...prev, services: [service] }));
  }, []);
  
  const setProfessional = useCallback((professional: Professional | null) => {
    setBookingState(prev => ({ ...prev, professional, date: null, time: null }));
  }, []);

  const setDateTime = useCallback((date: Date, time: string) => {
    setBookingState(prev => ({ ...prev, date, time }));
  }, []);

  const setAppointmentToEdit = useCallback(async (appointment: Appointment | null) => {
    if (appointment) {
        const { data: service, error: serviceError } = await supabase
            .from('v_services')
            .select('*')
            .eq('id', appointment.serviceId)
            .single();

        const { data: professional, error: professionalError } = await supabase
            .from('professionals')
            .select('*')
            .eq('id', appointment.professionalId)
            .single();

        if (serviceError || professionalError) {
            console.error('Error fetching appointment details:', serviceError || professionalError);
            return;
        }

        if (service) {
            setBookingState({
                ...initialState,
                services: [service as Service],
                professional: professional as Professional || null,
                date: appointment.start,
                time: appointment.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                appointmentsToEdit: [appointment],
            });
        }
    } else {
        setBookingState(prev => ({ ...prev, appointmentsToEdit: null }));
    }
}, []);

  const setupGroupEdit = useCallback(async (appointments: Appointment[], services: Service[]) => {
    if (appointments.length > 0) {
        const firstAppointment = appointments[0];

        const { data: professional, error } = await supabase
            .from('professionals')
            .select('*')
            .eq('id', firstAppointment.professionalId)
            .single();

        if (error) {
            console.error("Error fetching professional for group edit", error);
            return;
        }

        setBookingState(prev => ({
            ...prev,
            services: services,
            professional: professional as Professional,
            appointmentsToEdit: appointments,
            date: firstAppointment.start, // Set date and time from the first appointment of the group
            time: firstAppointment.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        }));
    }
  }, []);

  const resetBooking = useCallback(() => {
    setBookingState(initialState);
  }, []);

  return (
    <BookingContext.Provider value={{ 
      bookingState, 
      addService, 
      removeService, 
      clearServices, 
      setService,
      setProfessional, 
      setDateTime, 
      setAppointmentToEdit, 
      setupGroupEdit,
      resetBooking 
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};