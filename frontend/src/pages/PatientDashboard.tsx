import React, { useEffect, useState } from 'react';
import { 
  QrCode, 
  Clock, 
  Calendar, 
  User, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  Ban, 
  Eye, 
  Stethoscope, 
  CheckCircle2, 
  Plus,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { QueueTicketModal } from '../components/QueueTicketModal';
import { Appointment, PriorityLevel, QueueToken } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  APPOINTMENT_BUFFER_MINUTES,
  AppointmentSlot,
  getAvailableAppointmentSlots,
  getLocalDateValue,
} from '../lib/appointmentScheduling';
import confetti from 'canvas-confetti';

export const PatientDashboard: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { 
    departments, 
    doctors, 
    tokens, 
    generateToken, 
    cancelToken, 
    getQueuePositionForToken, 
    getServingToken 
  } = useQueue();

  // Selected Token for QR modal
  const [activeModalToken, setActiveModalToken] = useState<QueueToken | null>(null);

  // Walk-in booking state
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || '');
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>('STANDARD');
  const [patientNotes, setPatientNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Online appointment booking state
  const [showOnlineBooking, setShowOnlineBooking] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(() => getLocalDateValue(new Date()));
  const [appointmentTime, setAppointmentTime] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [bookingMode, setBookingMode] = useState<'APPOINTMENT' | 'WALKIN'>('APPOINTMENT');
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('medqueue_appointments');
    return saved ? JSON.parse(saved) as Appointment[] : [];
  });
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingNotice, setBookingNotice] = useState('');
  const [appointmentSubmitting, setAppointmentSubmitting] = useState(false);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const [reschedulingAppointmentId, setReschedulingAppointmentId] = useState<string | null>(null);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editBloodGroup, setEditBloodGroup] = useState(user?.blood_group || 'O+');

  // Filter patient's active and past tokens
  const patientTokens = tokens.filter(t => t.patient_id === user?.id || t.notes?.includes(user?.full_name || ''));
  const activeToken = patientTokens.find(t => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'IN_CONSULTATION');
  const pastTokens = patientTokens.filter(t => t.id !== activeToken?.id);

  const selectedDoctor = doctors.find(doctor =>
    doctor.id === selectedDoctorId &&
    doctor.department_id === selectedDeptId &&
    doctor.is_available
  );

  useEffect(() => {
    let active = true;
    const loadAppointments = async () => {
      if (isSupabaseConfigured && supabase) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (sessionData.session) {
          const { data, error } = await supabase.rpc('get_my_appointments');
          if (error) throw error;
          if (active) setAppointments((data || []) as Appointment[]);
          return;
        }
      }
      const saved = localStorage.getItem('medqueue_appointments');
      if (active) setAppointments(saved ? JSON.parse(saved) as Appointment[] : []);
    };
    loadAppointments().catch(error => {
      if (active) setBookingError(`Could not load appointments: ${error.message}`);
    });
    const syncLocalAppointments = (event: StorageEvent) => {
      if (event.key === 'medqueue_appointments') {
        setAppointments(event.newValue ? JSON.parse(event.newValue) as Appointment[] : []);
        setAvailabilityVersion(version => version + 1);
      }
    };
    window.addEventListener('storage', syncLocalAppointments);
    return () => {
      active = false;
      window.removeEventListener('storage', syncLocalAppointments);
    };
  }, []);

  useEffect(() => {
    if (!selectedDoctor || !appointmentDate) {
      setAvailableSlots([]);
      setAppointmentTime('');
      setAvailabilityError('');
      return undefined;
    }

    let active = true;
    setAvailabilityLoading(true);
    setAvailabilityError('');
    setAvailableSlots([]);
    setAppointmentTime('');
    const loadSlots = async () => {
      if (isSupabaseConfigured && supabase) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (sessionData.session) {
          const { data, error } = await supabase.rpc('get_appointment_slots', {
            p_doctor_id: selectedDoctor.id,
            p_date: appointmentDate,
            p_exclude_appointment_id: reschedulingAppointmentId,
          });
          if (error) throw error;
          return (data || []) as AppointmentSlot[];
        }
      }
      return getAvailableAppointmentSlots(
        appointmentDate,
        selectedDoctor,
        appointments,
        new Date(),
        reschedulingAppointmentId || undefined,
      );
    };
    loadSlots()
      .then(slots => { if (active) setAvailableSlots(slots); })
      .catch(error => { if (active) setAvailabilityError(error.message || 'Could not load appointment availability.'); })
      .finally(() => { if (active) setAvailabilityLoading(false); });
    return () => { active = false; };
  }, [selectedDoctor, appointmentDate, appointments, availabilityVersion, reschedulingAppointmentId]);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return undefined;
    const channel = supabase
      .channel(`appointment-availability-${selectedDeptId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        setAvailabilityVersion(version => version + 1);
      })
      .subscribe();
    return () => { void supabase?.removeChannel(channel); };
  }, [selectedDeptId]);

  // Active token queue position
  const activePosition = activeToken ? getQueuePositionForToken(activeToken.id) : 0;
  const servingToken = activeToken ? getServingToken(activeToken.department_id) : undefined;

  useEffect(() => {
    const assignedDoctors = doctors.filter(doctor =>
      doctor.department_id === selectedDeptId && doctor.is_available
    );
    if (!assignedDoctors.some(doctor => doctor.id === selectedDoctorId)) {
      setSelectedDoctorId(assignedDoctors[0]?.id || '');
    }
  }, [selectedDeptId, doctors, selectedDoctorId]);

  const handleBookAppointment = async () => {
    setBookingError('');
    setBookingNotice('');
    if (!user || !selectedDoctor || !appointmentTime) {
      setBookingError('Choose an available doctor and time slot.');
      return;
    }
    setAppointmentSubmitting(true);
    try {
      let bookedAppointment: Appointment | null = null;
      let hasAuthenticatedSession = false;
      if (isSupabaseConfigured && supabase) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        hasAuthenticatedSession = Boolean(sessionData.session);
        if (hasAuthenticatedSession) {
          const { data, error } = reschedulingAppointmentId
            ? await supabase.rpc('reschedule_appointment', {
              p_appointment_id: reschedulingAppointmentId,
              p_date: appointmentDate,
              p_time: appointmentTime,
            })
            : await supabase.rpc('book_appointment', {
              p_department_id: selectedDeptId,
              p_doctor_id: selectedDoctor.id,
              p_date: appointmentDate,
              p_time: appointmentTime,
              p_reason: patientNotes || null,
            });
          if (error) {
            if (error.code === '23P01' || /already been booked|buffer/i.test(error.message)) {
              throw new Error('This slot has already been booked. Please select another time.');
            }
            throw error;
          }
          bookedAppointment = (Array.isArray(data) ? data[0] : data) as Appointment;
        }
      }

      if (!hasAuthenticatedSession) {
        const latestAppointments = JSON.parse(
          localStorage.getItem('medqueue_appointments') || '[]',
        ) as Appointment[];
        const latestSlots = getAvailableAppointmentSlots(
          appointmentDate,
          selectedDoctor,
          latestAppointments,
          new Date(),
          reschedulingAppointmentId || undefined,
        );
        if (!latestSlots.some(slot => slot.appointment_time.slice(0, 5) === appointmentTime.slice(0, 5) && slot.available)) {
          throw new Error('This slot has already been booked. Please select another time.');
        }
        const existingAppointment = reschedulingAppointmentId
          ? latestAppointments.find(item => item.id === reschedulingAppointmentId)
          : undefined;
        if (reschedulingAppointmentId && !existingAppointment) {
          throw new Error('The appointment being rescheduled is no longer available.');
        }
        bookedAppointment = existingAppointment
          ? { ...existingAppointment, appointment_date: appointmentDate, appointment_time: appointmentTime }
          : {
            id: `demo-appt-${crypto.randomUUID()}`,
            patient_id: user.id,
            department_id: selectedDeptId,
            doctor_id: selectedDoctor.id,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            duration_minutes: selectedDoctor.avg_consultation_minutes,
            appointment_type: 'ONLINE',
            status: 'CONFIRMED',
            reason: patientNotes || undefined,
            created_at: new Date().toISOString(),
          };
        const confirmedAppointment = bookedAppointment;
        if (!confirmedAppointment) throw new Error('The appointment service returned no booking confirmation.');
        const nextAppointments = reschedulingAppointmentId
          ? latestAppointments.map(item => item.id === confirmedAppointment.id ? confirmedAppointment : item)
          : [confirmedAppointment, ...latestAppointments];
        localStorage.setItem('medqueue_appointments', JSON.stringify(nextAppointments));
        setAppointments(nextAppointments);
      } else {
        const confirmedAppointment = bookedAppointment;
        if (!confirmedAppointment) throw new Error('The appointment service returned no booking confirmation.');
        setAppointments(previous => reschedulingAppointmentId
          ? previous.map(item => item.id === confirmedAppointment.id ? confirmedAppointment : item)
          : [confirmedAppointment, ...previous]);
      }

      setAppointmentTime('');
      setPatientNotes('');
      setBookingNotice(reschedulingAppointmentId
        ? 'Appointment rescheduled. The previous time is available again.'
        : hasAuthenticatedSession
          ? 'Appointment confirmed. The selected slot is now unavailable.'
          : 'Demo appointment saved in this browser. Sign in with Supabase to reserve a shared appointment slot.');
      setReschedulingAppointmentId(null);
      setAvailabilityVersion(version => version + 1);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Appointment booking failed. Please try another slot.');
    } finally {
      setAppointmentSubmitting(false);
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    setBookingError('');
    setBookingNotice('');
    try {
      const { data: sessionData, error: sessionError } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null }, error: null };
      if (sessionError) throw sessionError;
      if (sessionData.session && supabase) {
        const { data, error } = await supabase.rpc('cancel_appointment', {
          p_appointment_id: appointment.id,
        });
        if (error) throw error;
        const cancelled = (Array.isArray(data) ? data[0] : data) as Appointment;
        setAppointments(previous => previous.map(item => item.id === cancelled.id ? cancelled : item));
      } else {
        const latestAppointments = JSON.parse(
          localStorage.getItem('medqueue_appointments') || '[]',
        ) as Appointment[];
        const nextAppointments = latestAppointments.map(item =>
          item.id === appointment.id ? { ...item, status: 'CANCELLED' as const } : item,
        );
        localStorage.setItem('medqueue_appointments', JSON.stringify(nextAppointments));
        setAppointments(nextAppointments);
      }
      setBookingNotice('Appointment cancelled. Its time slot is available again.');
      if (reschedulingAppointmentId === appointment.id) setReschedulingAppointmentId(null);
      setAvailabilityVersion(version => version + 1);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Could not cancel this appointment.');
    }
  };

  const startRescheduling = (appointment: Appointment) => {
    const appointmentDateValue = appointment.appointment_date < getLocalDateValue(new Date())
      ? getLocalDateValue(new Date())
      : appointment.appointment_date;
    setSelectedDeptId(appointment.department_id);
    setSelectedDoctorId(appointment.doctor_id || '');
    setAppointmentDate(appointmentDateValue);
    setAppointmentTime('');
    setBookingMode('APPOINTMENT');
    setReschedulingAppointmentId(appointment.id);
    setBookingError('');
    setBookingNotice('Choose a new time. Your current slot remains reserved until you confirm.');
    setShowOnlineBooking(true);
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingMode === 'APPOINTMENT') {
      await handleBookAppointment();
      return;
    }
    if (!selectedDeptId) return;
    setIsGenerating(true);

    try {
      const newToken = await generateToken(
        selectedDeptId, 
        selectedPriority, 
        patientNotes || (showOnlineBooking ? `Online Booking for ${appointmentDate} ${appointmentTime}` : 'Walk-in check-in')
      );

      // Trigger celebratory confetti for digital pass creation
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore if canvas-confetti is not loaded
      }

      setActiveModalToken(newToken);
      setPatientNotes('');
      setShowOnlineBooking(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProfile = () => {
    updateProfile({
      phone: editPhone,
      blood_group: editBloodGroup,
    });
    setIsEditingProfile(false);
  };

  const statusColors: Record<string, string> = {
    WAITING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300',
    CALLED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 animate-pulse',
    IN_CONSULTATION: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-300',
    COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300',
    SKIPPED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
    ABSENT: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
    CANCELLED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. WELCOME & PROFILE BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || 'Patient'}`}
            alt="Profile"
            className="w-16 h-16 rounded-2xl border-2 border-emerald-500 shadow-md object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {user?.full_name}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                Patient Account
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {user?.email} &bull; Blood: <strong className="text-rose-600 dark:text-rose-400">{user?.blood_group || 'O+'}</strong> &bull; Phone: {user?.phone || 'Not set'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditingProfile ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Phone"
                className="px-3 py-1.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-900"
              />
              <select
                value={editBloodGroup}
                onChange={(e) => setEditBloodGroup(e.target.value)}
                className="px-2 py-1.5 rounded-xl border text-xs bg-slate-50 dark:bg-slate-900"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
              <button
                onClick={handleSaveProfile}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Edit Details
            </button>
          )}

          <button
            onClick={() => {
              setShowOnlineBooking(previous => !previous);
              setReschedulingAppointmentId(null);
              setBookingMode('APPOINTMENT');
              setAppointmentTime('');
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{showOnlineBooking ? 'Close Form' : 'New Appointment'}</span>
          </button>
        </div>
      </div>

      {/* 2. ACTIVE TOKEN LIVE STATUS CARD (IF IN QUEUE) */}
      {activeToken ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-teal-700 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  Active Consultation Ticket
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-slate-900">
                  {activeToken.priority_level}
                </span>
              </div>
              
              <div className="flex items-baseline gap-4">
                <span className="text-5xl font-black font-mono tracking-tight">
                  {activeToken.token_number}
                </span>
                <span className="text-xl font-bold opacity-90">
                  {activeToken.department?.name}
                </span>
              </div>

              <p className="text-xs text-sky-100 max-w-lg">
                Room: <strong>{activeToken.room_number || 'Room 101'}</strong> &bull; Current State: <strong>{activeToken.status}</strong>
              </p>
            </div>

            {/* Position & Time Counters */}
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px]">
                <span className="text-[10px] uppercase font-bold text-sky-200">Your Position</span>
                <div className="text-3xl font-black mt-0.5">
                  {activePosition > 0 ? `#${activePosition}` : 'Next!'}
                </div>
                <span className="text-[10px] text-sky-200">
                  {activePosition > 1 ? `${activePosition - 1} ahead` : 'Prepare at door'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[110px]">
                <span className="text-[10px] uppercase font-bold text-sky-200">Est. Wait</span>
                <div className="text-3xl font-black mt-0.5">
                  ~{activeToken.estimated_wait_minutes}m
                </div>
                <span className="text-[10px] text-sky-200">Approximate</span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setActiveModalToken(activeToken)}
                  className="px-4 py-2.5 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-transform hover:scale-105"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show QR Pass</span>
                </button>

                <button
                  onClick={() => cancelToken(activeToken.id)}
                  className="px-4 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel Token</span>
                </button>
              </div>
            </div>
          </div>

          {/* Currently serving token announcement */}
          {servingToken && servingToken.id !== activeToken.id && (
            <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-xs text-sky-100">
              <span>Department currently serving: <strong className="font-mono text-white text-sm">{servingToken.token_number}</strong> in {servingToken.room_number}</span>
              <span className="text-teal-200 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Queue moving smoothly
              </span>
            </div>
          )}
        </div>
      ) : (
        /* NO ACTIVE TOKEN BANNER */
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">You have no active queue token</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generate an instant walk-in token below or schedule an online appointment.</p>
            </div>
          </div>
          <button
            onClick={() => setShowOnlineBooking(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20"
          >
            Get a Token Now
          </button>
        </div>
      )}

      {/* 3. BOOKING / WALK-IN TOKEN GENERATION CARD */}
      {showOnlineBooking && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border-2 border-sky-500 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {reschedulingAppointmentId ? 'Reschedule Appointment' : 'Book Consultation or Instant Walk-in Token'}
              </h2>
            </div>
            <button
              onClick={() => {
                setShowOnlineBooking(false);
                setReschedulingAppointmentId(null);
                setAppointmentTime('');
              }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateToken} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Department
                </label>
                <select
                  value={selectedDeptId}
                  disabled={Boolean(reschedulingAppointmentId)}
                  onChange={(e) => {
                    const departmentId = e.target.value;
                    setSelectedDeptId(departmentId);
                    setSelectedDoctorId(doctors.find(doctor =>
                      doctor.department_id === departmentId && doctor.is_available
                    )?.id || '');
                    setAppointmentTime('');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code}) - {dept.floor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Booking Type
                </label>
                <select
                  value={bookingMode}
                  disabled={Boolean(reschedulingAppointmentId)}
                  onChange={(e) => {
                    setBookingMode(e.target.value as 'APPOINTMENT' | 'WALKIN');
                    setBookingError('');
                    setBookingNotice('');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="APPOINTMENT">Scheduled appointment</option>
                  <option value="WALKIN">Instant walk-in token</option>
                </select>
              </div>

              {bookingMode === 'WALKIN' ? <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Priority / Urgency
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="STANDARD">Standard Outpatient</option>
                  <option value="PRIORITY">Priority / Senior Citizen / Urgent</option>
                  <option value="EMERGENCY">Emergency (Immediate Triage)</option>
                </select>
              </div> : <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Doctor
                </label>
                <select
                  required
                  value={selectedDoctorId}
                  disabled={Boolean(reschedulingAppointmentId)}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setAppointmentTime('');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="" disabled>Select an available doctor</option>
                  {doctors.filter(d => d.department_id === selectedDeptId && d.is_available).map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.specialization} ({doc.consultation_room})
                    </option>
                  ))}
                </select>
              </div>}

            </div>

            {bookingMode === 'APPOINTMENT' && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  min={getLocalDateValue(new Date())}
                  onChange={(e) => {
                    setAppointmentDate(e.target.value);
                    setAppointmentTime('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Available Time Slot
                </label>
                <select
                  required
                  value={appointmentTime}
                  disabled={!selectedDoctor || availabilityLoading || !availableSlots.some(slot => slot.available)}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white disabled:opacity-60"
                >
                  <option value="">
                    {availabilityLoading ? 'Checking availability…' :
                      !selectedDoctor ? 'No available doctor in this department' :
                        availableSlots.some(slot => slot.available) ? 'Select an available time' : 'No available times'}
                  </option>
                  {availableSlots.map(slot => (
                    <option key={slot.appointment_time} value={slot.appointment_time} disabled={!slot.available}>
                      {new Date(`2000-01-01T${slot.appointment_time}`).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}{slot.available ? ' · Available' : ` · ${slot.reason || 'Booked'}`}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                  {selectedDoctor
                    ? `${selectedDoctor.avg_consultation_minutes}-minute consultation plus a ${APPOINTMENT_BUFFER_MINUTES}-minute buffer.`
                    : 'Select a department with an available doctor.'}
                </p>
              </div>
            </div>}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Visit / Chief Symptoms
              </label>
              <textarea
                rows={2}
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="Briefly state symptoms (e.g., headache, follow-up prescription, chest tightness)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {(bookingError || availabilityError) && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                {bookingError || availabilityError}
              </div>
            )}
            {bookingNotice && (
              <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                {bookingNotice}
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating || appointmentSubmitting || availabilityLoading ||
                (bookingMode === 'APPOINTMENT' && (!selectedDoctor || !appointmentTime ||
                  !availableSlots.some(slot => slot.appointment_time.slice(0, 5) === appointmentTime.slice(0, 5) && slot.available)))}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2"
            >
              {bookingMode === 'WALKIN' && <QrCode className="w-4 h-4" />}
              <span>{appointmentSubmitting ? 'Booking appointment…' : isGenerating
                ? 'Generating Official Token...'
                : bookingMode === 'APPOINTMENT' ? 'Confirm Appointment' : 'Generate Instant QR Walk-in Ticket'}</span>
            </button>
          </form>
        </div>
      )}

      {appointments.some(appointment => appointment.patient_id === user?.id) && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Your Appointments</h2>
            <span className="text-xs text-slate-400">
              {appointments.filter(appointment => appointment.patient_id === user?.id).length} records
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {appointments.filter(appointment => appointment.patient_id === user?.id)
              .sort((a, b) => `${b.appointment_date}T${b.appointment_time}`.localeCompare(`${a.appointment_date}T${a.appointment_time}`))
              .map(appointment => {
                const department = departments.find(item => item.id === appointment.department_id);
                const doctor = doctors.find(item => item.id === appointment.doctor_id);
                return (
                  <div key={appointment.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <Calendar className="h-5 w-5 text-sky-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{department?.name || 'Department'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {appointment.appointment_date} at {appointment.appointment_time.slice(0, 5)}
                        {doctor ? ` · ${doctor.specialization}` : ''}
                        {appointment.duration_minutes ? ` · ${appointment.duration_minutes} min` : ''}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      appointment.status === 'CANCELLED'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}>{appointment.status.toLowerCase().replace('_', ' ')}</span>
                    {appointment.status === 'CONFIRMED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => startRescheduling(appointment)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCancelAppointment(appointment)}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
          </div>
          {appointments.some(appointment => appointment.patient_id === user?.id && appointment.id.startsWith('demo-appt-')) && (
            <p className="text-[10px] text-amber-700 dark:text-amber-300">
              Demo appointments are stored only in this browser and do not reserve a shared clinic slot.
            </p>
          )}
        </div>
      )}

      {/* 4. PAST APPOINTMENT & TOKEN HISTORY */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Appointment & Token History
          </h2>
          <span className="text-xs text-slate-400">
            {pastTokens.length} records recorded
          </span>
        </div>

        {pastTokens.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No previous token records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Token Number</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold">Priority</th>
                  <th className="py-3 px-4 font-bold">Issued At</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Pass View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {pastTokens.map(tok => (
                  <tr key={tok.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-bold font-mono text-slate-900 dark:text-white">
                      {tok.token_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {tok.department?.name || 'Medical Clinic'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {tok.priority_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(tok.arrival_time).toLocaleDateString()} {new Date(tok.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[tok.status] || 'bg-slate-100 text-slate-800'}`}>
                        {tok.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveModalToken(tok)}
                        className="p-1 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                        title="View Ticket"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TICKET QR MODAL */}
      {activeModalToken && (
        <QueueTicketModal
          token={activeModalToken}
          position={activePosition}
          onClose={() => setActiveModalToken(null)}
        />
      )}

    </div>
  );
};
