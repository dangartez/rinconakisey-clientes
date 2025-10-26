import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBooking } from '../context/BookingContext';
import { Service, Professional, TimeSlot } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, ClockIcon } from '../components/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import BookingResultModal from '../components/booking/BookingResultModal';
import { useAuth } from '../context/AuthContext';
import LoginOrRegisterPrompt from '../components/auth/LoginOrRegisterPrompt';
import LoginModal from '../components/auth/LoginModal';
import RegisterModal from '../components/auth/RegisterModal';
import { supabase } from '../lib/supabaseClient';
import AvailableSlotsModal from '../components/booking/AvailableSlotsModal';

// --- Helper Component for the new flow ---
interface AddServicePromptProps {
    isOpen: boolean;
    onConfirm: () => void;
    onDecline: () => void;
    onCancel: () => void; // Added for the cancel button
    selectedServices: Service[];
}

const AddServicePrompt: React.FC<AddServicePromptProps> = ({ isOpen, onConfirm, onDecline, onCancel, selectedServices }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-sm mx-auto text-center">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-secondary mb-2">Servicios Seleccionados:</h3>
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

interface EditScopePromptProps {
    isOpen: boolean;
    onEditSingle: () => void;
    onEditGroup: () => void;
    onCancel: () => void;
    initialService: Service | null;
    groupServices: Service[];
}

const EditScopePrompt: React.FC<EditScopePromptProps> = ({ isOpen, onEditSingle, onEditGroup, onCancel, initialService, groupServices }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-secondary mb-2">Editar Reserva: {initialService?.name}</h3>
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-secondary text-left mb-1">Servicios en esta reserva:</h4>
                    <ul className="list-disc list-inside text-left text-sm text-light-text">
                        {groupServices.map(s => <li key={s.id}>{s.name}</li>)}
                    </ul>
                </div>
                <p className="text-light-text mb-6">Esta cita forma parte de una reserva con varios servicios. ¿Qué te gustaría cambiar?</p>
                <div className="flex flex-col space-y-3">
                    <button onClick={onEditGroup} className="w-full px-6 py-3 rounded-lg font-semibold bg-primary text-white hover:bg-primary-light transition-colors">
                        La reserva completa
                    </button>
                    <button onClick={onEditSingle} className="w-full px-6 py-3 rounded-lg font-semibold bg-gray-200 text-secondary hover:bg-gray-300 transition-colors">
                        Solo "{initialService?.name}"
                    </button>
                    <button onClick={onCancel} className="w-full text-center text-sm text-gray-500 font-semibold py-2 hover:text-secondary transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Helper Components (Defined outside main component to prevent re-renders) ---

interface StepIndicatorProps {
    currentStep: number;
    setCurrentStep: (step: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, setCurrentStep }) => {
    const steps = ['Servicio', 'Profesional', 'Fecha y Hora', 'Confirmar'];

    const handleStepClick = (stepIndex: number) => {
        // Allow navigation only to previous steps
        if (stepIndex < currentStep -1) {
            setCurrentStep(stepIndex + 1);
        }
    }

    return (
        <div className="flex justify-center items-center space-x-2 md:space-x-4 mb-8">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep - 1;
                const isCurrent = index === currentStep - 1;

                return (
                    <React.Fragment key={index}>
                        <button 
                            onClick={() => handleStepClick(index)}
                            disabled={!isCompleted}
                            className={`flex items-center transition-colors duration-200 ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}>
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold border-2 ${isCurrent ? 'bg-primary text-white border-primary' : isCompleted ? 'bg-white text-primary border-primary hover:bg-primary-light' : 'bg-gray-200 text-gray-500 border-gray-200'}`}>
                                {index + 1}
                            </div>
                            <span className={`ml-2 text-sm md:text-base hidden sm:inline ${isCurrent || isCompleted ? 'text-secondary font-semibold' : 'text-gray-500'}`}>{step}</span>
                        </button>
                        {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200"></div>}
                    </React.Fragment>
                )
            })}
        </div>
    );
};

// --- Step 1: Service Selection ---
interface ServiceStepProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    categories: string[];
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    filteredServices: Service[];
    handleSelectService: (service: Service) => void;
}

