export type UserRole = 'patient' | 'doctor' | 'staff' | 'admin';

export type PriorityLevel = 'STANDARD' | 'PRIORITY' | 'EMERGENCY';

export type TokenStatus = 
  | 'WAITING' 
  | 'CALLED' 
  | 'IN_CONSULTATION' 
  | 'COMPLETED' 
  | 'SKIPPED' 
  | 'ABSENT' 
  | 'CANCELLED';

export type SchedulingMode = 'FIFO' | 'LIFO';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  blood_group?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string; // e.g. CARD, PED, ORTH, GEN, EMERG
  description: string;
  icon: string;
  floor: string;
  room_number: string;
  is_active: boolean;
  max_daily_capacity: number;
  current_wait_minutes?: number;
  active_token_count?: number;
}

export interface Doctor {
  id: string;
  profile_id: string;
  profile?: UserProfile;
  department_id: string;
  department?: Department;
  specialization: string;
  consultation_room: string;
  qualification: string;
  experience_years: number;
  avg_consultation_minutes: number;
  is_available: boolean;
  current_token?: string;
}

export interface Staff {
  id: string;
  profile_id: string;
  profile?: UserProfile;
  department_id?: string;
  department?: Department;
  designation: string;
  shift: string;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  patient_id: string;
  patient?: UserProfile;
  department_id: string;
  department?: Department;
  doctor_id?: string;
  doctor?: Doctor;
  appointment_date: string;
  appointment_time: string;
  appointment_type: 'ONLINE' | 'WALKIN';
  status: 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  notes?: string;
  created_at: string;
}

export interface QueueToken {
  id: string;
  token_number: string; // e.g. CARD-101
  department_id: string;
  department?: Department;
  patient_id: string;
  patient?: UserProfile;
  doctor_id?: string;
  doctor?: Doctor;
  appointment_id?: string;
  priority_level: PriorityLevel;
  status: TokenStatus;
  sequence_number: number;
  scheduling_mode: SchedulingMode;
  room_number: string;
  arrival_time: string;
  called_time?: string;
  consultation_start_time?: string;
  completed_time?: string;
  estimated_wait_minutes: number;
  skip_reason?: string;
  notes?: string;
  created_at: string;
}

export interface QueueEvent {
  id: string;
  token_id: string;
  token_number: string;
  department_id: string;
  event_type: 'GENERATED' | 'CALLED' | 'STARTED' | 'COMPLETED' | 'SKIPPED' | 'ABSENT' | 'CANCELLED' | 'REORDERED';
  performed_by_name: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'INFO' | 'ALERT' | 'CALL' | 'STATUS_CHANGE';
  is_read: boolean;
  created_at: string;
}

export interface MM1Metrics {
  lambda: number; // arrival rate (patients/hr)
  mu: number; // service rate (patients/hr)
  rho: number; // traffic intensity = lambda / mu
  p0: number; // probability of 0 patients = 1 - rho
  L: number; // avg patients in system
  Lq: number; // avg patients in queue
  W: number; // avg time in system (hours)
  Wq: number; // avg wait time in queue (hours)
  W_minutes: number;
  Wq_minutes: number;
  is_stable: boolean;
}

export interface SimulationPatient {
  id: string;
  token_number: string;
  patient_name: string;
  arrival_minute: number;
  service_duration: number;
  priority: PriorityLevel;
  type: 'ONLINE' | 'WALKIN';
  status: 'WAITING' | 'SERVING' | 'COMPLETED';
  start_minute?: number;
  completed_minute?: number;
  wait_duration?: number;
}

export interface AuditLog {
  id: string;
  user_email: string;
  user_role: string;
  action: string;
  target_table: string;
  target_id?: string;
  details: string;
  timestamp: string;
}
