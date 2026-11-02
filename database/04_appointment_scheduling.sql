-- Appointment availability and concurrency-safe booking.
-- Apply after 01_schema.sql and 02_rls_and_triggers.sql.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS medqueue_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
  clinic_timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata'
);

INSERT INTO medqueue_settings (singleton, clinic_timezone)
VALUES (true, 'Asia/Kolkata')
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE medqueue_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE medqueue_settings FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION get_clinic_local_now()
RETURNS TIMESTAMP
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  timezone_name TEXT;
BEGIN
  SELECT clinic_timezone INTO timezone_name
  FROM medqueue_settings
  WHERE singleton = true;

  IF timezone_name IS NULL OR NOT EXISTS (
    SELECT 1 FROM pg_timezone_names WHERE name = timezone_name
  ) THEN
    RAISE EXCEPTION 'Configure a valid clinic time zone in medqueue_settings.'
      USING ERRCODE = '22023';
  END IF;

  RETURN now() AT TIME ZONE timezone_name;
END;
$$;

REVOKE ALL ON FUNCTION get_clinic_local_now() FROM PUBLIC, anon, authenticated;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 15;

UPDATE appointments AS appointment
SET duration_minutes = doctor.avg_consultation_minutes
FROM doctors AS doctor
WHERE appointment.doctor_id = doctor.id
  AND appointment.duration_minutes = 15
  AND doctor.avg_consultation_minutes <> 15;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_duration_minutes_check
  CHECK (duration_minutes BETWEEN 1 AND 180);

CREATE OR REPLACE FUNCTION validate_appointment_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  provider doctors%ROWTYPE;
  weekday_name TEXT;
  opening_minutes INTEGER;
  closing_minutes INTEGER;
  selected_minutes INTEGER;
BEGIN
  IF NEW.status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS') THEN
    IF NEW.doctor_id IS NULL THEN
      RAISE EXCEPTION 'Choose a doctor to reserve an appointment slot.'
        USING ERRCODE = '23514';
    END IF;

    SELECT * INTO provider
    FROM doctors
    WHERE id = NEW.doctor_id
      AND department_id = NEW.department_id
      AND is_available = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Choose an available doctor assigned to this department.'
        USING ERRCODE = '23514';
    END IF;

    IF provider.avg_consultation_minutes IS NULL
      OR provider.avg_consultation_minutes NOT BETWEEN 1 AND 180
      OR provider.available_days IS NULL
      OR cardinality(provider.available_days) = 0
      OR provider.start_time IS NULL
      OR provider.end_time IS NULL
      OR provider.start_time >= provider.end_time
      OR extract(hour FROM provider.start_time) >= 24
      OR extract(hour FROM provider.end_time) >= 24
      OR extract(second FROM provider.start_time) <> 0
      OR extract(second FROM provider.end_time) <> 0 THEN
      RAISE EXCEPTION 'The selected doctor has an invalid appointment schedule.'
        USING ERRCODE = '23514';
    END IF;

    weekday_name := btrim(to_char(NEW.appointment_date, 'FMDay'));
    IF NOT COALESCE(weekday_name = ANY(provider.available_days), false) THEN
      RAISE EXCEPTION 'The selected doctor is not available on this date.'
        USING ERRCODE = '23514';
    END IF;

    selected_minutes := extract(hour FROM NEW.appointment_time)::INTEGER * 60
      + extract(minute FROM NEW.appointment_time)::INTEGER;
    opening_minutes := extract(hour FROM provider.start_time)::INTEGER * 60
      + extract(minute FROM provider.start_time)::INTEGER;
    closing_minutes := extract(hour FROM provider.end_time)::INTEGER * 60
      + extract(minute FROM provider.end_time)::INTEGER;

    IF extract(second FROM NEW.appointment_time) <> 0
      OR selected_minutes < opening_minutes
      OR (selected_minutes - opening_minutes) % 5 <> 0
      OR selected_minutes + provider.avg_consultation_minutes + 5 > closing_minutes THEN
      RAISE EXCEPTION 'Choose a five-minute appointment slot within the doctor''s working hours.'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.appointment_date + NEW.appointment_time <= get_clinic_local_now() THEN
      RAISE EXCEPTION 'Choose a future appointment time.'
        USING ERRCODE = '23514';
    END IF;

    NEW.duration_minutes := provider.avg_consultation_minutes;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_validate_schedule ON appointments;
CREATE TRIGGER appointments_validate_schedule
BEFORE INSERT OR UPDATE OF
  doctor_id, department_id, appointment_date, appointment_time, status, duration_minutes
