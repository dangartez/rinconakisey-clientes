import React, { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { PhoneIcon, EnvelopeIcon } from '../components/icons';
import { BusinessHour } from '../types';

interface GroupedSchedule {
  label: string;
  schedule: string;
}

const ContactPage: React.FC = () => {
  const { settings, businessHours, loading } = useSettings();

  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time.substring(0, 5); // Formats 'HH:MM:SS' to 'HH:MM'
  };

  const groupedSchedules = useMemo(() => {
    if (!businessHours || businessHours.length === 0) return [];

    const getScheduleString = (day: BusinessHour) => {
      if (!day.is_open) return 'Cerrado';
      const part1 = `${formatTime(day.open_time_1)}-${formatTime(day.close_time_1)}`;
      const part2 = day.open_time_2 ? ` y ${formatTime(day.open_time_2)}-${formatTime(day.close_time_2)}` : '';
      return part1 + part2;
    };

    const result: GroupedSchedule[] = [];
    let currentGroup: { startDay: string; endDay: string; schedule: string; } | null = null;

    businessHours.forEach(day => {
      const scheduleStr = getScheduleString(day);
      if (currentGroup && currentGroup.schedule === scheduleStr) {
        currentGroup.endDay = day.day_name;
      } else {
        if (currentGroup) {
          const label = currentGroup.startDay === currentGroup.endDay
            ? currentGroup.startDay
            : `${currentGroup.startDay} a ${currentGroup.endDay}`;
          result.push({ label, schedule: currentGroup.schedule });
        }
        currentGroup = { startDay: day.day_name, endDay: day.day_name, schedule: scheduleStr };
      }
    });

    if (currentGroup) {
        const label = currentGroup.startDay === currentGroup.endDay
            ? currentGroup.startDay
            : `${currentGroup.startDay} a ${currentGroup.endDay}`;
        result.push({ label, schedule: currentGroup.schedule });
    }

    return result;
  }, [businessHours]);

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-secondary tracking-tight">{settings?.contact_title || 'Contacto y Horario'}</h1>
        <p className="mt-2 text-lg text-light-text">{settings?.contact_subtitle || 'Estamos aquí para ayudarte. ¡Contáctanos!'}</p>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-6 md:p-10 space-y-8">
        {settings?.contact_description && (
            <div>
                <h2 className="text-2xl font-bold text-secondary mb-4">Sobre {settings?.name || 'Nosotros'}</h2>
                <p className="text-light-text leading-relaxed">
                    {settings.contact_description}
                </p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a 
                href={settings?.phone ? `tel:${settings.phone}` : '#'}
                className={`flex items-center justify-center space-x-3 bg-primary text-white px-6 py-4 rounded-lg font-semibold transition-transform transform hover:scale-105 ${!settings?.phone && 'opacity-50 cursor-not-allowed'}`}
            >
                <PhoneIcon className="w-6 h-6" />
                <span>Llamar Ahora</span>
            </a>
            <a 
                href={settings?.email ? `mailto:${settings.email}` : '#'}
                className={`flex items-center justify-center space-x-3 bg-secondary text-white px-6 py-4 rounded-lg font-semibold transition-transform transform hover:scale-105 ${!settings?.email && 'opacity-50 cursor-not-allowed'}`}
            >
                <EnvelopeIcon className="w-6 h-6" />
                <span>Enviar Email</span>
            </a>
        </div>

        <div>
            <h2 className="text-2xl font-bold text-secondary mb-4">Nuestro Horario</h2>
            <ul className="text-light-text space-y-2 border-l-4 border-primary pl-4">
              {groupedSchedules.map((group, index) => (
                <li key={index} className="flex justify-between">
                  <span>{group.label}:</span> 
                  <span className="font-semibold text-secondary">{group.schedule}</span>
                </li>
              ))}
            </ul>
        </div>
        
        {settings?.address && (
            <div>
                <h2 className="text-2xl font-bold text-secondary mb-4">Ubicación</h2>
                <p className="text-light-text">{settings.address}</p>
            </div>
        )}

      </div>
    </div>
  );
};

export default ContactPage;
