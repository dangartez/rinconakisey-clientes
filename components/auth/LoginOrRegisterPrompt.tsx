
import React from 'react';
import { UserCircleIcon } from '../icons';

interface LoginOrRegisterPromptProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginClick: () => void;
    onRegisterClick: () => void;
}

const LoginOrRegisterPrompt: React.FC<LoginOrRegisterPromptProps> = ({ isOpen, onClose, onLoginClick, onRegisterClick }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true"
        >
            <div 
                className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-2xl mx-auto text-center transform transition-all duration-300 animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
            >
                <UserCircleIcon className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-secondary mb-2">Casi hemos terminado</h2>
                <p className="text-light-text mb-6">
                    Para finalizar tu reserva, por favor, inicia sesión o crea una cuenta.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={onLoginClick}
                        className="w-full sm:w-auto bg-primary text-white py-3 px-8 rounded-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105"
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={onRegisterClick}
                        className="w-full sm:w-auto bg-secondary text-white py-3 px-8 rounded-lg font-semibold hover:bg-opacity-90 transition-transform transform hover:scale-105"
                    >
                        Registrarse
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginOrRegisterPrompt;