ON appointments
FOR EACH ROW
EXECUTE FUNCTION validate_appointment_schedule();

ALTER TABLE appointments
  ADD CONSTRAINT appointments_doctor_time_no_overlap
  EXCLUDE USING gist (
    doctor_id WITH =,
    tsrange(
      appointment_date + appointment_time,
      appointment_date + appointment_time + make_interval(mins => duration_minutes + 5),
      '[)'
    ) WITH &&
  )
  WHERE (
    doctor_id IS NOT NULL
    AND status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')
  );

CREATE OR REPLACE FUNCTION get_appointment_slots(
  p_doctor_id UUID,
  p_date DATE,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS TABLE (
  appointment_time TIME,
  available BOOLEAN,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  provider doctors%ROWTYPE;
  slot_duration INTEGER;
  weekday_name TEXT;
  patient_profile_id UUID;
  clinic_now TIMESTAMP;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to check appointment availability.'
      USING ERRCODE = '28000';
  END IF;

  IF p_date IS NULL THEN
    RAISE EXCEPTION 'Choose a valid appointment date.'
      USING ERRCODE = '22023';
  END IF;

  SELECT * INTO provider
  FROM doctors
  WHERE id = p_doctor_id
    AND is_available = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The selected doctor is unavailable.'
      USING ERRCODE = '22023';
  END IF;
  clinic_now := get_clinic_local_now();

  IF provider.avg_consultation_minutes IS NULL
    OR provider.avg_consultation_minutes NOT BETWEEN 1 AND 180
    OR provider.available_days IS NULL
    OR cardinality(provider.available_days) = 0
    OR provider.start_time IS NULL
    OR provider.end_time IS NULL
    OR provider.start_time >= provider.end_time
    OR extract(hour FROM provider.start_time) >= 24
    OR extract(hour FROM provider.end_time) >= 24
    OR extract(second FROM provider.start_time) <> 0
    OR extract(second FROM provider.end_time) <> 0 THEN
    RAISE EXCEPTION 'The selected doctor has an invalid appointment schedule.'
      USING ERRCODE = '22023';
  END IF;

  IF p_date < clinic_now::DATE THEN
    RAISE EXCEPTION 'Choose a future appointment date.'
      USING ERRCODE = '22023';
  END IF;

  IF p_exclude_appointment_id IS NOT NULL THEN
    SELECT id INTO patient_profile_id
    FROM profiles
    WHERE (auth_id = auth.uid() OR id = auth.uid())
      AND role = 'patient';

    IF NOT EXISTS (
      SELECT 1
      FROM appointments
      WHERE id = p_exclude_appointment_id
        AND patient_id = patient_profile_id
        AND doctor_id = p_doctor_id
        AND status = 'CONFIRMED'
    ) THEN
      RAISE EXCEPTION 'Appointment not found or cannot be rescheduled.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  weekday_name := btrim(to_char(p_date, 'FMDay'));
  slot_duration := provider.avg_consultation_minutes;

  RETURN QUERY
  WITH candidates AS (
    SELECT generated.slot::TIME AS slot_time
    FROM generate_series(
      (p_date + provider.start_time)::TIMESTAMP,
      (p_date + (provider.end_time - make_interval(mins => slot_duration + 5)))::TIMESTAMP,
      INTERVAL '5 minutes'
    ) AS generated(slot)
    WHERE COALESCE(weekday_name = ANY(provider.available_days), false)
  )
  SELECT
    candidates.slot_time,
    p_date + candidates.slot_time > clinic_now
      AND NOT EXISTS (
        SELECT 1
        FROM appointments AS booked
        WHERE booked.doctor_id = provider.id
          AND booked.appointment_date = p_date
          AND (p_exclude_appointment_id IS NULL OR booked.id <> p_exclude_appointment_id)
          AND booked.status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')
          AND tsrange(
            p_date + candidates.slot_time,
            p_date + candidates.slot_time + make_interval(mins => slot_duration + 5),
            '[)'
          ) && tsrange(
            booked.appointment_date + booked.appointment_time,
            booked.appointment_date + booked.appointment_time
              + make_interval(mins => booked.duration_minutes + 5),
            '[)'
          )
      ) AS is_available,
    CASE
      WHEN NOT COALESCE(weekday_name = ANY(provider.available_days), false) THEN 'Doctor unavailable on this day'
      WHEN p_date + candidates.slot_time <= clinic_now THEN 'This time has passed'
      WHEN EXISTS (
        SELECT 1
        FROM appointments AS booked
        WHERE booked.doctor_id = provider.id
          AND booked.appointment_date = p_date
          AND (p_exclude_appointment_id IS NULL OR booked.id <> p_exclude_appointment_id)
          AND booked.status IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')
          AND tsrange(
            p_date + candidates.slot_time,
            p_date + candidates.slot_time + make_interval(mins => slot_duration + 5),
            '[)'
          ) && tsrange(
            booked.appointment_date + booked.appointment_time,
            booked.appointment_date + booked.appointment_time
              + make_interval(mins => booked.duration_minutes + 5),
            '[)'
          )
      ) THEN 'Booked or within the required five-minute buffer'
      ELSE NULL
    END AS unavailable_reason
  FROM candidates
  ORDER BY candidates.slot_time;
END;
$$;

CREATE OR REPLACE FUNCTION book_appointment(
  p_department_id UUID,
  p_doctor_id UUID,
  p_date DATE,
  p_time TIME,
  p_reason TEXT DEFAULT NULL
)
RETURNS SETOF appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  patient_profile_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to book an appointment.'
      USING ERRCODE = '28000';
  END IF;

  SELECT id INTO patient_profile_id
  FROM profiles
  WHERE (auth_id = auth.uid() OR id = auth.uid())
    AND role = 'patient';

  IF patient_profile_id IS NULL THEN
    RAISE EXCEPTION 'A patient profile is required to book an appointment.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  INSERT INTO appointments (
    patient_id,
    department_id,
    doctor_id,
    appointment_date,
    appointment_time,
    appointment_type,
    status,
    reason
  )
  VALUES (
    patient_profile_id,
    p_department_id,
    p_doctor_id,
    p_date,
    p_time,
    'ONLINE',
    'CONFIRMED',
    left(p_reason, 1000)
  )
  RETURNING *;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'This slot has already been booked or is within the required five-minute buffer. Please select another time.'
      USING ERRCODE = '23P01';
END;
$$;

CREATE OR REPLACE FUNCTION reschedule_appointment(
  p_appointment_id UUID,
  p_date DATE,
  p_time TIME
)
RETURNS SETOF appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  patient_profile_id UUID;
  selected_appointment appointments%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to reschedule an appointment.'
      USING ERRCODE = '28000';
  END IF;

  SELECT id INTO patient_profile_id
  FROM profiles
  WHERE (auth_id = auth.uid() OR id = auth.uid())
    AND role = 'patient';

  SELECT * INTO selected_appointment
  FROM appointments
  WHERE id = p_appointment_id
    AND patient_id = patient_profile_id
    AND status = 'CONFIRMED'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found or can no longer be rescheduled.'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  UPDATE appointments
  SET appointment_date = p_date,
      appointment_time = p_time,
      updated_at = timezone('utc', now())
  WHERE id = selected_appointment.id
  RETURNING *;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'This slot has already been booked or is within the required five-minute buffer. Please select another time.'
      USING ERRCODE = '23P01';
END;
$$;

CREATE OR REPLACE FUNCTION cancel_appointment(p_appointment_id UUID)
RETURNS SETOF appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  patient_profile_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to cancel an appointment.'
      USING ERRCODE = '28000';
  END IF;

  SELECT id INTO patient_profile_id
  FROM profiles
  WHERE (auth_id = auth.uid() OR id = auth.uid())
    AND role = 'patient';

  RETURN QUERY
  UPDATE appointments
  SET status = 'CANCELLED', updated_at = timezone('utc', now())
  WHERE id = p_appointment_id
    AND patient_id = patient_profile_id
    AND status = 'CONFIRMED'
  RETURNING *;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found or can no longer be cancelled.'
      USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_my_appointments()
RETURNS SETOF appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  patient_profile_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to view your appointments.'
      USING ERRCODE = '28000';
  END IF;

  SELECT id INTO patient_profile_id
  FROM profiles
  WHERE (auth_id = auth.uid() OR id = auth.uid())
    AND role = 'patient';

  RETURN QUERY
  SELECT *
  FROM appointments
  WHERE patient_id = patient_profile_id
  ORDER BY appointment_date DESC, appointment_time DESC;
END;
$$;

REVOKE ALL ON FUNCTION get_appointment_slots(UUID, DATE, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION book_appointment(UUID, UUID, DATE, TIME, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION reschedule_appointment(UUID, DATE, TIME) FROM PUBLIC;
REVOKE ALL ON FUNCTION cancel_appointment(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_my_appointments() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION get_appointment_slots(UUID, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION book_appointment(UUID, UUID, DATE, TIME, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reschedule_appointment(UUID, DATE, TIME) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_appointment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_appointments() TO authenticated;
