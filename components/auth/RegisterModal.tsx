
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (fullName && phone && email && password) {
      try {
        await register(password, email, fullName, phone);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Error al registrarse');
      }
    } else {
      setError('Por favor, completa todos los campos.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center text-secondary mb-2">Crea tu Cuenta</h2>
        <p className="text-center text-light-text mb-6">Es rápido y fácil.</p>
        
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</p>}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
          <input
            type="tel"
            placeholder="Número de teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
          <button
            onClick={handleRegister}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105"
          >
            Registrarse
          </button>
        </div>

        <div className="text-center mt-4">
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-secondary">
                Cerrar
            </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
