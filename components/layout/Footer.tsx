import React, { useMemo } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { BusinessHour } from '../../types';

interface GroupedSchedule {
  label: string;
  schedule: string;
}

const Footer: React.FC = () => {
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
    return (
        <footer className="bg-secondary text-white mt-16 pb-24 md:pb-0">
            <div className="container mx-auto px-6 py-8 text-center">
                <p>Cargando...</p>
            </div>
        </footer>
    );
  }

  return (
    <footer className="bg-secondary text-white mt-16 pb-24 md:pb-0">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold">{settings?.name || 'El Rincón de Akisey'}</h3>
            <p className="mt-2 text-gray-400">{settings?.home_footer_slogan || 'Tu oasis de bienestar y belleza.'}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold">Contacto</h4>
            <ul className="mt-2 space-y-1 text-gray-400">
              {settings?.address && <li><p>{settings.address}</p></li>}
              {settings?.phone && <li><p>{settings.phone}</p></li>}
              {settings?.email && <li><p>{settings.email}</p></li>}
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold">Horario</h4>
            <ul className="mt-2 space-y-1 text-gray-400">
              {groupedSchedules.map((group, index) => (
                <li key={index}>
                  <p>
                    <span className="font-semibold">{group.label}:</span> {group.schedule}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-4 text-center text-gray-500 text-sm">
          <p>{settings?.home_footer_copyright || `© ${new Date().getFullYear()} ${settings?.name || 'El Rincón de Akisey'}. Todos los derechos reservados.`}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;