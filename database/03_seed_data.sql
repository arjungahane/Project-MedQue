-- ==========================================================
-- MEDQUEUE - SEED DATA FOR DEMO & INITIAL SETUP
-- ==========================================================

-- Clean existing data
TRUNCATE audit_logs, simulation_results, simulation_sessions, notifications, 
         queue_events, queue_tokens, appointments, staff, doctors, departments, profiles CASCADE;

-- 1. SEED PROFILES
INSERT INTO profiles (id, email, full_name, phone, role, gender, blood_group) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@medqueue.health', 'Dr. Arthur Vance (Chief Admin)', '+1-555-0100', 'admin', 'male', 'O+'),
('22222222-2222-2222-2222-222222222222', 'doctor.sarah@medqueue.health', 'Dr. Sarah Mitchell', '+1-555-0101', 'doctor', 'female', 'A+'),
('22222222-2222-2222-2222-222222222223', 'doctor.raj@medqueue.health', 'Dr. Raj Patel', '+1-555-0102', 'doctor', 'male', 'B+'),
('22222222-2222-2222-2222-222222222224', 'doctor.elena@medqueue.health', 'Dr. Elena Rostova', '+1-555-0103', 'doctor', 'female', 'O-'),
('33333333-3333-3333-3333-333333333333', 'staff@medqueue.health', 'Nurse James Wilson', '+1-555-0200', 'staff', 'male', 'AB+'),
('33333333-3333-3333-3333-333333333334', 'staff.priya@medqueue.health', 'Coordinator Priya Sharma', '+1-555-0201', 'staff', 'female', 'B+'),
('44444444-4444-4444-4444-444444444441', 'patient@medqueue.health', 'Johnathan Doe', '+1-555-0301', 'patient', 'male', 'O+'),
('44444444-4444-4444-4444-444444444442', 'emily.rose@gmail.com', 'Emily Rose', '+1-555-0302', 'patient', 'female', 'A-'),
('44444444-4444-4444-4444-444444444443', 'michael.chang@gmail.com', 'Michael Chang', '+1-555-0303', 'patient', 'male', 'B+'),
('44444444-4444-4444-4444-444444444444', 'amara.okafor@gmail.com', 'Amara Okafor', '+1-555-0304', 'patient', 'female', 'AB-'),
('44444444-4444-4444-4444-444444444445', 'robert.taylor@gmail.com', 'Robert Taylor', '+1-555-0305', 'patient', 'male', 'O+');

-- 2. SEED DEPARTMENTS
INSERT INTO departments (id, name, code, description, icon, floor, room_number, max_daily_capacity) VALUES
('aaaa1111-1111-1111-1111-111111111111', 'Cardiology', 'CARD', 'Comprehensive heart and cardiovascular disease diagnosis and care.', 'HeartPulse', '2nd Floor, Wing A', 'Room 204', 120),
('aaaa2222-2222-2222-2222-222222222222', 'Pediatrics', 'PED', 'Specialized medical care and wellness for infants, children, and teens.', 'Baby', '1st Floor, Wing B', 'Room 112', 150),
('aaaa3333-3333-3333-3333-333333333333', 'Orthopedics', 'ORTH', 'Bone, joint, spine, and musculoskeletal injury treatments.', 'Bone', '3rd Floor, Wing C', 'Room 305', 100),
('aaaa4444-4444-4444-4444-444444444444', 'General Medicine', 'GEN', 'Primary care, diagnostic assessments, and chronic disease management.', 'Stethoscope', 'Ground Floor, Wing A', 'Room 102', 200),
('aaaa5555-5555-5555-5555-555555555555', 'Emergency Triage', 'EMERG', 'Critical urgent care, resuscitation, and rapid clinical evaluation.', 'AlertCircle', 'Ground Floor, ER Bay', 'ER-01', 300);

-- 3. SEED DOCTORS
INSERT INTO doctors (id, profile_id, department_id, specialization, consultation_room, qualification, experience_years, avg_consultation_minutes) VALUES
('dddd1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111', 'Interventional Cardiology', 'Room 204', 'MD, FACC', 14, 12),
('dddd2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222223', 'aaaa2222-2222-2222-2222-222222222222', 'General Pediatrics & Neonatology', 'Room 112', 'MD (Peds), FAAP', 9, 10),
('dddd3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222224', 'aaaa4444-4444-4444-4444-444444444444', 'Internal Medicine & Geriatrics', 'Room 102', 'MD, FACP', 12, 15);

