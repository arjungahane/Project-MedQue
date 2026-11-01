import React, { useState } from 'react';
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
import { PriorityLevel, QueueToken } from '../types';
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
  const [appointmentDate, setAppointmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editBloodGroup, setEditBloodGroup] = useState(user?.blood_group || 'O+');

  // Filter patient's active and past tokens
  const patientTokens = tokens.filter(t => t.patient_id === user?.id || t.notes?.includes(user?.full_name || ''));
  const activeToken = patientTokens.find(t => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'IN_CONSULTATION');
  const pastTokens = patientTokens.filter(t => t.id !== activeToken?.id);

  // Active token queue position
  const activePosition = activeToken ? getQueuePositionForToken(activeToken.id) : 0;
  const servingToken = activeToken ? getServingToken(activeToken.department_id) : undefined;

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
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
            onClick={() => setShowOnlineBooking(prev => !prev)}
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
                Book Consultation or Instant Walk-in Token
              </h2>
            </div>
            <button
              onClick={() => setShowOnlineBooking(false)}
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
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code}) - {dept.floor}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
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
              </div>

              {/* Doctor Selection (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Doctor (Optional)
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">Any Available Specialist</option>
                  {doctors.filter(d => !selectedDeptId || d.department_id === selectedDeptId).map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.specialization} ({doc.consultation_room})
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preferred Time Slot
                </label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

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

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>{isGenerating ? 'Generating Official Token...' : 'Generate Instant QR Appointment Ticket'}</span>
            </button>
          </form>
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
