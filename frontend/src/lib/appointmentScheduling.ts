import type { Appointment, Doctor } from '../types';

export const APPOINTMENT_BUFFER_MINUTES = 5;
export const APPOINTMENT_SLOT_STEP_MINUTES = 5;

export interface AppointmentSlot {
  appointment_time: string;
  available: boolean;
  reason: string | null;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

function localDateTime(date: string, minutes: number) {
  return new Date(`${date}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`);
}

export function getLocalDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getAvailableAppointmentSlots(
  date: string,
  doctor: Doctor,
  appointments: Appointment[],
  now = new Date(),
  excludeAppointmentId?: string,
): AppointmentSlot[] {
  const [year, month, day] = date.split('-').map(Number);
  const selectedDate = new Date(year, month - 1, day, 12);
  if (
    selectedDate.getFullYear() !== year ||
    selectedDate.getMonth() !== month - 1 ||
    selectedDate.getDate() !== day
  ) {
    throw new RangeError('Choose a valid appointment date.');
  }

  const duration = doctor.avg_consultation_minutes;
  if (!Number.isInteger(duration) || duration < 1 || duration > 180) {
    throw new RangeError('This doctor has an invalid appointment duration.');
  }

  const doctorDays = doctor.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const weekday = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const opening = toMinutes(doctor.start_time || '09:00');
  const closing = toMinutes(doctor.end_time || '17:00');
  const lastStart = closing - duration - APPOINTMENT_BUFFER_MINUTES;
  if (!doctorDays.includes(weekday)) return [];

  const activeAppointments = appointments.filter((appointment) =>
    appointment.id !== excludeAppointmentId &&
    appointment.doctor_id === doctor.id &&
    appointment.appointment_date === date &&
    ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(appointment.status),
  );
  const slots: AppointmentSlot[] = [];

  for (let minute = opening; minute <= lastStart; minute += APPOINTMENT_SLOT_STEP_MINUTES) {
    const start = localDateTime(date, minute);
    const proposedEnd = minute + duration + APPOINTMENT_BUFFER_MINUTES;
    const conflict = activeAppointments.some((appointment) => {
      const existingStart = toMinutes(appointment.appointment_time);
      const existingDuration = appointment.duration_minutes || duration;
      const existingEnd = existingStart + existingDuration + APPOINTMENT_BUFFER_MINUTES;
      return minute < existingEnd && proposedEnd > existingStart;
    });
    const available = start.getTime() > now.getTime() && !conflict;
    slots.push({
      appointment_time: `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}:00`,
      available,
      reason: available ? null : conflict ? 'Booked or within the required five-minute buffer' : 'This time has passed',
    });
  }

  return slots;
}
