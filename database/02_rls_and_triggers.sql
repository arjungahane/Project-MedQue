-- ==========================================================
-- MEDQUEUE - ROW LEVEL SECURITY (RLS) & TRIGGERS
-- ==========================================================

-- Enable Row Level Security on all core tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user has admin role
CREATE OR REPLACE FUNCTION is_admin(user_auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE (auth_id = user_auth_id OR id = user_auth_id) AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has doctor or staff role
CREATE OR REPLACE FUNCTION is_hospital_staff(user_auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE (auth_id = user_auth_id OR id = user_auth_id) AND role IN ('doctor', 'staff', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE TO authenticated 
USING (auth_id = auth.uid() OR id = auth.uid())
WITH CHECK (
    -- Prevent non-admins from promoting themselves to admin
    (role = (SELECT role FROM profiles WHERE auth_id = auth.uid() OR id = auth.uid()))
    OR is_admin(auth.uid())
);

CREATE POLICY "Allow public insert for self-registration as patient only"
ON profiles FOR INSERT TO authenticated, anon
WITH CHECK (role = 'patient');

CREATE POLICY "Admins have full access to profiles" 
ON profiles FOR ALL TO authenticated 
USING (is_admin(auth.uid()));

-- 2. Departments Policies
CREATE POLICY "Departments are viewable by everyone" 
ON departments FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Only admins can modify departments" 
ON departments FOR ALL TO authenticated 
USING (is_admin(auth.uid()));

-- 3. Doctors Policies
CREATE POLICY "Doctors directory is viewable by everyone" 
ON doctors FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins and Doctors can manage doctors table" 
ON doctors FOR ALL TO authenticated 
USING (is_hospital_staff(auth.uid()));

-- 4. Staff Policies
CREATE POLICY "Staff directory viewable by hospital staff" 
ON staff FOR SELECT TO authenticated 
USING (is_hospital_staff(auth.uid()));

CREATE POLICY "Only admins can manage staff" 
ON staff FOR ALL TO authenticated 
USING (is_admin(auth.uid()));

-- 5. Appointments Policies
CREATE POLICY "Patients view their own appointments" 
ON appointments FOR SELECT TO authenticated 
USING (patient_id = auth.uid() OR is_hospital_staff(auth.uid()));

CREATE POLICY "Patients can create their appointments" 
ON appointments FOR INSERT TO authenticated 
WITH CHECK (patient_id = auth.uid() OR is_hospital_staff(auth.uid()));

CREATE POLICY "Patients can update or cancel their appointments" 
ON appointments FOR UPDATE TO authenticated 
USING (patient_id = auth.uid() OR is_hospital_staff(auth.uid()));

-- 6. Queue Tokens Policies (Display board needs public read access)
CREATE POLICY "Queue tokens are viewable by public and authenticated" 
ON queue_tokens FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Hospital staff and patients can create tokens" 
ON queue_tokens FOR INSERT TO authenticated, anon 
WITH CHECK (true);

CREATE POLICY "Hospital staff can update queue token states" 
ON queue_tokens FOR UPDATE TO authenticated, anon 
USING (true);

-- 7. Queue Events Policies
CREATE POLICY "Queue events viewable by authenticated" 
ON queue_events FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Queue events insertable" 
ON queue_events FOR INSERT TO authenticated, anon WITH CHECK (true);

-- 8. Notifications Policies
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "System and staff can insert notifications" 
ON notifications FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "Users can mark their notifications as read" 
ON notifications FOR UPDATE TO authenticated 
USING (user_id = auth.uid());

-- 9. Simulation Policies
CREATE POLICY "Simulations viewable by hospital staff and admin" 
ON simulation_sessions FOR ALL TO authenticated, anon USING (true);

CREATE POLICY "Simulation results viewable by all" 
ON simulation_results FOR ALL TO authenticated, anon USING (true);

-- 10. Audit Logs Policies
CREATE POLICY "Audit logs readable only by admins" 
ON audit_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Audit logs can be inserted by system" 
ON audit_logs FOR INSERT TO authenticated, anon WITH CHECK (true);

-- Realtime publication configuration
-- Add tables to supabase_realtime publication for websocket subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE queue_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
