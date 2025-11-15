import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { Service, Promotion } from '../types';
import { supabase } from '../lib/supabaseClient';
import DuoBookingModal from '../components/booking/DuoBookingModal';
import BookingResultModal from '../components/booking/BookingResultModal'; // To show booking result
import PromotionDetailModal from '../components/promotions/PromotionDetailModal';
import ServiceConfirmationModal from '../components/booking/ServiceConfirmationModal';

const HomePage: React.FC = () => {
    const { addService, resetBooking } = useBooking();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { settings, loading: settingsLoading } = useSettings();

    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for Modals
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [showSvcConfirmModal, setShowSvcConfirmModal] = useState(false);
    const [servicesToBook, setServicesToBook] = useState<Service[] | null>(null);

    // State for Duo Booking Flow
    const [isDuoModalOpen, setIsDuoModalOpen] = useState(false);
    const [selectedDuoService, setSelectedDuoService] = useState<Service | null>(null);
    const [promotionForDuo, setPromotionForDuo] = useState<Promotion | null>(null);
    
    // State for booking result notification
    const [bookingResult, setBookingResult] = useState<{ isOpen: boolean; status: 'success' | 'error'; message: string; }>({ isOpen: false, status: 'success', message: '' });

    useEffect(() => {
        const fetchPageData = async () => {
            if (!settings) return;

            setPageLoading(true);
            try {
                const [promotionsRes, servicesRes] = await Promise.all([
                    supabase.rpc('get_promotions_with_services'),
                    supabase.from('services').select('*').in('id', settings.home_featured_services_ids || [])
                ]);

                if (promotionsRes.error) throw new Error(`Error fetching promotions: ${promotionsRes.error.message}`);
                if (servicesRes.error) throw new Error(`Error fetching featured services: ${servicesRes.error.message}`);

                setPromotions(promotionsRes.data as Promotion[]);
                setServices(servicesRes.data as Service[]);

            } catch (err: any) {
                setError(err.message);
                console.error(err);
            } finally {
                setPageLoading(false);
            }
        };

        if (!settingsLoading) {
            fetchPageData();
        }
    }, [settings, settingsLoading]);

    const handleBookService = (service: Service) => {
        setServicesToBook([service]);
        setShowSvcConfirmModal(true);
    };

    // Step 1: User clicks on a promotion card, open the detail modal
    const handlePromotionClick = (promotion: Promotion) => {
        setSelectedPromotion(promotion);
        setIsPromotionModalOpen(true);
    };


    // Step 2: User clicks "Book" inside the detail modal, this function is called
    const handleBookFromDetail = (promotion: Promotion) => {
        setIsPromotionModalOpen(false); // Close the detail modal first

        const mainService = promotion.services?.[0];
        if (!mainService) {
            alert('Esta promoción no tiene un servicio válido asociado.');
            return;
        }

        const isDuo = mainService.required_professionals > 1;

        if (isDuo) {
            // Open the Duo booking modal
            const serviceWithPromoPrice = { ...mainService, price: promotion.promo_price };
            setSelectedDuoService(serviceWithPromoPrice);
            setPromotionForDuo(promotion);
            setIsDuoModalOpen(true);
        } else {
            // For standard promotions, open the confirmation modal
            const pricePerService = promotion.promo_price / (promotion.services?.length || 1);
            const servicesWithPromoPrice = (promotion.services || []).map(service => ({
                ...service,
                price: pricePerService,
            }));
            setServicesToBook(servicesWithPromoPrice);
            setShowSvcConfirmModal(true);
        }
    };

    const handleConfirmService = () => {
        if (!servicesToBook) return;
        const serviceIds = servicesToBook.map(s => s.id).join(',');
        setShowSvcConfirmModal(false);
        
        let url = `/reservar?serviceIds=${serviceIds}`;
        if (selectedPromotion) {
            url += `&promotion_id=${selectedPromotion.id}`;
        }
        navigate(url);
    };

    const handleDeclineService = () => {
        if (!servicesToBook) return;
        const serviceIds = servicesToBook.map(s => s.id).join(',');
        setShowSvcConfirmModal(false);

        let url = `/reservar?skipToStep=2&serviceIds=${serviceIds}`;
        if (selectedPromotion) {
            url += `&promotion_id=${selectedPromotion.id}`;
        }
        navigate(url);
    };

    const handleCancelSelection = () => {
        setShowSvcConfirmModal(false);
        setServicesToBook(null);
        setSelectedPromotion(null);
    };

    const handleDuoSlotSelected = async (slot: string) => {
        if (!user) {
            setBookingResult({ isOpen: true, status: 'error', message: 'Debes iniciar sesión para reservar.' });
            return;
        }
        if (!selectedDuoService || !promotionForDuo) return;

        setBookingResult({ isOpen: true, status: 'success', message: 'Procesando tu reserva...' });

        const { data, error } = await supabase.rpc('create_duo_appointment_with_promo', {
            p_client_id: user.id,
            p_service_id: selectedDuoService.id,
            p_start_time: slot,
            p_promotion_id: promotionForDuo.id,
            p_final_price: promotionForDuo.promo_price
        });

        if (error || !data || !data[0].success) {
            setBookingResult({ isOpen: true, status: 'error', message: data?.[0]?.message || 'No se pudo crear la cita. Inténtalo de nuevo.' });
        } else {
            setBookingResult({ isOpen: true, status: 'success', message: '¡Tu cita ha sido confirmada! Gracias por tu reserva.' });
        }
    };
    
    const handleCloseResultModal = () => {
        setBookingResult({ isOpen: false, status: 'success', message: '' });
        if (bookingResult.status === 'success') {
            navigate('/perfil');
        }
    };

    const isLoading = settingsLoading || pageLoading;

    if (isLoading) {
        return <div>Cargando...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">Error al cargar la página: {error}</div>;
    }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center text-center text-white bg-gray-500">
        {settings?.home_header_image_url && (
            <img src={settings.home_header_image_url} alt="Cabecera de la página de inicio" className="absolute inset-0 w-full h-full object-cover z-0" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
        <div className="relative z-20 p-4">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">{settings?.home_header_title || 'Tu Momento de Belleza'}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl">
            {settings?.home_header_subtitle || 'Reserva tus tratamientos favoritos de forma rápida y sencilla.'}
          </p>
          <Link to="/reservar" className="mt-8 inline-block bg-primary text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-primary-light transition-transform transform hover:scale-105">
            Reservar Cita Ahora
          </Link>
        </div>
      </section>

      {/* Promotions Section */}
      {promotions.length > 0 && (
        <section className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-secondary mb-8">Promociones Destacadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {promotions.map((promo) => (
              <div 
                key={promo.id} 
                className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={() => handlePromotionClick(promo)}
              >
                  <img src={promo.image_url || 'https://picsum.photos/seed/promo/300/200'} alt={promo.title} className="w-full h-48 object-cover" />
                  <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-2xl font-bold text-secondary">{promo.title}</h3>
                      <p className="mt-2 text-light-text flex-grow">
                        {promo.description.substring(0, 100)}{promo.description.length > 100 ? '...' : ''}
                      </p>
                      <div className="mt-4 flex items-baseline space-x-2">
                          <span className="text-3xl font-bold text-primary">{promo.promo_price}€</span>
                          {promo.original_price && <span className="text-lg text-gray-400 line-through">{promo.original_price}€</span>}
                      </div>
                  </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Popular Services Section */}
      {services.length > 0 && (
        <section className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-secondary mb-8">Nuestros Servicios Populares</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                  <div key={service.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col">
                      <h3 className="text-xl font-bold text-secondary">{service.name}</h3>
                      <p className="mt-2 text-light-text flex-grow">{service.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                          <span className="text-lg font-semibold text-secondary">{service.price}€</span>
                          <span className="text-sm text-gray-500">{service.duration} min</span>
                      </div>
                      <button 
                          onClick={() => handleBookService(service)}
                          className="mt-6 w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-light transition-colors"
                      >
                          Reservar
                      </button>
                  </div>
              ))}
          </div>
          <div className="text-center mt-8">
              <Link to="/servicios" className="text-primary font-semibold hover:underline">
                  Ver todos los servicios
              </Link>
          </div>
        </section>
      )}

      {isDuoModalOpen && (
        <DuoBookingModal
            isOpen={isDuoModalOpen}
            onClose={() => setIsDuoModalOpen(false)}
            service={selectedDuoService}
            promotionContext={promotionForDuo}
            onSlotSelected={handleDuoSlotSelected}
        />
      )}

      <PromotionDetailModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        promotion={selectedPromotion}
        onBook={handleBookFromDetail}
      />

      <BookingResultModal
        isOpen={bookingResult.isOpen}
        status={bookingResult.status}
        message={bookingResult.message}
        onClose={handleCloseResultModal}
      />


      <ServiceConfirmationModal
        isOpen={showSvcConfirmModal}
        services={servicesToBook}
        onConfirm={handleConfirmService}
        onDecline={handleDeclineService}
        onCancel={handleCancelSelection}
      />
    </div>
  );
};

export default HomePage;