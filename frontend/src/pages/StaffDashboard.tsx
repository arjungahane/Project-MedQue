import React, { useState } from 'react';
import { 
  Users, 
  ArrowLeftRight, 
  Plus, 
  ShieldAlert, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  QrCode, 
  Flame, 
  Clock, 
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { PriorityLevel, SchedulingMode, QueueToken } from '../types';
import { QueueTicketModal } from '../components/QueueTicketModal';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    departments, 
    tokens, 
    schedulingMode, 
    setSchedulingMode, 
    generateToken, 
    elevatePriority, 
    cancelToken,
    getQueuePositionForToken
  } = useQueue();

  // Walk-in form fields
  const [patientName, setPatientName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || '');
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>('STANDARD');
  const [triageNotes, setTriageNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Modal ticket
  const [ticketModalToken, setTicketModalToken] = useState<QueueToken | null>(null);

  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId || !patientName.trim()) return;
    setIsSubmitting(true);

    try {
      const newToken = await generateToken(
        selectedDeptId,
        priorityLevel,
        triageNotes,
        patientName.trim()
      );
      setTicketModalToken(newToken);
      setPatientName('');
      setTriageNotes('');
      setPriorityLevel('STANDARD');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTokens = tokens.filter(t => {
    const matchesDept = deptFilter === 'ALL' || t.department_id === deptFilter;
    const matchesSearch = t.token_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  const waitingCount = tokens.filter(t => t.status === 'WAITING').length;
  const inConsultCount = tokens.filter(t => t.status === 'IN_CONSULTATION' || t.status === 'CALLED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. STAFF HEADER & ALGORITHM ENGINE CONTROL */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-md">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Queue Coordination & Triage Desk
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Staff Desk
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Officer: <strong>{user?.full_name || 'Nurse James Wilson'}</strong> &bull; Live triage, walk-in token issuance & queue strategy arbitration
            </p>
          </div>
        </div>

        {/* Algorithm Strategy Toggle Pill */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-center sm:text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Queue Strategy Mode (Authorized Staff)
          </span>
          <div className="inline-flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1 text-xs font-bold">
            <button
              onClick={() => setSchedulingMode('FIFO')}
              className={`px-3 py-1.5 rounded-lg transition-all ${schedulingMode === 'FIFO' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
            >
              FIFO (Standard)
            </button>
            <button
              onClick={() => setSchedulingMode('LIFO')}
              className={`px-3 py-1.5 rounded-lg transition-all ${schedulingMode === 'LIFO' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
            >
              LIFO (Stack-Based)
            </button>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            ⚡ Priority Scheduling stays active under both modes
          </p>
        </div>
      </div>

      {/* 2. WALK-IN CHECK-IN & RECEPTION ISSUANCE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Reception Walk-in Patient Check-in
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Rapid Token Printing & Pass Generation
          </span>
        </div>

        <form onSubmit={handleWalkinSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Patient Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Patient Full Name
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Robert Taylor"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Department
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

            {/* Priority Triage */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Triage Priority Level
              </label>
              <select
                value={priorityLevel}
                onChange={(e) => setPriorityLevel(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              >
                <option value="STANDARD">Standard Outpatient</option>
                <option value="PRIORITY">Priority / Senior / Severe Symptoms</option>
                <option value="EMERGENCY">Emergency (Immediate Intervention)</option>
              </select>
            </div>

            {/* Clinical Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Intake / Symptoms
              </label>
              <input
                type="text"
                value={triageNotes}
                onChange={(e) => setTriageNotes(e.target.value)}
                placeholder="e.g. High fever, sprained wrist, ECG"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-teal-600 hover:from-amber-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <QrCode className="w-4 h-4" />
              <span>{isSubmitting ? 'Issuing Pass...' : 'Issue Walk-in Token & Print Ticket'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* 3. DEPARTMENT CAPACITY & LIVE QUEUE OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total In Waiting</span>
          <div className="text-2xl font-black text-amber-500 mt-0.5">{waitingCount} Patients</div>
          <span className="text-[11px] text-slate-500">Awaiting consultation</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Currently Serving</span>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5">{inConsultCount} Patients</div>
          <span className="text-[11px] text-slate-500">In doctor chambers</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Current Strategy</span>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-0.5">{schedulingMode}</div>
          <span className="text-[11px] text-slate-500">Active engine</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Emergency Priority</span>
          <div className="text-2xl font-black text-rose-500 mt-0.5">Enforced</div>
          <span className="text-[11px] text-slate-500">Zero bypass delay</span>
        </div>
      </div>

      {/* 4. HOSPITAL-WIDE QUEUE MONITORING TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Live Patient Dispatching Board
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage patient triage levels, cancel non-attendees, and inspect ticket barcodes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search token / patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 w-44 sm:w-56"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Token Number</th>
                <th className="py-3 px-4 font-bold">Department</th>
                <th className="py-3 px-4 font-bold">Priority</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Arrival</th>
                <th className="py-3 px-4 font-bold">Patient / Notes</th>
                <th className="py-3 px-4 font-bold text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredTokens.map(tok => (
                <tr key={tok.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="py-3 px-4 font-bold font-mono text-slate-900 dark:text-white">
                    {tok.token_number}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {tok.department?.name || 'Clinic'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tok.priority_level === 'EMERGENCY' ? 'bg-rose-500 text-white animate-pulse' :
                      tok.priority_level === 'PRIORITY' ? 'bg-amber-500 text-white' :
                      'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {tok.priority_level}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {tok.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(tok.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {tok.notes || 'Walk-in check-in'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => setTicketModalToken(tok)}
                      className="px-2 py-1 rounded-lg border text-[10px] font-semibold text-sky-600 hover:bg-sky-50"
                      title="View Pass"
                    >
                      QR Pass
                    </button>
                    {tok.status === 'WAITING' && (
                      <>
                        <button
                          onClick={() => elevatePriority(tok.id, 'EMERGENCY')}
                          className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-[10px] font-bold hover:bg-rose-100"
                        >
                          🚨 Emergency
                        </button>
                        <button
                          onClick={() => cancelToken(tok.id)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold hover:bg-rose-100 hover:text-rose-600"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TICKET QR MODAL */}
      {ticketModalToken && (
        <QueueTicketModal
          token={ticketModalToken}
          position={getQueuePositionForToken(ticketModalToken.id)}
          onClose={() => setTicketModalToken(null)}
        />
      )}

    </div>
  );
};
