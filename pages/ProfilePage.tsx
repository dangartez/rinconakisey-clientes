
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Appointment, Voucher, Service, Professional, ClientBono, BonoDefinition } from '../types';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import CancelConfirmationModal from '../components/profile/CancelConfirmationModal';
import { GearIcon } from '../components/icons';
import SuccessToast from '../components/common/SuccessToast';
import { supabase } from '../lib/supabaseClient';
import BookingResultModal from '../components/booking/BookingResultModal';
import SettingsModal from '../components/profile/SettingsModal';

// AddServicePrompt component for voucher flow
interface AddServicePromptProps {
    isOpen: boolean;
    onConfirm: () => void;
    onDecline: () => void;
    onCancel: () => void;
    selectedServices: Service[];
}

const AddServicePrompt: React.FC<AddServicePromptProps> = ({ isOpen, onConfirm, onDecline, onCancel, selectedServices }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-sm mx-auto text-center">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-secondary mb-2">Servicio Seleccionado:</h3>
                    <ul className="list-disc list-inside text-left text-light-text">
                        {selectedServices.map(service => (
                            <li key={service.id}>{service.name}</li>
                        ))}
                    </ul>
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

// Define a more detailed appointment type for the UI
interface DetailedAppointment {
  id: string;
  services: Service;
  professionals: Professional;
  service_id: number;
  professional_id: string;
  start_time: string;
  end_time: string;
  status: string;
  booking_group_id?: string | null;
  start: Date;
  end: Date;
}

interface DetailedVoucher extends Voucher {
    bono_definitions: {
        services: Service[];
    }
}

type Tab = 'appointments' | 'vouchers';
type VoucherTab = 'active' | 'expired';

const ProfilePage: React.FC = () => {
  const { user, isLoggedIn, logout, updateUser } = useAuth();
  const { setService, resetBooking } = useBooking();
  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const navigate = useNavigate();
  const { setAppointmentToEdit } = useBooking();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  const [appointments, setAppointments] = useState<DetailedAppointment[]>([]);
  const [vouchers, setVouchers] = useState<DetailedVoucher[]>([]);
  const [expiredVouchers, setExpiredVouchers] = useState<DetailedVoucher[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [activeVoucherTab, setActiveVoucherTab] = useState<VoucherTab>('active');
  const [lastVouchersFetch, setLastVouchersFetch] = useState<number>(0);

  const [cancelModalState, setCancelModalState] = useState<{ isOpen: boolean; appointment: DetailedAppointment | null; serviceName: string; professionalName: string; }>({
    isOpen: false,
    appointment: null,
    serviceName: '',
    professionalName: '',
  });

  const [resultModalState, setResultModalState] = useState<{
    isOpen: boolean;
    status: 'success' | 'error';
    message: string;
    title?: string;
  }>({
    isOpen: false,
    status: 'success',
    message: '',
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  // State for AddServicePrompt modal
  const [showAddServicePrompt, setShowAddServicePrompt] = useState(false);
  const [selectedVoucherService, setSelectedVoucherService] = useState<Service | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    } else if (user) {
      fetchAppointments();
      fetchVouchers();
      fetchExpiredVouchers();
    }
  }, [isLoggedIn, user, navigate]);

  const fetchAppointments = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, start_time, end_time, status, service_id, professional_id, booking_group_id,
        services (*),
        professionals (*)
      `)
      .eq('client_id', user.id);

    if (error) {
      console.error('Error fetching appointments:', error);
    } else {
      const formattedData = data.map(appt => {
        const serviceData = Array.isArray(appt.services) ? appt.services[0] : appt.services;
        const professionalData = Array.isArray(appt.professionals) ? appt.professionals[0] : appt.professionals;
        
        return {
          id: appt.id,
          services: serviceData as unknown as Service,
          professionals: professionalData as unknown as Professional,
          service_id: appt.service_id,
          professional_id: appt.professional_id,
          start_time: appt.start_time,
          end_time: appt.end_time,
          status: appt.status,
          booking_group_id: appt.booking_group_id,
          start: new Date(appt.start_time),
          end: new Date(appt.end_time),
        };
      }) as DetailedAppointment[];
      setAppointments(formattedData);
    }
  };

  const fetchVouchers = async (forceRefresh = false) => {
    if (!user) return;
    
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (!forceRefresh && (now - lastVouchersFetch) < fiveMinutes && vouchers.length > 0) {
      return;
    }
    
    setIsLoadingVouchers(true);
    setLastVouchersFetch(now);
    
    try {
      const { data: activeBonos, error: functionError } = await supabase
        .rpc('get_client_active_bonos', { p_client_id: user.id });

      if (functionError) {
        console.error('Error fetching active bonos:', functionError);
        const { data, error } = await supabase
          .from('client_bonos')
          .select(`
            *,
            bono_definitions (
              *,
              bono_definition_services (
                service_id,
                services (*)
              )
            )
          `)
          .eq('client_id', user.id)
          .gt('remaining_sessions', 0);

        if (error) {
          console.error('Error fetching vouchers (fallback):', error);
          setVouchers([]);
        } else {
          const transformedData = data.map((item: any) => ({
            ...item,
            bono_definitions: {
              ...item.bono_definitions,
              services: item.bono_definitions.bono_definition_services.map((bds: any) => bds.services)
            }
          }));
          setVouchers(transformedData as DetailedVoucher[]);
        }
      } else {
        const transformedData = activeBonos.map((item: any) => ({
          id: item.client_bono_id,
          remaining_sessions: item.remaining_sessions,
          purchase_date: item.purchase_date,
          bono_definitions: {
            name: item.bono_name,
            type: item.bono_type,
            services: item.services
          }
        }));
        setVouchers(transformedData as DetailedVoucher[]);
      }
    } catch (error) {
      console.error('Unexpected error fetching vouchers:', error);
      setVouchers([]);
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const fetchExpiredVouchers = async (forceRefresh = false) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('client_bonos')
        .select(`
          *,
          bono_definitions (
            *,
            bono_definition_services (
              service_id,
              services (*)
            )
          )
        `)
        .eq('client_id', user.id)
        .lte('remaining_sessions', 0)
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Error fetching expired vouchers:', error);
        setExpiredVouchers([]);
      } else {
        const transformedData = data.map((item: any) => ({
          ...item,
          bono_definitions: {
            ...item.bono_definitions,
            services: item.bono_definitions.bono_definition_services.map((bds: any) => bds.services)
          }
        }));
        setExpiredVouchers(transformedData as DetailedVoucher[]);
      }
    } catch (error) {
      console.error('Unexpected error fetching expired vouchers:', error);
      setExpiredVouchers([]);
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
    }
  }, []);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = appointments
      .filter(a => 
        (a.status === 'Confirmada' || a.status === 'confirmada') && 
        a.start >= today
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    const past = appointments
      .filter(a => {
        const isPastConfirmed = (a.status === 'Confirmada' || a.status === 'confirmada') && a.start < today;
        const isCompleted = a.status === 'Completada' || a.status === 'completed';
        return isPastConfirmed || isCompleted;
      })
      .sort((a, b) => b.start.getTime() - a.start.getTime());

    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [appointments]);

  useEffect(() => {
    // ... notification logic remains the same for now
  }, [upcomingAppointments, notificationPermission]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    }
  };
  
  const handleEdit = (appointment: DetailedAppointment) => {
    const apptToEdit: Appointment = {
      id: appointment.id,
      serviceId: appointment.service_id,
      professionalId: appointment.professional_id,
      start: appointment.start,
      end: appointment.end,
      status: appointment.status as any,
    };
    setAppointmentToEdit(apptToEdit);
    navigate('/reservar');
  };

  const handleOpenCancelModal = (appointment: DetailedAppointment) => {
    setCancelModalState({ 
        isOpen: true, 
        appointment, 
        serviceName: appointment.services.name, 
        professionalName: appointment.professionals.full_name 
    });
  };

  const handleConfirmCancel = async () => {
    if (cancelModalState.appointment) {
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'Cancelada' })
            .eq('id', cancelModalState.appointment.id);

        setCancelModalState({ isOpen: false, appointment: null, serviceName: '', professionalName: '' });

        if (error) {
            console.error('Error cancelling appointment:', error);
            setResultModalState({
              isOpen: true,
              status: 'error',
              message: 'Error al anular la cita. Por favor, inténtalo de nuevo más tarde.'
            });
        } else {
            setResultModalState({
              isOpen: true,
              status: 'success',
              title: '¡Reserva Anulada!',
              message: 'Tu cita ha sido anulada correctamente.'
            });
        }
    }
  };

  const handleCloseResultModal = () => {
    setResultModalState({ isOpen: false, status: 'success', message: '' });
    fetchAppointments();
    fetchVouchers(true);
    fetchExpiredVouchers(true);
  };
  
  const handleSaveProfile = async (updatedDetails: { full_name: string; phone: string; email: string }) => {
    try {
      await updateUser(updatedDetails);
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleBookFromVoucher = async (voucher: DetailedVoucher) => {
    const services = voucher.bono_definitions.services;
    if (services && services.length > 0) {
        const service = services[0];
        
        try {
            const { data: skills, error: skillsError } = await supabase
                .from('professional_skills').select('professional_id').eq('service_id', service.id);
            
            if (skillsError) {
                console.error('Error fetching professional skills:', skillsError);
            }
            
            const professionalIds = skillsError ? [] : skills.map(skill => skill.professional_id);
            const serviceWithProfessionals = {
                ...service,
                professionalIds,
                price: 0
            };
            
            setSelectedVoucherService(serviceWithProfessionals);
            setService(serviceWithProfessionals);
            setShowAddServicePrompt(true);
        } catch (error) {
            console.error('Error in handleBookFromVoucher:', error);
            alert('No se ha podido cargar la información del servicio. Por favor, inténtalo de nuevo.');
        }
    }
  };

  const handleConfirmAddService = () => {
    setShowAddServicePrompt(false);
    navigate('/reservar');
  };

  const handleDeclineAddService = () => {
    setShowAddServicePrompt(false);
    navigate('/reservar?skipToStep=2');
  };

  const handleCancelAddService = () => {
    setShowAddServicePrompt(false);
    setSelectedVoucherService(null);
    resetBooking();
  };

  if (!user) {
    return null; 
  }

  return (
    <>
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-secondary tracking-tight">Hola, {user.full_name.split(' ')[0]}</h1>
          <p className="mt-1 text-lg text-light-text">Gestiona tus citas y bonos aquí.</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center space-x-2 text-sm text-gray-600 font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
            >
                <GearIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Ajustes</span>
            </button>
            <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                Cerrar Sesión
            </button>
        </div>
      </div>
      
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`${activeTab === 'appointments' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
          >
            Mis Citas
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            className={`${activeTab === 'vouchers' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
          >
            Mis Bonos
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'appointments' && (
          <div className="space-y-12">
            <AppointmentSection 
              title="Próximas Citas" 
              appointments={upcomingAppointments}
              onEdit={handleEdit}
              onCancel={handleOpenCancelModal}
            />
            <AppointmentSection 
              title="Historial de Citas" 
              appointments={pastAppointments} 
              isPast={true} 
            />
          </div>
        )}
        {activeTab === 'vouchers' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-secondary">Mis Bonos</h2>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                            {vouchers.length} {vouchers.length === 1 ? 'bono activo' : 'bonos activos'} • {expiredVouchers.length} {expiredVouchers.length === 1 ? 'bono agotado' : 'bonos agotados'}
                        </span>
                    </div>
                </div>
                
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Voucher tabs">
                        <button
                            onClick={() => setActiveVoucherTab('active')}
                            className={`${activeVoucherTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                        >
                            Activos ({vouchers.length})
                        </button>
                        <button
                            onClick={() => setActiveVoucherTab('expired')}
                            className={`${activeVoucherTab === 'expired' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                        >
                            Agotados ({expiredVouchers.length})
                        </button>
                    </nav>
                </div>
                
                {activeVoucherTab === 'active' && (
                    <>
                        {isLoadingVouchers ? (
                            <div className="bg-white p-8 rounded-lg text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-4 text-light-text">Cargando tus bonos...</p>
                            </div>
                        ) : vouchers.length === 0 ? (
                            <div className="bg-white p-8 rounded-lg text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-secondary mb-2">No tienes bonos activos</h3>
                                <p className="text-light-text mb-4">Cuando compres bonos, aparecerán aquí para que puedas usarlos en tus reservas.</p>
                                <button onClick={() => navigate('/servicios')} className="bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-light transition-colors">
                                    Ver Servicios
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2">
                                {vouchers.map(voucher => {
                                    const services = voucher.bono_definitions.services;
                                    if (!services || services.length === 0) return null;
                                    
                                    const progressPercentage = (voucher.remaining_sessions / voucher.bono_definitions.total_sessions) * 100;
                                    const isLowSessions = voucher.remaining_sessions <= 2;
                                    
                                    return (
                                        <div key={voucher.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                                            <div className={`px-6 py-4 ${voucher.bono_definitions.type === 'special' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">{voucher.bono_definitions.name}</h3>
                                                        <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold text-white bg-white bg-opacity-20 rounded-full">
                                                            {voucher.bono_definitions.type === 'special' ? 'Especial' : 'Regular'}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-white">{voucher.remaining_sessions}</p>
                                                        <p className="text-xs text-white text-opacity-90">sesiones</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6">
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                        <span>Progreso</span>
                                                        <span>{voucher.remaining_sessions} de {voucher.bono_definitions.total_sessions}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                                isLowSessions ? 'bg-red-500' : 'bg-green-500'
                                                            }`}
                                                            style={{ width: `${progressPercentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-4">
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">Servicios incluidos:</p>
                                                    <div className="space-y-1">
                                                        {services.map((service: Service, index: number) => (
                                                            <div key={index} className="flex items-center text-sm text-gray-600">
                                                                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                {service.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-4">
                                                    <p className="text-xs text-gray-500">
                                                        Comprado el {new Date(voucher.purchase_date).toLocaleDateString('es-ES', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                
                                                {isLowSessions && (
                                                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <div className="flex items-center">
                                                            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            <p className="text-sm text-yellow-800">
                                                                ¡Te quedan pocas sesiones! Considera comprar otro bono.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <button
                                                    onClick={() => handleBookFromVoucher(voucher)}
                                                    className="w-full bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors flex items-center justify-center space-x-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>Reservar Cita</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
                
                {activeVoucherTab === 'expired' && (
                    <>
                        {expiredVouchers.length === 0 ? (
                            <div className="bg-white p-8 rounded-lg text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-secondary mb-2">No tienes bonos agotados</h3>
                                <p className="text-light-text">Los bonos que agotes aparecerán aquí para tu referencia.</p>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2">
                                {expiredVouchers.map(voucher => {
                                    const services = voucher.bono_definitions.services;
                                    if (!services || services.length === 0) return null;
                                    
                                    return (
                                        <div key={voucher.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 opacity-75">
                                            <div className="px-6 py-4 bg-gradient-to-r from-gray-400 to-gray-500">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">{voucher.bono_definitions.name}</h3>
                                                        <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold text-white bg-white bg-opacity-20 rounded-full">
                                                            {voucher.bono_definitions.type === 'special' ? 'Especial' : 'Regular'}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-white">{voucher.remaining_sessions}</p>
                                                        <p className="text-xs text-white text-opacity-90">sesiones</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6">
                                                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                    <div className="flex items-center">
                                                        <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <p className="text-sm text-gray-700 font-semibold">
                                                            Bono agotado
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-4">
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">Servicios incluidos:</p>
                                                    <div className="space-y-1">
                                                        {services.map((service: Service, index: number) => (
                                                            <div key={index} className="flex items-center text-sm text-gray-600">
                                                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                {service.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                <div className="mb-4">
                                                    <p className="text-xs text-gray-500">
                                                        Comprado el {new Date(voucher.purchase_date).toLocaleDateString('es-ES', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Total de sesiones: {voucher.bono_definitions.total_sessions}
                                                    </p>
                                                </div>
                                                
                                                <button
                                                    disabled
                                                    className="w-full bg-gray-300 text-gray-500 px-4 py-3 rounded-lg font-semibold cursor-not-allowed flex items-center justify-center space-x-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span>Bono Agotado</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        )}
      </div>
    </div>
    <CancelConfirmationModal
        isOpen={cancelModalState.isOpen}
        onClose={() => setCancelModalState({ isOpen: false, appointment: null, serviceName: '', professionalName: '' })}
        onConfirm={handleConfirmCancel}
        appointment={cancelModalState.appointment}
        serviceName={cancelModalState.serviceName}
        professionalName={cancelModalState.professionalName}
    />
    <BookingResultModal
        isOpen={resultModalState.isOpen}
        onClose={handleCloseResultModal}
        status={resultModalState.status}
        message={resultModalState.message}
        title={resultModalState.title}
    />
    <SuccessToast
      isOpen={showSuccessToast}
      onClose={() => setShowSuccessToast(false)}
      message="¡Tus datos han sido actualizados con éxito!"
    />
    <AddServicePrompt
      isOpen={showAddServicePrompt}
      onConfirm={handleConfirmAddService}
      onDecline={handleDeclineAddService}
      onCancel={handleCancelAddService}
      selectedServices={selectedVoucherService ? [selectedVoucherService] : []}
    />
    <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        notificationPermission={notificationPermission}
        onSaveProfile={handleSaveProfile}
        onRequestNotifications={requestNotificationPermission}
    />
    </>
  );
};

interface AppointmentSectionProps {
  title: string;
  appointments: DetailedAppointment[];
  isPast?: boolean;
  onEdit?: (appointment: DetailedAppointment) => void;
  onCancel?: (appointment: DetailedAppointment) => void;
}

const AppointmentSection: React.FC<AppointmentSectionProps> = ({ title, appointments, isPast = false, onEdit, onCancel }) => {
    const navigate = useNavigate();
    return (
        <div>
            <h2 className="text-2xl font-bold text-secondary mb-4">{title}</h2>
            {appointments.length > 0 ? (
                 <div className="space-y-4">
                     {appointments.map(appt => {
                         const service = appt.services;
                         const professional = appt.professionals;
                         if (!service || !professional) return null;
                         const statusStyles = {
                             upcoming: 'border-l-blue-400',
                             confirmada: 'border-l-blue-400',
                             Confirmada: 'border-l-blue-400',
                             completed: 'border-l-green-400',
                             Completada: 'border-l-green-400',
                             cancelled: 'border-l-red-400',
                             Cancelada: 'border-l-red-400'
                         };
                         return (
                             <div key={appt.id} className={`bg-white p-5 rounded-lg shadow-md border-l-4 ${statusStyles[appt.status as keyof typeof statusStyles] || 'border-l-gray-300'}`}>
                                 <div className="flex flex-col md:flex-row justify-between">
                                     <div>
                                         <p className="font-bold text-lg text-secondary">{service.name}</p>
                                         <p className="text-light-text">con {professional.full_name}</p>
                                         <p className="text-light-text font-medium">{appt.start.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                         {!isPast && <p className="text-primary font-semibold text-lg mt-1">{appt.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}h</p>}
                                         
                                     </div>
                                     {!isPast && onEdit && onCancel && (
                                         <div className="flex items-center space-x-2 mt-4 md:mt-0">
                                             <button onClick={() => onEdit(appt)} className="text-sm text-gray-600 font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors">Editar</button>
                                             <button onClick={() => onCancel(appt)} className="text-sm text-red-600 font-semibold py-2 px-4 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">Anular</button>
                                         </div>
                                     )}
                                 </div>
                             </div>
                         );
                     })}
                 </div>
            ) : (
                <div className="bg-white p-8 rounded-lg text-center">
                    <p className="text-light-text">No tienes {isPast ? 'citas pasadas' : 'próximas citas'}.</p>
                    {!isPast && <button onClick={() => navigate('/reservar')} className="mt-4 bg-primary text-white px-5 py-2 rounded-lg font-semibold hover:bg-primary-light transition-colors">Reservar una nueva cita</button>}
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