const ServiceStep: React.FC<ServiceStepProps> = ({ searchTerm, setSearchTerm, categories, selectedCategory, setSelectedCategory, filteredServices, handleSelectService }) => (
    <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-secondary mb-6 text-center">1. Elige un servicio</h2>
        <div className="mb-6 space-y-4">
            <input
            type="text"
            placeholder="Buscar servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
            />
            <div className="flex space-x-3 overflow-x-auto pb-3 -mx-4 px-4">
                {categories.map(category => (
                    <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors duration-200 border-2 ${
                        selectedCategory === category
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-secondary border-gray-300 hover:bg-gray-100'
                    }`}
                    >
                    {category}
                    </button>
                ))}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map(service => (
                <button key={service.id} onClick={() => handleSelectService(service)} className="bg-white p-4 rounded-lg shadow text-left hover:shadow-lg hover:ring-2 hover:ring-primary transition">
                    <h3 className="font-bold text-secondary">{service.name}</h3>
                    <p className="text-sm text-light-text">{service.duration} min</p>
                    <p className="font-semibold text-primary mt-2">{service.price}€</p>
                </button>
            ))}
        </div>
    </div>
);

// --- Step 2: Professional Selection ---
interface ProfessionalStepProps {
    professionals: Professional[];
    bookingState: any; // Simplified for brevity
    handleSelectProfessional: (professional: Professional | null) => void;
}

const ProfessionalStep: React.FC<ProfessionalStepProps> = ({ professionals, bookingState, handleSelectProfessional }) => {
    const availableProfessionals = useMemo(() => {
        if (!bookingState.services || bookingState.services.length === 0) return [];
        
        // Filter professionals who can perform ALL selected services
        return professionals.filter(prof => 
            bookingState.services.every(service => 
                (service.professionalIds || []).includes(prof.id)
            )
        );
    }, [professionals, bookingState.services]);

    return (
        <div className="max-w-2xl mx-auto relative">
            <h2 className="text-3xl font-bold text-secondary mb-6 text-center">2. Elige un profesional</h2>
            <div className="space-y-4">
                <button onClick={() => handleSelectProfessional(null)} className={`w-full flex items-center p-4 rounded-lg shadow transition-all border-2 ${bookingState.professional === null ? 'bg-primary/10 border-primary' : 'bg-white hover:shadow-lg'}`}>
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center font-bold text-secondary text-xl mr-4">?</div>
                    <div>
                        <h3 className="font-bold text-secondary text-lg">Cualquier Profesional</h3>
                        <p className="text-sm text-light-text">Te asignaremos el primer profesional disponible.</p>
                    </div>
                </button>
                {availableProfessionals.map(prof => (
                    <button key={prof.id} onClick={() => handleSelectProfessional(prof)} className={`w-full flex items-center p-4 rounded-lg shadow transition-all border-2 ${bookingState.professional?.id === prof.id ? 'bg-primary/10 border-primary' : 'bg-white hover:shadow-lg'}`}>
                        <img src={prof.avatar_url} alt={prof.full_name} className="w-16 h-16 rounded-full object-cover mr-4" />
                        <div>
                            <h3 className="font-bold text-secondary text-lg">{prof.full_name}</h3>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};


// --- Step 3: Date & Time Selection ---
interface DateTimeStepProps {
    dateTimeView: 'calendar' | 'byHour';
    setDateTimeView: (view: 'calendar' | 'byHour') => void;
    filterStartTime: string;
    setFilterStartTime: (time: string) => void;
    filterEndTime: string;
    setFilterEndTime: (time: string) => void;
    weekOffset: number;
    setWeekOffset: (offset: number) => void;
    weekDays: Date[];
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    isLoadingSlots: boolean;
    workSchedule: { start_time: string; end_time: string; is_working: boolean } | null;
    allSlots: string[];
    availableSlots: TimeSlot[];
    handleSelectDateTime: (date: Date, time: string, professional_id: string) => void;
    handleSearchByHour: () => void;
}

const DateTimeStep: React.FC<DateTimeStepProps> = ({ 
    dateTimeView, setDateTimeView,
    filterStartTime, setFilterStartTime, filterEndTime, setFilterEndTime,
    weekOffset, setWeekOffset, weekDays, selectedDate, setSelectedDate,
    isLoadingSlots, workSchedule, allSlots, availableSlots,
    handleSelectDateTime, handleSearchByHour
}) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timeOptions = useMemo(() => {
        const options = [];
        for (let i = 8; i < 22; i++) {
            options.push(`${i.toString().padStart(2, '0')}:00`);
            options.push(`${i.toString().padStart(2, '0')}:30`);
        }
        return options;
    }, []);

    const availableSlotMap = useMemo(() => {
        const map = new Map<string, string>();
        availableSlots.forEach(s => map.set(s.time, s.professional_id));
        return map;
    }, [availableSlots]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-4xl mx-auto relative">
            <h2 className="text-3xl font-bold text-secondary mb-6 text-center">3. Elige fecha y hora</h2>
            
            <div className="flex justify-center border-b border-gray-200 mb-6">
                <button
                    onClick={() => setDateTimeView('calendar')}
                    className={`py-3 px-6 font-semibold text-base transition-colors ${dateTimeView === 'calendar' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                >
                    Buscar por días
                </button>
                <button
                    onClick={() => setDateTimeView('byHour')}
                    className={`py-3 px-6 font-semibold text-base transition-colors ${dateTimeView === 'byHour' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                >
                    Buscar por horas
                </button>
            </div>

            {dateTimeView === 'calendar' && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={weekOffset === 0}><ChevronLeftIcon className="w-6 h-6" /></button>
                        <span className="font-semibold text-secondary">
                            {weekDays[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon className="w-6 h-6" /></button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-2 mb-6">
                        {weekDays.map(day => {
                            const isPast = day < today;
                            return (
                                <button 
                                    key={day.toISOString()} 
                                    onClick={() => !isPast && setSelectedDate(day)}
                                    disabled={isPast}
                                    className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-lg text-center transition ${
                                        selectedDate.toDateString() === day.toDateString() 
                                            ? 'bg-primary text-white' 
                                            : isPast 
                                                ? 'text-gray-400 cursor-not-allowed' 
                                                : 'hover:bg-gray-100'
                                    }`}>
                                    <span className="text-xs uppercase">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                    <span className="block font-bold text-lg">{day.getDate()}</span>
                                </button>
                            );
                        })}
                    </div>

                    {isLoadingSlots ? (
                        <div className="text-center p-8">Buscando huecos disponibles...</div>
                    ) : !workSchedule || !workSchedule.is_working ? (
                        <div className="text-center p-8 text-gray-500">No hay citas disponibles para este día.</div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {allSlots.map(slotTime => {
                                const now = new Date();
                                const [hour, minute] = slotTime.split(':').map(Number);
                                const isPast = selectedDate.toDateString() === now.toDateString() && 
                                                (hour < now.getHours() || (hour === now.getHours() && minute < now.getMinutes()));
                                
                                const professionalIdForSlot = availableSlotMap.get(slotTime);
                                const isAvailable = !!professionalIdForSlot;
                                const isDisabled = isPast || !isAvailable;

                                return (
                                    <button 
                                        key={slotTime}
                                        onClick={() => !isDisabled && handleSelectDateTime(selectedDate, slotTime, professionalIdForSlot!)}
                                        disabled={isDisabled}
                                        className={`px-4 py-3 rounded-lg font-semibold transition ${
                                            isDisabled
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-secondary text-white hover:bg-primary'
                                        }`}
                                    >
                                        {slotTime}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {dateTimeView === 'byHour' && (
                <div>
                    <div className="flex flex-col md:flex-row items-center justify-center md:space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className='w-full md:flex-1 mb-4 md:mb-0'>
                            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700 mb-1">Desde las</label>
                            <select id="start-time" value={filterStartTime} onChange={e => setFilterStartTime(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition">
                                {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                        </div>
                        <div className='w-full md:flex-1'>
                            <label htmlFor="end-time" className="block text-sm font-medium text-gray-700 mb-1">Hasta las</label>
                            <select id="end-time" value={filterEndTime} onChange={e => setFilterEndTime(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition">
                                {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={handleSearchByHour}
                        className="w-full bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105"
                    >
                        Buscar Horas Disponibles
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Step 4: Confirmation ---
interface ConfirmationStepProps {
    bookingState: any; // Simplified
    isEditMode: boolean;
    handleFinalConfirmBooking: () => void;
    setCurrentStep: (step: number) => void;
    resetBooking: () => void;
    navigate: (path: string) => void;
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ bookingState, isEditMode, handleFinalConfirmBooking, setCurrentStep, resetBooking, navigate }) => {

    const { services, professional, date, time } = bookingState;



    const handleStartOver = () => {

        resetBooking();

        setCurrentStep(1); 

    };



    const handleCancelEdit = () => {

        resetBooking();

        navigate('/perfil');

    };



    const totalPrice = useMemo(() => services.reduce((acc, s) => acc + parseFloat(s.price), 0), [services]);



    if (services.length === 0 || !date || !time) return <p>Faltan datos de la reserva.</p>;



    const professionalName = professional?.full_name || 'Cualquier profesional';

    const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    

    return (

        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-2xl mx-auto">

            <h2 className="text-3xl font-bold text-secondary mb-6 text-center">

                {isEditMode ? '4. Confirma tu modificación' : '4. Confirma tu reserva'}

            </h2>

            <div className="space-y-4 p-4 bg-light-bg rounded-lg border border-gray-200">

                <div>

                    <h3 className="font-semibold text-sm text-light-text">Servicios</h3>

                    {services.map(s => (

                        <p key={s.id} className="text-lg text-secondary">- {s.name} ({s.price}€)</p>

                    ))}

                </div>

                <div>

                    <h3 className="font-semibold text-sm text-light-text">Profesional</h3>

                    <p className="text-lg text-secondary">{professionalName}</p>

                </div>

                <div>

                    <h3 className="font-semibold text-sm text-light-text">Fecha y Hora de Inicio</h3>

                    <p className="text-lg text-secondary">{formattedDate} a las {time}</p>

                </div>

                <div>

                    <h3 className="font-semibold text-sm text-light-text">Total</h3>

                    <p className="text-xl font-bold text-primary">{totalPrice.toFixed(2)}€</p>

                </div>

            </div>



            <div className="mt-8 flex flex-col gap-4">

                <div className="flex flex-col sm:flex-row gap-4">

                    <button

                        onClick={() => setCurrentStep(3)}

                        className="w-full sm:w-1/2 order-2 sm:order-1 bg-white text-secondary py-3 px-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-100 transition-colors"

                    >

                        {isEditMode ? 'Cambiar Fecha/Hora' : 'Cambiar Hora'}

                    </button>

                    <button

                        onClick={handleFinalConfirmBooking}

                        className="w-full sm:w-1/2 order-1 sm:order-2 bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105"

                    >

                        {isEditMode ? 'Confirmar Modificación' : 'Confirmar Reserva'}

                    </button>

                </div>

                <button

                    onClick={isEditMode ? handleCancelEdit : handleStartOver}

                    className="w-full text-center text-sm text-red-600 font-semibold py-3 px-4 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"

                >

                    {isEditMode ? 'Cancelar Modificación' : 'Anular y empezar de nuevo'}

                </button>

            </div>

        </div>

    );

};





const BookingPage: React.FC = () => {

    const [currentStep, setCurrentStep] = useState(1);

        const { bookingState, addService, setProfessional, setDateTime, resetBooking, setupGroupEdit } = useBooking();

        const { user, isLoggedIn } = useAuth();

        const navigate = useNavigate();
        const location = useLocation();

    

            const [showAddServicePrompt, setShowAddServicePrompt] = useState(false);

    

            const [showEditScopePrompt, setShowEditScopePrompt] = useState(false);

    

                const [fullGroupToEdit, setFullGroupToEdit] = useState<Appointment[] | null>(null);
    const [fullGroupServices, setFullGroupServices] = useState<Service[]>([]);

    

        const isEditMode = useMemo(() => !!bookingState.appointmentsToEdit, [bookingState.appointmentsToEdit]);

    

            useEffect(() => {

    

                const handleEditFlow = async () => {

    

                    if (!isEditMode || !bookingState.appointmentsToEdit) return;

    

        

    

                    const initialAppointment = bookingState.appointmentsToEdit[0];

    

                    if (bookingState.appointmentsToEdit.length > 1) {

    

                        setCurrentStep(3);

    

                        return;

    

                    }

    

        

    

                    const { booking_group_id } = initialAppointment;

    

        

    

                    if (booking_group_id) {

    

                        const { data: groupAppointments, error: groupError } = await supabase

    

                            .from('appointments')

    

                            .select('*')

    

                            .eq('booking_group_id', booking_group_id);

    

                        

    

                        if (groupError || !groupAppointments || groupAppointments.length <= 1) {

    

                            setCurrentStep(3); // Fallback to single edit

    

                            return;

    

                        }

    

        

    

                        const serviceIds = groupAppointments.map(apt => apt.service_id);

    

                        const { data: servicesData, error: servicesError } = await supabase

    

                            .from('v_services')

    

                            .select('*')

    

                            .in('id', serviceIds);

    

        

    

                        if (servicesError || !servicesData) {

    

                            setCurrentStep(3); // Fallback to single edit

    

                            return;

    

                        }

    

                        

    

                        const formattedGroup = groupAppointments.map(apt => ({                        

    

                            ...apt,

    

                            id: apt.id,

    

                            serviceId: apt.service_id,

    

                            professionalId: apt.professional_id,

    

                            start: new Date(apt.start_time),

    

                            end: new Date(apt.end_time),

    

                        }));

    

        

    

                        setFullGroupToEdit(formattedGroup as Appointment[]);

    

                        setFullGroupServices(servicesData as Service[]);

    

                        setShowEditScopePrompt(true);

    

        

    

                    } else {

    

                        setCurrentStep(3);

    

                    }

    

                };

    

        

    

                handleEditFlow();

    

            }, [isEditMode]);

    

            const handleEditSingle = () => {

    

                setShowEditScopePrompt(false);

    

                setCurrentStep(3);

    

            };

    

        

    

            const handleEditGroup = () => {

    

                if (!fullGroupToEdit || fullGroupServices.length === 0) return;

    

                // setupGroupEdit will update the context, triggering the useEffect to advance the step

    

                setupGroupEdit(fullGroupToEdit, fullGroupServices);

    

                setShowEditScopePrompt(false);

    

            };

    

        

    

            const handleCancelEditPrompt = () => {

    

                setShowEditScopePrompt(false);

    

                resetBooking();

    

                navigate('/perfil');

    

            };



    



    



        // --- State for Step 1: Service Selection ---



        const [services, setServices] = useState<Service[]>([]);

    const [searchTerm, setSearchTerm] = useState('');

    const [selectedCategory, setSelectedCategory] = useState('Todos');



    // --- State for Step 2: Professional Selection ---

    const [professionals, setProfessionals] = useState<Professional[]>([]);



    // --- State for Step 3: Date & Time Selection ---

    const [selectedDate, setSelectedDate] = useState(new Date());

    const [weekOffset, setWeekOffset] = useState(0);

    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

    const [workSchedule, setWorkSchedule] = useState<{ start_time: string; end_time: string; is_working: boolean } | null>(null);

    const [allSlots, setAllSlots] = useState<string[]>([]);

    const [dateTimeView, setDateTimeView] = useState<'calendar' | 'byHour'>('calendar');

    const [rangeSlots, setRangeSlots] = useState<any[]>([]);

    const [isLoadingRange, setIsLoadingRange] = useState(false);

    const [filterStartTime, setFilterStartTime] = useState('08:00');

    const [filterEndTime, setFilterEndTime] = useState('21:00');

    const [isSlotsModalOpen, setIsSlotsModalOpen] = useState(false);



    

    const [bookingResult, setBookingResult] = useState<{

        isOpen: boolean;

        status: 'success' | 'error';

        message: string;

    }>({ isOpen: false, status: 'success', message: '' });

    const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);

    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const [isRegisterOpen, setIsRegisterOpen] = useState(false);



    // Fetch services and professionals from Supabase

    useEffect(() => {

        const fetchData = async () => {

            const { data: servicesData, error: servicesError } = await supabase.from('v_services').select('*');

            if (servicesError) console.error('Error fetching services:', servicesError);

            else {

                const servicesWithProfessionals = await Promise.all(

                    servicesData.map(async (service) => {

                        const { data: skills, error: skillsError } = await supabase

                            .from('professional_skills').select('professional_id').eq('service_id', service.id);

                        if (skillsError) return { ...service, professionalIds: [] };

                        const professionalIds = skills.map(skill => skill.professional_id);

                        return { ...service, professionalIds };

                    })

                );

                setServices(servicesWithProfessionals as Service[]);

            }



            const { data: profData, error: profError } = await supabase.from('professionals').select('*');

            if (profError) console.error('Error fetching professionals:', profError);

            else setProfessionals(profData as Professional[]);

        };



        fetchData();

    }, []);



    const categories = useMemo(() => 

        ['Todos', ...new Set(services.map(s => s.category))]

    , [services]);



    const filteredServices = useMemo(() => {

        return services.filter(service => {

            const matchesCategory = selectedCategory === 'Todos' || service.category === selectedCategory;

            const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());

            const isAlreadySelected = bookingState.services.some(s => s.id === service.id);

            return matchesCategory && matchesSearch && !isAlreadySelected;

        });

    }, [searchTerm, selectedCategory, services, bookingState.services]);



    useEffect(() => {

        if (isEditMode) {

            setCurrentStep(3);

        } else if (bookingState.services.length === 0) {

            setCurrentStep(1);

        } else {
            // Check if we should skip to step 2 (from ServicesPage "No" option)
            const urlParams = new URLSearchParams(location.search);
            const skipToStep = urlParams.get('skipToStep');
            if (skipToStep === '2') {
                setCurrentStep(2);
                // Clean the URL parameter
                navigate('/reservar', { replace: true });
            }
        }

    }, [isEditMode, bookingState.services, location.search, navigate]);



    useEffect(() => {

        setSelectedDate(bookingState.date || new Date());

    }, [bookingState.date]);



            useEffect(() => {



                if (currentStep !== 3 || bookingState.services.length === 0 || dateTimeView !== 'calendar') return;



        



                const fetchSingleDaySchedule = async () => {



                    setIsLoadingSlots(true);



                    const dateString = selectedDate.toISOString().split('T')[0];



                    const serviceIds = bookingState.services.map(s => s.id);



                    const appointmentIdsToIgnore = isEditMode ? bookingState.appointmentsToEdit!.map(apt => apt.id) : [];



        



                    // Restore workday bounds logic



                    if (bookingState.professional) {



                        const { data: scheduleData, error: scheduleError } = await supabase.rpc('get_professional_workday_bounds', { p_professional_id: bookingState.professional.id, p_date: dateString });



                        if (scheduleError || !scheduleData || scheduleData.length === 0) {



                            setWorkSchedule(null);



                        } else {



                            const { earliest_start_time, latest_end_time, is_working } = scheduleData[0];



                            setWorkSchedule({ start_time: earliest_start_time, end_time: latest_end_time, is_working });



                        }



                    } else {



                        const { data: boundsData, error: boundsError } = await supabase.rpc('get_service_workday_bounds', { p_service_id: serviceIds[0], p_date: dateString });



                        if (boundsError || !boundsData || boundsData.length === 0) {



                            setWorkSchedule(null);



                        } else {



                            const { earliest_start_time, latest_end_time } = boundsData[0];



                            setWorkSchedule({ start_time: earliest_start_time, end_time: latest_end_time, is_working: !!earliest_start_time });



                        }



                    }



        



                    const { data: slotsData, error: slotsError } = await supabase.rpc('get_available_slots_for_multiple_services', { 



                        p_professional_id: bookingState.professional?.id || null,



                        p_service_ids: serviceIds,



                        p_date: dateString,



                        p_appointment_ids_to_ignore: appointmentIdsToIgnore



                    });



        



                    if (slotsError) {



                        console.error('Error fetching available slots:', slotsError);



                        setAvailableSlots([]);



                    } else {



                        setAvailableSlots(slotsData.map((s: any) => ({ time: s.slot_time.slice(0, 5), professional_id: s.professional_id })));



                    }



                    



                    setIsLoadingSlots(false);



                };



                fetchSingleDaySchedule();



        



            }, [currentStep, selectedDate, bookingState.professional, bookingState.services, dateTimeView, isEditMode]);



        



            const handleSearchByHour = async () => {



                if (bookingState.services.length === 0) return;



                setIsLoadingRange(true);



                setIsSlotsModalOpen(true);



                const startDate = new Date();



                const endDate = new Date();



                endDate.setDate(startDate.getDate() + 30); // Search for the next 30 days



                const serviceIds = bookingState.services.map(s => s.id);



                const appointmentIdsToIgnore = isEditMode ? bookingState.appointmentsToEdit!.map(apt => apt.id) : [];



        



                const { data, error } = await supabase.rpc('get_available_slots_for_multiple_services_for_range', {



                    p_service_ids: serviceIds,



                    p_professional_id: bookingState.professional?.id || null,



                    p_start_date: startDate.toISOString().split('T')[0],



                    p_end_date: endDate.toISOString().split('T')[0],



                    p_appointment_ids_to_ignore: appointmentIdsToIgnore



                });



        



                if (error) {



                    console.error("Error fetching range slots:", error);



                    setRangeSlots([]);



                } else {



                    setRangeSlots(data || []);



                }



                setIsLoadingRange(false);



            };



    const groupedSlots = useMemo(() => {

        const groups: { [key: string]: { time: string; professional_id: string }[] } = {};

        if (!rangeSlots) return {};

        

        const filtered = rangeSlots.filter(slot => {

            const slotTime = new Date(slot.slot_timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            return slotTime >= filterStartTime && slotTime <= filterEndTime;

        });



        filtered.forEach(slot => {

            const date = new Date(slot.slot_timestamp);

            const dateString = date.toISOString().split('T')[0];

            if (!groups[dateString]) {

                groups[dateString] = [];

            }

            groups[dateString].push({

                time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),

                professional_id: slot.professional_id

            });

        });

        

        const sortedKeys = Object.keys(groups).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        const sortedGroups: { [key: string]: { time: string; professional_id: string }[] } = {};

        for (const key of sortedKeys) {

            sortedGroups[key] = groups[key];

        }

        return sortedGroups;

    }, [rangeSlots, filterStartTime, filterEndTime]);



    useEffect(() => {

        if (!workSchedule || !workSchedule.is_working) {

            setAllSlots([]);

            return;

        }

        const all = [];

        const { start_time, end_time } = workSchedule;

        let current = new Date(`${selectedDate.toISOString().split('T')[0]}T${start_time}`);

        const end = new Date(`${selectedDate.toISOString().split('T')[0]}T${end_time}`);

        while (current < end) {

            all.push(current.toTimeString().slice(0, 5));

            current.setMinutes(current.getMinutes() + 15);

        }

        setAllSlots(all);

    }, [workSchedule, selectedDate]);



            const handleSelectService = (service: Service) => {



                addService(service);



                // Always show the modal after selecting a service

                setShowAddServicePrompt(true);



            };



    const handleConfirmAddService = () => {

        setShowAddServicePrompt(false);

        // User stays on Step 1 to select another service

    };



    const handleDeclineAddService = () => {

        setShowAddServicePrompt(false);

        setCurrentStep(2);

    };

    const handleCancelAddService = () => {
        setShowAddServicePrompt(false);
        resetBooking(); // Reset the booking state to clear selected services
    };



    const handleSelectProfessional = (professional: Professional | null) => {

        setProfessional(professional);

        setCurrentStep(3);

    };



    const handleSelectDateTime = (date: Date, time: string, professional_id: string) => {

        if (!bookingState.professional) {

            const assignedProfessional = professionals.find(p => p.id === professional_id);

            if(assignedProfessional) setProfessional(assignedProfessional);

        }

        setDateTime(date, time);

        setCurrentStep(4);

    };



        const handleFinalConfirmBooking = async () => {



            if (!isLoggedIn) {



                setIsAuthPromptOpen(true);



                return;



            }



    



            if (!user || bookingState.services.length === 0 || !bookingState.date || !bookingState.time) return;



    



            const [startHours, startMinutes] = bookingState.time.split(':').map(Number);



            const newInitialStartTime = new Date(bookingState.date);



            newInitialStartTime.setHours(startHours, startMinutes, 0, 0);



    



            let error: any = null;



    



            if (isEditMode) {



                // --- EDIT LOGIC ---



                const appointmentsToEdit = bookingState.appointmentsToEdit!;



    



                if (appointmentsToEdit.length === 1) {



                    // SCENARIO: Editing a single appointment



                    const originalAppointment = appointmentsToEdit[0];



                    const service = bookingState.services[0];



                    const newEndTime = new Date(newInitialStartTime.getTime() + service.duration * 60000);



    



                    const { error: updateError } = await supabase.from('appointments').update({



                        start_time: newInitialStartTime.toISOString(),



                        end_time: newEndTime.toISOString(),



                        professional_id: bookingState.professional!.id,



                        booking_group_id: null // Break from group if it was part of one



                    }).eq('id', originalAppointment.id);



                    error = updateError;



    



                } else {



                    // SCENARIO: Editing a whole group



                    let runningTime = new Date(newInitialStartTime);



                    const updatePromises = bookingState.services.map(service => {



                        const correspondingOrigApt = appointmentsToEdit.find(apt => apt.serviceId === service.id);



                        if (!correspondingOrigApt) return Promise.reject('Mismatch in services and appointments');



    



                        const endTime = new Date(runningTime.getTime() + service.duration * 60000);



                        const promise = supabase.from('appointments').update({



                            start_time: runningTime.toISOString(),



                            end_time: endTime.toISOString(),



                            professional_id: bookingState.professional!.id,



                        }).eq('id', correspondingOrigApt.id);



                        runningTime = endTime; // Update running time for the next service



                        return promise;



                    });



    



                    try {



                        const results = await Promise.all(updatePromises);



                        const firstErrorResult = results.find(res => res.error);



                        if (firstErrorResult) error = firstErrorResult.error;



                    } catch (e) {



                        error = e;



                    }



                }



    



            } else {



                // --- CREATE LOGIC ---



                const newAppointments = [];



                let runningTime = new Date(newInitialStartTime);



                const groupId = bookingState.services.length > 1 ? crypto.randomUUID() : null;



    



                for (const service of bookingState.services) {



                    const endTime = new Date(runningTime.getTime() + service.duration * 60000);



                    const appointmentData: any = {



                        client_id: user.id,



                        service_id: service.id,



                        professional_id: bookingState.professional!.id,



                        start_time: runningTime.toISOString(),



                        end_time: endTime.toISOString(),



                        status: 'Confirmada',



                    };



    



                    if (groupId) {



                        appointmentData.booking_group_id = groupId;



                    }



                    newAppointments.push(appointmentData);



                    runningTime = endTime;



                }



                const { error: insertError } = await supabase.from('appointments').insert(newAppointments);



                error = insertError;



            }



    



            if (error) {



                console.error("Error processing booking:", error);



                setBookingResult({ isOpen: true, status: 'error', message: 'Error de conexión: No hemos podido procesar tu solicitud. Por favor, inténtalo de nuevo.' });



            } else {



                setBookingResult({ isOpen: true, status: 'success', message: isEditMode ? 'Tu cita ha sido modificada correctamente.' : 'Tu cita ha sido confirmada correctamente. ¡Te esperamos!' });



            }



        };
    
    const handleCloseResultModal = () => {
        const status = bookingResult.status;
        setBookingResult({ isOpen: false, status: 'success', message: '' });
        if (status === 'success') {
            resetBooking();
            navigate('/perfil');
        }
    };

    const handlePromptLoginClick = () => {
        setIsAuthPromptOpen(false);
        setIsLoginOpen(true);
    };

    const handlePromptRegisterClick = () => {
        setIsAuthPromptOpen(false);
        setIsRegisterOpen(true);
    };

    const weekDays = useMemo(() => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1 + (weekOffset * 7));
        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            return date;
        });
    }, [weekOffset]);

    const renderStep = () => {
        switch (currentStep) {
            case 1: 
                return <ServiceStep 
                    searchTerm={searchTerm} 
                    setSearchTerm={setSearchTerm} 
                    categories={categories} 
                    selectedCategory={selectedCategory} 
                    setSelectedCategory={setSelectedCategory} 
                    filteredServices={filteredServices} 
                    handleSelectService={handleSelectService} 
                />;
            case 2: 
                return <ProfessionalStep 
                    professionals={professionals} 
                    bookingState={bookingState} 
                    handleSelectProfessional={handleSelectProfessional} 
                />;
            case 3: 
                return <DateTimeStep 
                    dateTimeView={dateTimeView} 
                    setDateTimeView={setDateTimeView} 
                    filterStartTime={filterStartTime} 
                    setFilterStartTime={setFilterStartTime} 
                    filterEndTime={filterEndTime} 
                    setFilterEndTime={setFilterEndTime} 
                    weekOffset={weekOffset} 
                    setWeekOffset={setWeekOffset} 
                    weekDays={weekDays} 
                    selectedDate={selectedDate} 
                    setSelectedDate={setSelectedDate} 
                    isLoadingSlots={isLoadingSlots} 
                    workSchedule={workSchedule} 
                    allSlots={allSlots} 
                    availableSlots={availableSlots} 
                    handleSelectDateTime={handleSelectDateTime} 
                    handleSearchByHour={handleSearchByHour}
                />;
            case 4: 
                return <ConfirmationStep 
                    bookingState={bookingState} 
                    isEditMode={isEditMode} 
                    handleFinalConfirmBooking={handleFinalConfirmBooking} 
                    setCurrentStep={setCurrentStep} 
                    resetBooking={resetBooking} 
                    navigate={navigate} 
                />;
            default: 
                return <p>Paso desconocido</p>;
        }
    };
    
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold text-secondary tracking-tight text-center mb-4">
                     {isEditMode ? 'Modificar Cita' : 'Reservar una Cita'}
                </h1>
                 <p className="text-center text-lg text-light-text mb-8">
                    {isEditMode 
                        ? 'Selecciona una nueva fecha u hora para tu cita.' 
                        : 'Sigue los pasos para reservar tu tratamiento. Puedes volver a un paso anterior haciendo clic en él.'
                    }
                </p>
                {!isEditMode && <StepIndicator currentStep={currentStep} setCurrentStep={setCurrentStep} />}
                <div className="mt-8">{renderStep()}</div>
            </div>
            <BookingResultModal 
                isOpen={bookingResult.isOpen}
                onClose={handleCloseResultModal}
                status={bookingResult.status}
                message={bookingResult.message}
            />
            <LoginOrRegisterPrompt 
                isOpen={isAuthPromptOpen}
                onClose={() => setIsAuthPromptOpen(false)}
                onLoginClick={handlePromptLoginClick}
                onRegisterClick={handlePromptRegisterClick}
            />
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
            <AvailableSlotsModal
                isOpen={isSlotsModalOpen}
                onClose={() => setIsSlotsModalOpen(false)}
                groupedSlots={groupedSlots}
                handleSelectDateTime={handleSelectDateTime}
                isLoading={isLoadingRange}
            />
            <AddServicePrompt
                isOpen={showAddServicePrompt}
                onConfirm={handleConfirmAddService}
                onDecline={handleDeclineAddService}
                onCancel={handleCancelAddService} // Wire up the new cancel handler
                selectedServices={bookingState.services}
            />
            <EditScopePrompt
                isOpen={showEditScopePrompt}
                onEditSingle={handleEditSingle}
                onEditGroup={handleEditGroup}
                onCancel={handleCancelEditPrompt}
                initialService={bookingState.services[0]}
                groupServices={fullGroupServices}
            />
        </div>
    );
};

export default BookingPage;