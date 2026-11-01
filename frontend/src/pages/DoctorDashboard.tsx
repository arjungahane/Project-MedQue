import React, { useState } from 'react';
import { 
  Stethoscope, 
  Volume2, 
  CheckCircle2, 
  RotateCcw, 
  UserX, 
  AlertTriangle, 
  Search, 
  Filter, 
  Clock, 
  Users, 
  ShieldAlert, 
  Flame, 
  DoorOpen,
  ArrowRight,
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { PriorityLevel, QueueToken } from '../types';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    departments, 
    doctors, 
    tokens, 
    callNextToken, 
    startConsultation, 
    completeConsultation, 
    skipToken, 
    markAbsent, 
    elevatePriority,
    schedulingMode
  } = useQueue();

  // Find doctor record
  const currentDoctor = doctors.find(d => d.profile_id === user?.id || d.profile?.email === user?.email) || doctors[0];
  const assignedDept = departments.find(d => d.id === currentDoctor.department_id) || departments[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  
  // Skip reason modal
  const [skipTargetToken, setSkipTargetToken] = useState<QueueToken | null>(null);
  const [skipReasonText, setSkipReasonText] = useState('Patient not responding in waiting area');

  // Department's active tokens
  const deptTokens = tokens.filter(t => t.department_id === assignedDept.id);
  
  // Doctor's active token in consultation or called
  const activeToken = deptTokens.find(t => 
    (t.doctor_id === currentDoctor.id || !t.doctor_id) && 
    (t.status === 'CALLED' || t.status === 'IN_CONSULTATION')
  );

  // Waiting queue for this department
  const waitingTokens = deptTokens.filter(t => t.status === 'WAITING');
  const completedTokens = deptTokens.filter(t => t.status === 'COMPLETED');

  // Filtered queue
  const filteredQueue = waitingTokens.filter(t => {
    const matchesSearch = t.token_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'ALL' || t.priority_level === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const handleCallNext = async () => {
    await callNextToken(currentDoctor.id, assignedDept.id);
  };

  const handleConfirmSkip = async () => {
    if (skipTargetToken) {
      await skipToken(skipTargetToken.id, skipReasonText);
      setSkipTargetToken(null);
    }
  };

  const priorityBadge: Record<PriorityLevel, string> = {
    EMERGENCY: 'bg-rose-500 text-white font-black animate-pulse',
    PRIORITY: 'bg-amber-500 text-white font-bold',
    STANDARD: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. DOCTOR DESK HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shadow-md">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {user?.full_name || 'Dr. Sarah Mitchell'}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                Specialist Desk
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Department: <strong className="text-slate-800 dark:text-slate-200">{assignedDept.name} ({assignedDept.code})</strong> &bull; Station: <strong>{currentDoctor.consultation_room}</strong> &bull; Engine: <strong>{schedulingMode}</strong>
            </p>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">In Waiting</span>
            <div className="text-xl font-bold text-amber-500">{waitingTokens.length}</div>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Completed</span>
            <div className="text-xl font-bold text-emerald-500">{completedTokens.length}</div>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Consult Speed</span>
            <div className="text-xl font-bold text-sky-500">~{currentDoctor.avg_consultation_minutes}m</div>
          </div>
        </div>
      </div>

      {/* 2. ACTIVE PATIENT CONSULTATION CONSOLE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold">Consultation Bay: {currentDoctor.consultation_room}</h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-semibold">Doctor Station Ready</span>
          </div>
        </div>

        {activeToken ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            
            {/* Token Highlight */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded text-[11px] uppercase ${priorityBadge[activeToken.priority_level]}`}>
                  {activeToken.priority_level}
                </span>
                <span className="text-xs text-sky-300 font-semibold">
                  Status: {activeToken.status}
                </span>
              </div>
              <div className="text-5xl font-black font-mono tracking-tight text-white">
                {activeToken.token_number}
              </div>
              <p className="text-xs text-slate-300">
                Arrived: {new Date(activeToken.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Clinical Notes & Reason */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Patient Notes & Symptoms</span>
              <p className="text-slate-200 leading-relaxed font-mono">
                {activeToken.notes || 'Routine consultation and general assessment.'}
              </p>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Sequence #{activeToken.sequence_number} &bull; Mode: {activeToken.scheduling_mode}</span>
              </div>
            </div>

            {/* Doctor Actions */}
            <div className="space-y-3">
              {activeToken.status === 'CALLED' ? (
                <button
                  onClick={() => startConsultation(activeToken.id)}
                  className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Consultation</span>
                </button>
              ) : (
                <button
                  onClick={() => completeConsultation(activeToken.id)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Consultation</span>
                </button>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setSkipTargetToken(activeToken)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Skip Patient</span>
                </button>
                <button
                  onClick={() => markAbsent(activeToken.id)}
                  className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <UserX className="w-3.5 h-3.5 text-rose-400" />
                  <span>Mark Absent</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/10 mx-auto flex items-center justify-center text-sky-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold">No Patient Currently in Consultation</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto mt-1">
                {waitingTokens.length > 0 
                  ? `${waitingTokens.length} patients are currently waiting in the ${assignedDept.name} queue.` 
                  : 'The queue is currently empty.'}
              </p>
            </div>
            <button
              onClick={handleCallNext}
              disabled={waitingTokens.length === 0}
              className="px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-sky-500/25 inline-flex items-center gap-2 transition-all hover:scale-105"
            >
              <Volume2 className="w-4 h-4" />
              <span>Call Next Patient (Chime & Announce)</span>
            </button>
          </div>
        )}

      </div>

      {/* 3. PATIENT QUEUE MANAGEMENT TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Department Waiting Queue ({waitingTokens.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active Strategy: <strong className="text-sky-600 dark:text-sky-400">{schedulingMode}</strong> (Priority preemption strictly enforced)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search token / notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 w-44 sm:w-56"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Priorities</option>
              <option value="EMERGENCY">Emergency Only</option>
              <option value="PRIORITY">Priority Only</option>
              <option value="STANDARD">Standard Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {filteredQueue.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No waiting patients match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Order</th>
                  <th className="py-3 px-4 font-bold">Token</th>
                  <th className="py-3 px-4 font-bold">Priority</th>
                  <th className="py-3 px-4 font-bold">Arrival</th>
                  <th className="py-3 px-4 font-bold">Est. Wait</th>
                  <th className="py-3 px-4 font-bold">Clinical Notes</th>
                  <th className="py-3 px-4 font-bold text-right">Triage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredQueue.map((tok, idx) => (
                  <tr key={tok.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white">
                      {tok.token_number}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${priorityBadge[tok.priority_level]}`}>
                        {tok.priority_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(tok.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-teal-600 dark:text-teal-400 font-semibold">
                      ~{tok.estimated_wait_minutes}m
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {tok.notes || 'Routine checkup'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {tok.priority_level !== 'EMERGENCY' && (
                        <button
                          onClick={() => elevatePriority(tok.id, 'EMERGENCY')}
                          className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold hover:bg-rose-100"
                          title="Elevate to Emergency"
                        >
                          🚨 Elevate
                        </button>
                      )}
                      <button
                        onClick={() => elevatePriority(tok.id, 'PRIORITY')}
                        className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-100"
                        title="Fast-Track Priority"
                      >
                        ⚡ Fast-Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* SKIP REASON MODAL */}
      {skipTargetToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Skip Patient {skipTargetToken.token_number}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please provide an operational or clinical justification for skipping this token:
            </p>
            <select
              value={skipReasonText}
              onChange={(e) => setSkipReasonText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            >
              <option value="Patient not responding in waiting area">Patient not responding in waiting area</option>
              <option value="Pending urgent laboratory / ECG reports">Pending urgent laboratory / ECG reports</option>
              <option value="Patient requested temporary postponement">Patient requested temporary postponement</option>
              <option value="Re-routed to Emergency triage bay">Re-routed to Emergency triage bay</option>
            </select>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSkipTargetToken(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSkip}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
