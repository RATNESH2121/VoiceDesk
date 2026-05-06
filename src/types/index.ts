export type UserRole = 'admin' | 'staff' | 'patient';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  updated_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone_number: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_name: string;
  appointment_time: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  created_at: string;
}

export interface VoiceCall {
  id: string;
  clinic_id: string;
  twilio_call_sid: string;
  from_number: string;
  duration: number | null;
  status: string;
  transcript: string | null;
  intent_detected: string | null;
  created_at: string;
}
