import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon, SparklesIcon, CalendarIcon, UserCircleIcon, PhoneIcon } from '../icons';
import LoginModal from '../auth/LoginModal';

const Navbar: React.FC = () => {
    const { isLoggedIn } = useAuth();
    const [isLoginModalOpen, setLoginModalOpen] = useState(false);

    const activeLinkStyle = {
        color: '#E11D48',
        borderColor: '#E11D48'
    };

    const linkClasses = "flex flex-col items-center justify-center text-center text-gray-500 hover:text-primary transition-colors duration-200 px-2";
    const activeLinkClasses = "flex flex-col items-center justify-center text-center text-primary transition-colors duration-200 px-2";

    return (
        <>
            <header className="bg-white z-50 shadow-md">
                <nav className="container mx-auto px-4 h-20 flex justify-between items-center">
                    <NavLink to="/" className="text-3xl font-bold text-secondary">
                        El Rincón de<span className="text-primary"> Akisey</span>
                    </NavLink>
                    <div className="hidden md:flex items-center space-x-8">
                         <NavLink to="/" className={({ isActive }) => isActive ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'}>Inicio</NavLink>
                         <NavLink to="/servicios" className={({ isActive }) => isActive ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'}>Servicios</NavLink>
                         <NavLink to="/reservar" className={({ isActive }) => isActive ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'}>Reservar</NavLink>
                         <NavLink to="/contacto" className={({ isActive }) => isActive ? 'text-primary font-semibold' : 'text-gray-600 hover:text-primary'}>Contacto</NavLink>
                    </div>
                    {isLoggedIn ? (
                         <NavLink to="/perfil" className="hidden md:flex items-center space-x-2 text-green-600 hover:text-green-700">
                             <UserCircleIcon className="w-6 h-6 text-green-600" />
                             <span>Mi Perfil</span>
                         </NavLink>
                    ) : (
                         <button onClick={() => setLoginModalOpen(true)} className="hidden md:block bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-light transition-colors">
                             Iniciar Sesión
                         </button>
                    )}
                </nav>
            </header>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] h-20 z-40">
                <div className="flex justify-around items-center h-full">
                     <NavLink to="/" className={({ isActive }) => isActive ? activeLinkClasses : linkClasses}>
                        <HomeIcon className="w-7 h-7 mb-1" />
                        <span className="text-xs">Inicio</span>
                    </NavLink>
                     <NavLink to="/servicios" className={({ isActive }) => isActive ? activeLinkClasses : linkClasses}>
                        <SparklesIcon className="w-7 h-7 mb-1" />
                        <span className="text-xs">Servicios</span>
                    </NavLink>
                     <NavLink to="/reservar" className={({ isActive }) => isActive ? activeLinkClasses : linkClasses}>
                        <CalendarIcon className="w-7 h-7 mb-1" />
                        <span className="text-xs">Reservar</span>
                    </NavLink>
                    <NavLink to="/contacto" className={({ isActive }) => isActive ? activeLinkClasses : linkClasses}>
                        <PhoneIcon className="w-7 h-7 mb-1" />
                        <span className="text-xs">Contacto</span>
                    </NavLink>
                    {isLoggedIn ? (
                         <NavLink to="/perfil" className={({ isActive }) => isActive ? activeLinkClasses : linkClasses}>
                            <UserCircleIcon className="w-7 h-7 mb-1 text-green-600" />
                            <span className="text-xs text-green-600">Perfil</span>
                        </NavLink>
                    ) : (
                        <button onClick={() => setLoginModalOpen(true)} className={linkClasses}>
                            <UserCircleIcon className="w-7 h-7 mb-1" />
                            <span className="text-xs">Acceder</span>
                        </button>
                    )}
                </div>
            </nav>

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
        </>
    );
};

export default Navbar;
