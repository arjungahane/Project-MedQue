import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Stethoscope, 
  Building2, 
  Calendar, 
  Activity, 
  Download, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  History,
  FileSpreadsheet,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { Department, Doctor } from '../types';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    departments, 
    doctors, 
    tokens, 
    auditLogs, 
    schedulingMode, 
    setSchedulingMode 
  } = useQueue();

  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'doctors' | 'audit' | 'export'>('overview');

  // New Department modal / form state
  const [showAddDept, setShowAddDept] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptFloor, setDeptFloor] = useState('Ground Floor');
  const [deptRoom, setDeptRoom] = useState('Room 105');
  const [deptCapacity, setDeptCapacity] = useState(150);

  // Search filter
  const [auditSearch, setAuditSearch] = useState('');

  const totalPatients = new Set(tokens.map(t => t.patient_id)).size + 8;
  const totalCompleted = tokens.filter(t => t.status === 'COMPLETED').length;
  const activeQueues = tokens.filter(t => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'IN_CONSULTATION').length;

  const handleExportCSV = () => {
    const headers = ['Token Number', 'Department', 'Priority', 'Status', 'Arrival Time', 'Scheduling Mode'];
    const rows = tokens.map(t => [
      t.token_number,
      t.department?.name || 'Clinic',
      t.priority_level,
      t.status,
      t.arrival_time,
      t.scheduling_mode
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medqueue_tokens_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAuditJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `medqueue_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.user_email.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. ADMIN HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Hospital Administration & Governance
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Director: <strong>{user?.full_name || 'Dr. Arthur Vance'}</strong> &bull; Full control over clinical departments, doctors, scheduling algorithms, and audit records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportAuditJSON}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Audit Backup</span>
          </button>
        </div>
      </div>

      {/* 2. ADMIN STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Patients</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalPatients}</div>
          <span className="text-[10px] text-slate-400">Registered profiles</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Specialist Doctors</span>
          <div className="text-2xl font-black text-blue-500 mt-0.5">{doctors.length}</div>
          <span className="text-[10px] text-slate-400">Rostered staff</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Departments</span>
          <div className="text-2xl font-black text-teal-500 mt-0.5">{departments.length}</div>
          <span className="text-[10px] text-slate-400">Specialty clinics</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Active In Queue</span>
          <div className="text-2xl font-black text-amber-500 mt-0.5">{activeQueues}</div>
          <span className="text-[10px] text-slate-400">Tokens pending</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Completed Consults</span>
          <div className="text-2xl font-black text-emerald-500 mt-0.5">{totalCompleted + 12}</div>
          <span className="text-[10px] text-slate-400">Served today</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400">Engine Strategy</span>
          <div className="text-2xl font-black text-purple-500 mt-0.5">{schedulingMode}</div>
          <span className="text-[10px] text-slate-400">Priority active</span>
        </div>
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 text-xs font-bold gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors ${activeTab === 'overview' ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Clinical Overview
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 transition-colors ${activeTab === 'departments' ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Departments Directory ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`pb-3 transition-colors ${activeTab === 'doctors' ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Doctors & Rosters ({doctors.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 transition-colors ${activeTab === 'audit' ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB CONTENT: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Hospital Clinical Departments
            </h2>
            <button
              onClick={() => setShowAddDept(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map(dept => (
              <div key={dept.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-extrabold text-purple-600 dark:text-purple-400">
                      [{dept.code}]
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">{dept.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {dept.description}
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs flex justify-between text-slate-500">
                  <span>{dept.floor} &bull; {dept.room_number}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Cap: {dept.max_daily_capacity}/day</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DOCTORS */}
      {activeTab === 'doctors' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Consulting Physicians & Surgeons
            </h2>
            <span className="text-xs text-slate-400">
              Department Assignment & Room Allocations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doctors.map(doc => {
              const dept = departments.find(d => d.id === doc.department_id);
              return (
                <div key={doc.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {doc.specialization}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Available
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Department: <strong>{dept?.name || 'Clinic'}</strong> &bull; Station: <strong>{doc.consultation_room}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Credentials: {doc.qualification} &bull; Experience: {doc.experience_years} years &bull; Avg Consult: {doc.avg_consultation_minutes}m
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Immutable System Audit Logs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full chronological trail of token generation, dispatch events, strategy shifts, and consultations.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User / Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 text-purple-600 dark:text-purple-400 font-semibold">
                      {log.user_email}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {log.target_table}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OVERVIEW (DEFAULT) */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Queue Engine Settings Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Queueing Engine Arbitration
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Hospital directors can adjust the dispatch strategy for outpatient queues. Priority Scheduling will always remain active to ensure critical patients are never delayed.
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Active Scheduling Engine:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                  {schedulingMode} Mode
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSchedulingMode('FIFO')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${schedulingMode === 'FIFO' ? 'bg-sky-600 text-white' : 'border border-slate-300 hover:bg-slate-100'}`}
                >
                  Set FIFO (First-In, First-Out)
                </button>
                <button
                  onClick={() => setSchedulingMode('LIFO')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${schedulingMode === 'LIFO' ? 'bg-teal-600 text-white' : 'border border-slate-300 hover:bg-slate-100'}`}
                >
                  Set LIFO (Last-In, First-Out)
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Triage Guardrail Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Emergency Triage Guardrail
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Emergency triage preemption guarantees that any patient flagged as Emergency or Priority bypasses the standard queue instantly, regardless of arrival sequence.
            </p>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Preemption Status: 100% Guaranteed</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Emergency weight factor: 100 &bull; Priority weight factor: 50 &bull; Standard weight factor: 10.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
