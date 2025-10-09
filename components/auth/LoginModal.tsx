
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await login(password, email);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
        <h2 className="text-2xl font-bold text-center text-secondary mb-6">Acceso de Cliente</h2>
        
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</p>}

        <div className="space-y-4">
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
            onClick={handleLogin}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105"
          >
            Iniciar Sesión
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

export default LoginModal;
