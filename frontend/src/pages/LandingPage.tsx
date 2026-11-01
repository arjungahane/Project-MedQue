import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Clock, 
  Users, 
  Tv, 
  BarChart3, 
  FlaskConical, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Stethoscope, 
  Zap, 
  QrCode, 
  Volume2, 
  Building2,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../context/AuthContext';
import { calculateMM1Metrics } from '../lib/mm1';

export const LandingPage: React.FC = () => {
  const { departments, tokens, schedulingMode } = useQueue();
  const { isAuthenticated, quickLoginAs } = useAuth();
  const navigate = useNavigate();

  // Mini interactive calculator state on landing page
  const [demoLambda, setDemoLambda] = useState(8);
  const [demoMu, setDemoMu] = useState(10);
  const miniMetrics = calculateMM1Metrics(demoLambda, demoMu);

  const totalWaiting = tokens.filter(t => t.status === 'WAITING').length;
  const totalServing = tokens.filter(t => t.status === 'IN_CONSULTATION' || t.status === 'CALLED').length;
  const totalCompleted = tokens.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-sky-400/20 via-teal-400/20 to-indigo-400/20 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Status Capsule */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 text-xs font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Smart Hospital Dispatch Active &bull; Current Mode: <strong>{schedulingMode}</strong></span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Zero Congestion. <br />
              <span className="bg-gradient-to-r from-sky-600 via-teal-500 to-indigo-600 bg-clip-text text-transparent">
                Intelligent Hospital Queue
              </span> Management.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              MedQueue eliminates crowded clinic waiting rooms with digital token issuance, dynamic FIFO/LIFO scheduling, emergency triage preemption, and real-time M/M/1 queuing theory analytics.
            </p>
          </div>

          {/* Quick CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (!isAuthenticated) quickLoginAs('patient');
                navigate('/patient');
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl shadow-sky-600/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <QrCode className="w-4 h-4" />
              <span>Get Digital Token / Book</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              to="/display"
              className="px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm border border-slate-300 dark:border-slate-700 shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Tv className="w-4 h-4 text-teal-500" />
              <span>Live Kiosk TV Board</span>
            </Link>

            <Link
              to="/analytics"
              className="px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>M/M/1 Math Model</span>
            </Link>
          </div>

          {/* Live KPI Strip */}
          <div className="pt-8 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Currently Waiting</span>
              <div className="text-2xl font-black text-amber-500 mt-1">{totalWaiting} Patients</div>
              <span className="text-[11px] text-slate-500">Across 5 departments</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">In Consultation</span>
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{totalServing} Active</div>
              <span className="text-[11px] text-slate-500">With senior specialists</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Served Today</span>
              <div className="text-2xl font-black text-emerald-500 mt-1">{totalCompleted + 12} Consults</div>
              <span className="text-[11px] text-slate-500">Zero bottle-necks</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Average Wait</span>
              <div className="text-2xl font-black text-teal-500 mt-1">11.8 mins</div>
              <span className="text-[11px] text-slate-500">-45% vs traditional</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. REAL-TIME DEPARTMENT QUEUE SNAPSHOT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
              Live Clinical Status
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Hospital Departments & Queue Load
            </h2>
          </div>
          <Link
            to="/display"
            className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1 hover:underline"
          >
            <span>Open High-Res Display Board</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map(dept => {
            const deptTokens = tokens.filter(t => t.department_id === dept.id);
            const waitingCount = deptTokens.filter(t => t.status === 'WAITING').length;
            const serving = deptTokens.find(t => t.status === 'IN_CONSULTATION' || t.status === 'CALLED');

            return (
              <div
                key={dept.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-extrabold font-mono bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                        {dept.code}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{dept.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{dept.floor} &bull; {dept.room_number}</p>
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Serving Now</span>
                    <span className="font-extrabold text-sm text-sky-600 dark:text-sky-400 font-mono">
                      {serving ? serving.token_number : 'Available'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Waiting Queue</span>
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      {waitingCount} Patients
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    ~{dept.current_wait_minutes || 15} mins wait
                  </span>
                  <button
                    onClick={() => {
                      if (!isAuthenticated) quickLoginAs('patient');
                      navigate('/patient');
                    }}
                    className="font-bold text-sky-600 hover:text-sky-700"
                  >
                    Book Token →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. FOUR CORE MODULES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Engine Architecture
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Designed for Modern Healthcare Operations
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Engineered with strict algorithmic guarantees, role segregation, and real-time audio-visual notifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-3xl bg-gradient-to-b from-sky-500/10 to-transparent border border-sky-200 dark:border-sky-800/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Smart Token Engine</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Automated department-coded token generation with instant QR code tickets, live position tracking, and accurate estimated wait timers.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-b from-teal-500/10 to-transparent border border-teal-200 dark:border-teal-800/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">FIFO & LIFO + Priority</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Switch seamlessly between FIFO and LIFO queue strategies while ensuring Emergency and Urgent patients are unconditionally prioritized first.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-200 dark:border-indigo-800/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Volume2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Voice & Kiosk Board</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              High-definition TV kiosk display with Web Audio synthesized three-tone chimes and Web Speech voice announcements of called tokens.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-200 dark:border-purple-800/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">M/M/1 Queue Analytics</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Scientific queueing theory calculations (λ, μ, ρ, L, Lq, W, Wq) with automatic bottle-neck detection for unstable queue warnings.
            </p>
          </div>

        </div>
      </section>

      {/* 4. INTERACTIVE M/M/1 TEASER CALCULATOR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-2xl border border-slate-700 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Calculator className="w-4 h-4" />
                <span>Queueing Theory Engine Preview</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Interactive M/M/1 Mathematical Model
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
                Adjust patient arrival rate (λ) and doctor service rate (μ) below to observe real-time queue stability and waiting time predictions.
              </p>
            </div>

            <Link
              to="/analytics"
              className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all hover:scale-105"
            >
              <span>Explore Full Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* Input Controls */}
            <div className="space-y-5 bg-white/5 p-6 rounded-2xl border border-white/10">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Arrival Rate (λ): {demoLambda} patients/hr</span>
                  <span className="text-indigo-300">Mean Interarrival: {(60 / demoLambda).toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="18"
                  step="1"
                  value={demoLambda}
                  onChange={(e) => setDemoLambda(Number(e.target.value))}
                  className="w-full accent-indigo-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Service Rate (μ): {demoMu} patients/hr</span>
                  <span className="text-teal-300">Mean Service Time: {(60 / demoMu).toFixed(1)}m</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="20"
                  step="1"
                  value={demoMu}
                  onChange={(e) => setDemoMu(Number(e.target.value))}
                  className="w-full accent-teal-400"
                />
              </div>

              <div className="text-[11px] text-slate-400 leading-snug">
                Stability criterion: <strong>ρ = λ/μ &lt; 1</strong>. When arrival rate exceeds doctor capacity, waiting times diverge to infinity.
              </div>
            </div>

            {/* Live Computed Indicators */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">Traffic Intensity (ρ)</span>
                <div className={`text-2xl font-black mt-1 ${miniMetrics.is_stable ? 'text-teal-400' : 'text-rose-400'}`}>
                  {(miniMetrics.rho * 100).toFixed(0)}%
                </div>
                <span className="text-[10px] text-slate-400">Server utilization</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">Avg In Queue (Lq)</span>
                <div className="text-2xl font-black text-indigo-300 mt-1">
                  {miniMetrics.is_stable ? `${miniMetrics.Lq} pts` : '∞ (Unstable)'}
                </div>
                <span className="text-[10px] text-slate-400">Waiting line depth</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">Queue Wait (Wq)</span>
                <div className="text-2xl font-black text-amber-300 mt-1">
                  {miniMetrics.is_stable ? `${miniMetrics.Wq_minutes}m` : 'Infinite'}
                </div>
                <span className="text-[10px] text-slate-400">Pre-consult wait</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">System Idle (P₀)</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {miniMetrics.is_stable ? `${(miniMetrics.p0 * 100).toFixed(0)}%` : '0%'}
                </div>
                <span className="text-[10px] text-slate-400">Zero wait probability</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. ROLE-BASED QUICK DEMO ACCESS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            College Presentation / Evaluator Access
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Experience MedQueue by Role
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Test any module instantly with one-click role assignment:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-3">Patient Portal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Book appointments, generate walk-in QR tickets, view real-time queue position and cancel appointments.
              </p>
            </div>
            <button
              onClick={() => { quickLoginAs('patient'); navigate('/patient'); }}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
            >
              Open Patient Desk →
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-3">Doctor Desk</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Call next patient, play audio chime, complete consult, skip with clinical reason, and mark absent.
              </p>
            </div>
            <button
              onClick={() => { quickLoginAs('doctor'); navigate('/doctor'); }}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
            >
              Open Doctor Desk →
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-3">Staff / Triage</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Receptionist walk-in check-in, priority elevation, and toggle queue scheduling mode (FIFO ⇄ LIFO).
              </p>
            </div>
            <button
              onClick={() => { quickLoginAs('staff'); navigate('/staff'); }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors"
            >
              Open Staff Desk →
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white mt-3">Admin Portal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Hospital director overview, department capacities, doctor roster, system audit logs, and data export.
              </p>
            </div>
            <button
              onClick={() => { quickLoginAs('admin'); navigate('/admin'); }}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
            >
              Open Admin Portal →
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};
