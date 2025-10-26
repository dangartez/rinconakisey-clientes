import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Appointment, Voucher, Service, Professional } from '../types';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import CancelConfirmationModal from '../components/profile/CancelConfirmationModal';
import EditProfileForm from '../components/profile/EditProfileForm';
import { PencilIcon, EnvelopeIcon, PhoneIcon, UserCircleIcon } from '../components/icons';
import SuccessToast from '../components/common/SuccessToast';
import { supabase } from '../lib/supabaseClient';
import BookingResultModal from '../components/booking/BookingResultModal';

// Define a more detailed appointment type for the UI
interface DetailedAppointment extends Appointment {
  services: Service;
  professionals: Professional;
  service_id: number;
  professional_id: number;
  start_time: string;
  end_time: string;
  booking_group_id?: string | null;
}

interface DetailedVoucher extends Voucher {
    bono_definitions: {
        services: Service;
    }
}

type Tab = 'appointments' | 'vouchers';

const ProfilePage: React.FC = () => {
  const { user, isLoggedIn, logout, updateUser, setService } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('appointments');
  const navigate = useNavigate();
  const { setAppointmentToEdit } = useBooking();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  const [appointments, setAppointments] = useState<DetailedAppointment[]>([]);
  const [vouchers, setVouchers] = useState<DetailedVoucher[]>([]);

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

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/');
    } else if (user) {
      fetchAppointments();
      fetchVouchers();
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
      const formattedData = data.map(appt => ({
        ...appt,
        start: new Date(appt.start_time),
        end: new Date(appt.end_time),
      })) as DetailedAppointment[];
      setAppointments(formattedData);
    }
  };

  const fetchVouchers = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('client_bonos')
      .select(`
        *,
        bono_definitions (
          *,
          services (*)
        )
      `)
      .eq('client_id', user.id);

    if (error) {
      console.error('Error fetching vouchers:', error);
    } else {
      setVouchers(data as DetailedVoucher[]);
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
    }
  }, []);

  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the beginning of today

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
      booking_group_id: appointment.booking_group_id,
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
  };
  
  const handleSaveProfile = async (updatedDetails: { full_name: string; phone: string; email: string }) => {
    try {
      await updateUser(updatedDetails);
      setIsEditingProfile(false);
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleBookFromVoucher = (voucher: DetailedVoucher) => {
    const serviceToBook = voucher.bono_definitions.services;
    if (serviceToBook) {
        setService(serviceToBook);
        navigate('/reservar');
    }
  };

  if (!user) {
    return null; 
  }

  const ProfileDetails = (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-secondary">Mis Datos</h2>
            {!isEditingProfile && (
                <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center space-x-2 text-sm text-gray-600 font-semibold py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                    <PencilIcon className="w-4 h-4" />
                    <span>Editar</span>
                </button>
            )}
        </div>
        {isEditingProfile ? (
            <EditProfileForm user={user} onSave={handleSaveProfile} onCancel={() => setIsEditingProfile(false)} />
        ) : (
            <div className="space-y-4 text-secondary">
                 <div className="flex items-center space-x-3">
                    <UserCircleIcon className="w-6 h-6 text-light-text" />
                    <span>{user.full_name}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <PhoneIcon className="w-6 h-6 text-light-text" />
                    <span>{user.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="w-6 h-6 text-light-text" />
                    <span>{user.email}</span>
                </div>
            </div>
        )}
    </div>
  );

  const NotificationSettings = (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold text-secondary mb-4">Recordatorios de Citas</h2>
      {notificationPermission === 'granted' && (
        <p className="text-green-600">Los recordatorios por notificación están activados.</p>
      )}
      {notificationPermission === 'denied' && (
        <div>
          <p className="text-red-600">Has bloqueado las notificaciones.</p>
          <p className="text-sm text-light-text">Para activarlas, debes cambiar los permisos en la configuración de tu navegador.</p>
        </div>
      )}
      {notificationPermission === 'default' && (
        <div>
            <p className="text-light-text mb-4">¿Quieres recibir un recordatorio 24 horas antes de tu cita?</p>
            <button
                onClick={requestNotificationPermission}
                className="bg-secondary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
            >
                Activar Recordatorios
            </button>
        </div>
      )}
    </div>
  );

  return (
    <>
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-secondary tracking-tight">Hola, {user.full_name.split(' ')[0]}</h1>
          <p className="mt-1 text-lg text-light-text">Gestiona tus citas y bonos aquí.</p>
        </div>
        <button onClick={logout} className="mt-4 md:mt-0 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
            Cerrar Sesión
        </button>
      </div>
      
      {ProfileDetails}
      {NotificationSettings}
      
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
                <h2 className="text-2xl font-bold text-secondary">Bonos Activos</h2>
                {vouchers.map(voucher => {
                    const service = voucher.bono_definitions.services;
                    if (!service) return null;
                    return (
                        <div key={voucher.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center">
                            <div>
                                <h3 className="text-xl font-bold text-secondary">{service.name}</h3>
                                <p className="text-primary font-semibold mt-2 text-lg">
                                    Quedan {voucher.remaining_sessions} de {voucher.total_sessions} sesiones
                                </p>
                            </div>
                            <button onClick={() => handleBookFromVoucher(voucher)} className="mt-4 md:mt-0 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-light transition-colors">
                                Reservar Cita
                            </button>
                        </div>
                    );
                })}
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
