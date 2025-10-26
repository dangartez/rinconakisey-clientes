
import React, { useState, useMemo, useEffect } from 'react';
import { Service } from '../types';
import { useBooking } from '../context/BookingContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ServiceConfirmationModal from '../components/booking/ServiceConfirmationModal';

const ServicesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [services, setServices] = useState<Service[]>([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { setService, addService } = useBooking();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      const { data: servicesData, error: servicesError } = await supabase
        .from('v_services')
        .select('*');

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        return;
      }

      // For each service, fetch the professional IDs from the junction table
      const servicesWithProfessionals = await Promise.all(
        servicesData.map(async (service) => {
          const { data: skills, error: skillsError } = await supabase
            .from('professional_skills')
            .select('professional_id')
            .eq('service_id', service.id);

          if (skillsError) {
            console.error(`Error fetching skills for service ${service.id}:`, skillsError);
            return { ...service, professionalIds: [] }; // Return service with empty professionalIds on error
          }

          const professionalIds = skills.map(skill => skill.professional_id);
          return { ...service, professionalIds };
        })
      );

      setServices(servicesWithProfessionals as Service[]);
    };

    fetchServices();
  }, []);

  const categories = useMemo(() => 
    ['Todos', ...new Set(services.map(s => s.category))]
  , [services]);

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesCategory = selectedCategory === 'Todos' || service.category === selectedCategory;
      const matchesSearch = (service.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (service.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, services]);

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowConfirmationModal(true);
  };

  const handleConfirmService = () => {
    if (!selectedService) return;
    
    // Limpiamos cualquier estado previo y establecemos el servicio
    setService(selectedService);
    // Cerramos el modal y navegamos a reservas
    setShowConfirmationModal(false);
    navigate('/reservar');
  };

  const handleDeclineService = () => {
    if (!selectedService) return;
    
    // Limpiamos cualquier estado previo y establecemos el servicio
    setService(selectedService);
    // Cerramos el modal y navegamos directamente al paso 2
    setShowConfirmationModal(false);
    navigate('/reservar?skipToStep=2');
  };

  const handleCancelSelection = () => {
    setShowConfirmationModal(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-secondary tracking-tight">Catálogo de Servicios</h1>
        <p className="mt-2 text-lg text-light-text">Encuentra el tratamiento perfecto para ti.</p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-6">
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
              className={`flex-shrink-0 px-5 py-2 rounded-full font-semibold text-base whitespace-nowrap transition-colors duration-200 border-2 ${
                selectedCategory === category
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-secondary border-gray-300 hover:bg-gray-100 hover:border-gray-400'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>


      {/* Service List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredServices.length > 0 ? (
          filteredServices.map(service => (
            <div key={service.id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col transition-transform transform hover:-translate-y-1">
              <span className="text-sm font-semibold text-primary">{service.category}</span>
              <h3 className="text-2xl font-bold text-secondary mt-1">{service.name}</h3>
              <p className="mt-2 text-light-text flex-grow">{service.description}</p>
              <div className="mt-4 flex justify-between items-center text-lg">
                <span className="font-bold text-secondary">{service.price}€</span>
                <span className="font-medium text-light-text">{service.duration} min</span>
              </div>
              <button 
                onClick={() => handleBookService(service)}
                className="mt-6 w-full bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary-light transition-colors"
              >
                Reservar
              </button>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-light-text text-lg">No se encontraron servicios que coincidan con tu búsqueda.</p>
        )}
      </div>

      {/* Modal de confirmación */}
      <ServiceConfirmationModal
        isOpen={showConfirmationModal}
        service={selectedService}
        onConfirm={handleConfirmService}
        onDecline={handleDeclineService}
        onCancel={handleCancelSelection}
      />
    </div>
  );
};

export default ServicesPage;
