import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { SettingsProvider } from './context/SettingsContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import BookingPage from './pages/BookingPage';
import ProfilePage from './pages/ProfilePage';
import ContactPage from './pages/ContactPage';

const AppContent: React.FC = () => {
  const location = useLocation();
  const showFooter = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/reservar" element={<BookingPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/contacto" element={<ContactPage />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BookingProvider>
        <SettingsProvider>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </SettingsProvider>
      </BookingProvider>
    </AuthProvider>
  );
};

export default App;
