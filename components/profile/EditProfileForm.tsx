import React, { useState } from 'react';
import { Client } from '../../types';

interface EditProfileFormProps {
  user: Client;
  onSave: (updatedDetails: { full_name: string; phone: string; email: string }) => void;
  onCancel: () => void;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    phone: user.phone,
    email: user.email,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation
    if (!formData.full_name || !formData.phone || !formData.email) {
        alert('Por favor, completa todos los campos.');
        return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-light-text mb-1">Nombre completo</label>
        <input
          type="text"
          name="full_name"
          id="full_name"
          value={formData.full_name}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition"
          required
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-light-text mb-1">Teléfono</label>
        <input
          type="tel"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition"
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-light-text mb-1">Correo electrónico</label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition"
          required
        />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white text-secondary py-2 px-5 rounded-lg font-semibold border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-primary text-white py-2 px-5 rounded-lg font-semibold hover:bg-primary-light transition-colors"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  );
};

export default EditProfileForm;