-- 4. SEED STAFF
INSERT INTO staff (id, profile_id, department_id, designation, shift) VALUES
('ssss1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111', 'Senior Triage Nurse', 'Morning 08:00 - 16:00'),
('ssss2222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333334', 'aaaa2222-2222-2222-2222-222222222222', 'Queue Coordinator', 'Evening 12:00 - 20:00');

-- 5. SEED APPOINTMENTS
INSERT INTO appointments (id, patient_id, department_id, doctor_id, appointment_date, appointment_time, appointment_type, status, reason) VALUES
('bbbb1111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444441', 'aaaa1111-1111-1111-1111-111111111111', 'dddd1111-1111-1111-1111-111111111111', CURRENT_DATE, '09:30:00', 'ONLINE', 'CHECKED_IN', 'Follow-up ECG and blood pressure review'),
('bbbb2222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444442', 'aaaa1111-1111-1111-1111-111111111111', 'dddd1111-1111-1111-1111-111111111111', CURRENT_DATE, '10:00:00', 'ONLINE', 'CHECKED_IN', 'Mild chest tightness during exercise'),
('bbbb3333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444443', 'aaaa2222-2222-2222-2222-222222222222', 'dddd2222-2222-2222-2222-222222222222', CURRENT_DATE, '10:30:00', 'WALKIN', 'CHECKED_IN', 'Persistent childhood cough and seasonal fever');

-- 6. SEED QUEUE TOKENS
INSERT INTO queue_tokens (id, token_number, department_id, patient_id, doctor_id, appointment_id, priority_level, status, sequence_number, scheduling_mode, room_number, arrival_time, called_time, estimated_wait_minutes) VALUES
('qqqq1111-1111-1111-1111-111111111111', 'CARD-101', 'aaaa1111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444441', 'dddd1111-1111-1111-1111-111111111111', 'bbbb1111-1111-1111-1111-111111111111', 'STANDARD', 'IN_CONSULTATION', 1, 'FIFO', 'Room 204', timezone('utc', now()) - interval '45 minutes', timezone('utc', now()) - interval '8 minutes', 0),
('qqqq2222-2222-2222-2222-222222222222', 'CARD-102', 'aaaa1111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444442', 'dddd1111-1111-1111-1111-111111111111', 'bbbb2222-2222-2222-2222-222222222222', 'PRIORITY', 'CALLED', 2, 'FIFO', 'Room 204', timezone('utc', now()) - interval '30 minutes', timezone('utc', now()) - interval '1 minute', 5),
('qqqq3333-3333-3333-3333-333333333333', 'CARD-103', 'aaaa1111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'dddd1111-1111-1111-1111-111111111111', NULL, 'STANDARD', 'WAITING', 3, 'FIFO', 'Room 204', timezone('utc', now()) - interval '20 minutes', NULL, 15),
('qqqq4444-4444-4444-4444-444444444444', 'PED-101', 'aaaa2222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443', 'dddd2222-2222-2222-2222-222222222222', 'bbbb3333-3333-3333-3333-333333333333', 'STANDARD', 'IN_CONSULTATION', 1, 'FIFO', 'Room 112', timezone('utc', now()) - interval '35 minutes', timezone('utc', now()) - interval '5 minutes', 0),
('qqqq5555-5555-5555-5555-555555555555', 'PED-102', 'aaaa2222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444445', 'dddd2222-2222-2222-2222-222222222222', NULL, 'STANDARD', 'WAITING', 2, 'FIFO', 'Room 112', timezone('utc', now()) - interval '10 minutes', NULL, 12);

-- 7. SEED NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, type) VALUES
('44444444-4444-4444-4444-444444444441', 'Consultation Started', 'Dr. Sarah Mitchell has begun your consultation in Room 204.', 'CALL'),
('44444444-4444-4444-4444-444444444442', 'Prepare for Consultation', 'Your token CARD-102 is currently called. Please proceed towards Room 204.', 'ALERT'),
('44444444-4444-4444-4444-444444444444', 'Queue Position Update', 'Token CARD-103 is #2 in queue. Estimated wait is 15 minutes.', 'STATUS_CHANGE');

-- 8. SEED AUDIT LOG
INSERT INTO audit_logs (user_id, action, target_table, target_id, metadata) VALUES
('11111111-1111-1111-1111-111111111111', 'SYSTEM_INITIALIZATION', 'system', 'system', '{"status": "MedQueue v1.0 initial deployment complete"}'::jsonb),
('33333333-3333-3333-3333-333333333333', 'TOKEN_CALLED', 'queue_tokens', 'qqqq2222-2222-2222-2222-222222222222', '{"token": "CARD-102", "room": "Room 204"}'::jsonb);
