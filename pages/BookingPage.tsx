import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBooking } from '../context/BookingContext';
import { Service, Professional, TimeSlot } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/icons';
import { useNavigate } from 'react-router-dom';
import BookingResultModal from '../components/booking/BookingResultModal';
import { useAuth } from '../context/AuthContext';
import LoginOrRegisterPrompt from '../components/auth/LoginOrRegisterPrompt';
import LoginModal from '../components/auth/LoginModal';
import RegisterModal from '../components/auth/RegisterModal';
import { supabase } from '../lib/supabaseClient';

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
    const availableProfessionals = professionals.filter(p => bookingState.service?.professionalIds.includes(p.id));

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
    rangeSlots: any[];
    isLoadingRange: boolean;
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
}

const DateTimeStep: React.FC<DateTimeStepProps> = ({ 
    dateTimeView, setDateTimeView, rangeSlots, isLoadingRange, 
    filterStartTime, setFilterStartTime, filterEndTime, setFilterEndTime,
    weekOffset, setWeekOffset, weekDays, selectedDate, setSelectedDate,
    isLoadingSlots, workSchedule, allSlots, availableSlots,
    handleSelectDateTime
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
                    className={`py-3 px-6 font-semibold text-lg transition-colors ${dateTimeView === 'calendar' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
                >
                    Elige fecha y hora
                </button>
                <button
                    onClick={() => setDateTimeView('byHour')}
                    className={`py-3 px-6 font-semibold text-lg transition-colors ${dateTimeView === 'byHour' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}
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
                                    className={`p-2 rounded-lg text-center transition ${
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
                    <div className="flex items-center justify-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className='flex-1'>
                            <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">Desde las</label>
                            <select id="start-time" value={filterStartTime} onChange={e => setFilterStartTime(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                                {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                        </div>
                        <div className='flex-1'>
                            <label htmlFor="end-time" className="block text-sm font-medium text-gray-700">Hasta las</label>
                            <select id="end-time" value={filterEndTime} onChange={e => setFilterEndTime(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
                                {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto pr-2">
                        {isLoadingRange ? (
                            <div className="text-center p-8">Buscando todas las horas disponibles...</div>
                        ) : Object.keys(groupedSlots).length === 0 ? (
                            <div className="text-center p-8 text-gray-500">No se han encontrado citas disponibles en la franja seleccionada.</div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(groupedSlots).map(([dateString, slots]) => (
                                    <div key={dateString}>
                                        <h3 className="font-bold text-secondary text-lg mb-3">
                                            {new Date(dateString).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </h3>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {slots.map(({ time, professional_id }) => (
                                                <button
                                                    key={time}
                                                    onClick={() => handleSelectDateTime(new Date(dateString), time, professional_id)}
                                                    className="px-4 py-3 rounded-lg font-semibold transition bg-secondary text-white hover:bg-primary"
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
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
    const { service, professional, date, time } = bookingState;

    const handleStartOver = () => {
        resetBooking();
        setCurrentStep(1); 
    };

    const handleCancelEdit = () => {
        resetBooking();
        navigate('/perfil');
    };

    if (!service || !date || !time) return <p>Faltan datos de la reserva.</p>;

    const professionalName = professional?.full_name || 'Cualquier profesional';
    const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    return (
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-secondary mb-6 text-center">
                {isEditMode ? '4. Confirma tu modificación' : '4. Confirma tu reserva'}
            </h2>
            <div className="space-y-4 p-4 bg-light-bg rounded-lg border border-gray-200">
                <div>
                    <h3 className="font-semibold text-sm text-light-text">Servicio</h3>
                    <p className="text-lg text-secondary">{service.name}</p>
                </div>
                    <div>
                    <h3 className="font-semibold text-sm text-light-text">Profesional</h3>
                    <p className="text-lg text-secondary">{professionalName}</p>
                </div>
                <div>
                    <h3 className="font-semibold text-sm text-light-text">Fecha y Hora</h3>
                    <p className="text-lg text-secondary">{formattedDate} a las {time}</p>
                </div>
                    <div>
                    <h3 className="font-semibold text-sm text-light-text">Total</h3>
                    <p className="text-xl font-bold text-primary">{service.price}€</p>
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
    const { bookingState, setService, setProfessional, setDateTime, resetBooking } = useBooking();
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const isEditMode = useMemo(() => !!bookingState.appointmentToEdit, [bookingState.appointmentToEdit]);
    
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
        return matchesCategory && matchesSearch;
        });
    }, [searchTerm, selectedCategory, services]);

    useEffect(() => {
        if (isEditMode) {
            setCurrentStep(3);
        } else if (bookingState.service) {
            setCurrentStep(2);
        } else {
            setCurrentStep(1);
        }
    }, [isEditMode, bookingState.service]);

    useEffect(() => {
        setSelectedDate(bookingState.date || new Date());
    }, [bookingState.date]);

    useEffect(() => {
        if (currentStep !== 3 || !bookingState.service) return;

        if (dateTimeView === 'calendar') {
            const fetchSingleDaySchedule = async () => {
                setIsLoadingSlots(true);
                const dateString = selectedDate.toISOString().split('T')[0];

                if (bookingState.professional) {
                    const { data: scheduleData, error: scheduleError } = await supabase.rpc('get_professional_workday_bounds', { p_professional_id: bookingState.professional.id, p_date: dateString });
                    if (scheduleError || !scheduleData || scheduleData.length === 0) {
                        setWorkSchedule(null);
                    } else {
                        const { earliest_start_time, latest_end_time, is_working } = scheduleData[0];
                        setWorkSchedule({ start_time: earliest_start_time, end_time: latest_end_time, is_working });
                    }
                } else {
                    const { data: boundsData, error: boundsError } = await supabase.rpc('get_service_workday_bounds', { p_service_id: bookingState.service.id, p_date: dateString });
                    if (boundsError || !boundsData || boundsData.length === 0) {
                        setWorkSchedule(null);
                    } else {
                        const { earliest_start_time, latest_end_time } = boundsData[0];
                        setWorkSchedule({ start_time: earliest_start_time, end_time: latest_end_time, is_working: !!earliest_start_time });
                    }
                }

                const { data: slotsData, error: slotsError } = await supabase.rpc('get_available_slots', { p_professional_id: bookingState.professional?.id || null, p_service_id: bookingState.service.id, p_date: dateString });
                if (slotsError) {
                    console.error('Error fetching available slots:', slotsError);
                    setAvailableSlots([]);
                } else {
                    setAvailableSlots(slotsData.map((s: any) => ({ time: s.slot_time.slice(0, 5), professional_id: s.professional_id })));
                }
                
                setIsLoadingSlots(false);
            };
            fetchSingleDaySchedule();

        } else if (dateTimeView === 'byHour') {
            const fetchRangeSlots = async () => {
                setIsLoadingRange(true);
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + 30);

                const { data, error } = await supabase.rpc('get_available_slots_for_range', {
                    p_service_id: bookingState.service!.id,
                    p_professional_id: bookingState.professional?.id || null,
                    p_start_date: startDate.toISOString().split('T')[0],
                    p_end_date: endDate.toISOString().split('T')[0],
                });

                if (error) {
                    console.error("Error fetching range slots:", error);
                    setRangeSlots([]);
                } else {
                    setRangeSlots(data || []);
                }
                setIsLoadingRange(false);
            };
            fetchRangeSlots();
        }

    }, [currentStep, selectedDate, bookingState.professional, bookingState.service, dateTimeView]);

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
        setService(service);
        setCurrentStep(2);
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

        if (!user || !bookingState.service || !bookingState.date || !bookingState.time) return;

        const [hours, minutes] = bookingState.time.split(':').map(Number);
        const start_time = new Date(bookingState.date);
        start_time.setHours(hours, minutes, 0, 0);

        const end_time = new Date(start_time.getTime() + bookingState.service.duration * 60000);

        const appointmentData = {
            client_id: user.id,
            service_id: bookingState.service.id,
            professional_id: bookingState.professional?.id,
            start_time: start_time.toISOString(),
            end_time: end_time.toISOString(),
            status: 'confirmada',
        };

        let error;
        if (isEditMode && bookingState.appointmentToEdit) {
            const { error: updateError } = await supabase.from('appointments').update(appointmentData).eq('id', bookingState.appointmentToEdit.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('appointments').insert(appointmentData);
            error = insertError;
        }

        if (error) {
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
                    setCurrentStep={setCurrentStep} 
                />;
            case 3: 
                return <DateTimeStep 
                    dateTimeView={dateTimeView} 
                    setDateTimeView={setDateTimeView} 
                    rangeSlots={rangeSlots} 
                    isLoadingRange={isLoadingRange} 
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
                    setCurrentStep={setCurrentStep} 
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
        </div>
    );
};

export default BookingPage;