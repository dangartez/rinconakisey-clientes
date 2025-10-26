export interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  duration: number; // in minutes
  price: number;
  professionalIds: string[];
}

export interface Professional {
  id: string;
  full_name: string;
  avatar_url: string;
  specialties: number[]; // Array of service IDs
}

export interface Appointment {
  id: string;
  serviceId: number;
  professionalId: string;
  start: Date;
  end: Date;
  status: 'Confirmada' | 'Completada' | 'Cancelada';
}

export interface Voucher {
  id: string;
  serviceId: number;
  totalSessions: number;
  remainingSessions: number;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  image_url: string;
  original_price: number;
  promo_price: number;
  is_active: boolean;
}

export interface Client {
  id: string; // The new client PK
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string;
  nickname: string | null;
  created_at: string;
  claim_code: string | null;
}

export interface TimeSlot {
  time: string;
  professional_id: string;
}

export interface BusinessHour {
  id: number;
  day_name: string;
  is_open: boolean;
  open_time_1: string | null;
  close_time_1: string | null;
  open_time_2: string | null;
  close_time_2: string | null;
}

export interface BusinessSettings {
  id: number;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  tax_rate: number;
  contact_title: string | null;
  contact_subtitle: string | null;
  contact_description: string | null;
  home_header_image_url: string | null;
  home_header_title: string | null;
  home_header_subtitle: string | null;
  home_featured_services_ids: number[];
  home_footer_slogan: string | null;
  home_footer_copyright: string | null;
  brand_color: string | null;
  theme_mode: string | null;
  default_interval: number;
  min_booking_notice_hours: number;
}
