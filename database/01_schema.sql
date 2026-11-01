-- ==========================================================
-- MEDQUEUE - SMART HOSPITAL QUEUE MANAGEMENT SYSTEM
-- SUPABASE POSTGRESQL SCHEMA SPECIFICATION
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables in dependency order if recreating
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS simulation_results CASCADE;
DROP TABLE IF EXISTS simulation_sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS queue_events CASCADE;
DROP TABLE IF EXISTS queue_tokens CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. PROFILES TABLE (Extends Supabase auth.users or handles stand-alone user records)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE, -- linked to auth.users if Supabase Auth is active
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'staff', 'admin')),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    date_of_birth DATE,
    blood_group VARCHAR(10),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE, -- e.g., 'CARD', 'PED', 'ORTH', 'GEN'
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Heart',
    floor VARCHAR(20) DEFAULT 'Ground Floor',
    room_number VARCHAR(30) DEFAULT 'Room 101',
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_daily_capacity INTEGER NOT NULL DEFAULT 150,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. DOCTORS TABLE
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    specialization VARCHAR(150) NOT NULL,
    consultation_room VARCHAR(50) NOT NULL,
    qualification VARCHAR(100) DEFAULT 'MBBS, MD',
    experience_years INTEGER DEFAULT 5,
    available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    start_time TIME DEFAULT '09:00:00',
    end_time TIME DEFAULT '17:00:00',
    avg_consultation_minutes INTEGER DEFAULT 12,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. STAFF TABLE
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100) NOT NULL DEFAULT 'Queue Coordinator',
    shift VARCHAR(30) DEFAULT 'Day Shift',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. APPOINTMENTS TABLE
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type VARCHAR(20) NOT NULL DEFAULT 'ONLINE' CHECK (appointment_type IN ('ONLINE', 'WALKIN')),
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    reason TEXT,
    symptoms TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. QUEUE TOKENS TABLE
CREATE TABLE queue_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number VARCHAR(30) NOT NULL UNIQUE, -- e.g., 'CARD-001', 'EMERG-001'
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    priority_level VARCHAR(20) NOT NULL DEFAULT 'STANDARD' CHECK (priority_level IN ('STANDARD', 'PRIORITY', 'EMERGENCY')),
    status VARCHAR(30) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'ABSENT', 'CANCELLED')),
    sequence_number INTEGER NOT NULL,
    scheduling_mode VARCHAR(10) NOT NULL DEFAULT 'FIFO' CHECK (scheduling_mode IN ('FIFO', 'LIFO')),
    room_number VARCHAR(30),
    arrival_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    called_time TIMESTAMPTZ,
    consultation_start_time TIMESTAMPTZ,
    completed_time TIMESTAMPTZ,
    estimated_wait_minutes INTEGER DEFAULT 15,
    skip_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. QUEUE EVENTS TABLE (Audit Trail for queue movements)
CREATE TABLE queue_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID NOT NULL REFERENCES queue_tokens(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('GENERATED', 'CALLED', 'STARTED', 'COMPLETED', 'SKIPPED', 'ABSENT', 'CANCELLED', 'REORDERED', 'PRIORITY_CHANGED')),
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'INFO' CHECK (type IN ('INFO', 'ALERT', 'CALL', 'STATUS_CHANGE', 'APPOINTMENT')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. SIMULATION SESSIONS TABLE
CREATE TABLE simulation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_name VARCHAR(150) NOT NULL,
    arrival_rate NUMERIC(6, 2) NOT NULL DEFAULT 8.00, -- lambda (patients/hour)
    service_rate NUMERIC(6, 2) NOT NULL DEFAULT 10.00, -- mu (patients/hour)
    strategy VARCHAR(20) NOT NULL DEFAULT 'FIFO' CHECK (strategy IN ('FIFO', 'LIFO', 'PRIORITY')),
    total_patients INTEGER NOT NULL DEFAULT 50,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('RUNNING', 'COMPLETED', 'RESET')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. SIMULATION RESULTS TABLE
CREATE TABLE simulation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES simulation_sessions(id) ON DELETE CASCADE,
    traffic_intensity NUMERIC(6, 4) NOT NULL, -- rho = lambda / mu
    idle_probability NUMERIC(6, 4) NOT NULL, -- P0 = 1 - rho
    avg_system_patients NUMERIC(8, 3) NOT NULL, -- L
    avg_queue_length NUMERIC(8, 3) NOT NULL, -- Lq
    avg_system_time NUMERIC(8, 3) NOT NULL, -- W (hours or minutes)
    avg_queue_time NUMERIC(8, 3) NOT NULL, -- Wq (hours or minutes)
    metrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_table VARCHAR(50) NOT NULL,
    target_id VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Create essential indexes for real-time querying performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_doctors_dept ON doctors(department_id);
CREATE INDEX idx_staff_dept ON staff(department_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_dept_date ON appointments(department_id, appointment_date);
CREATE INDEX idx_queue_tokens_dept_status ON queue_tokens(department_id, status);
CREATE INDEX idx_queue_tokens_priority ON queue_tokens(priority_level, arrival_time);
CREATE INDEX idx_queue_tokens_token_num ON queue_tokens(token_number);
CREATE INDEX idx_queue_events_token ON queue_events(token_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
