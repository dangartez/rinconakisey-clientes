
import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import EditProfileForm from './EditProfileForm';
import { PencilIcon, EnvelopeIcon, PhoneIcon, UserCircleIcon } from '../icons';

type Tab = 'datos' | 'recordatorios';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  notificationPermission: NotificationPermission;
  onSaveProfile: (updatedDetails: { full_name: string; phone: string; email: string }) => Promise<void>;
  onRequestNotifications: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  notificationPermission,
  onSaveProfile,
  onRequestNotifications,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('datos');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (updatedDetails: { full_name: string; phone: string; email: string }) => {
    await onSaveProfile(updatedDetails);
    setIsEditingProfile(false);
  };

  const ProfileDetailsView = (
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
  );

  const NotificationSettingsView = (
    <div>
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
            onClick={onRequestNotifications}
            className="bg-secondary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
          >
            Activar Recordatorios
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-transform duration-300 scale-95 hover:scale-100">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-secondary">Ajustes</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">&times;</button>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('datos')}
              className={`${
                activeTab === 'datos'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-base transition-colors`}
            >
              Mis Datos
            </button>
            <button
              onClick={() => setActiveTab('recordatorios')}
              className={`${
                activeTab === 'recordatorios'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-base transition-colors`}
            >
              Recordatorios
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'datos' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-secondary">Detalles del Perfil</h3>
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
                ProfileDetailsView
              )}
            </div>
          )}

          {activeTab === 'recordatorios' && (
            <div>
              <h3 className="text-xl font-bold text-secondary mb-4">Recordatorios de Citas</h3>
              {NotificationSettingsView}
            </div>
          )}
        </div>
        
        <div className="p-6 bg-gray-50 rounded-b-2xl text-right">
            <button onClick={onClose} className="bg-gray-200 text-secondary px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
