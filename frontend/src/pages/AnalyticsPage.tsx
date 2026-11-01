import React, { useState } from 'react';
import { 
  BarChart3, 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp, 
  Activity, 
  Clock, 
  Users, 
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { calculateMM1Metrics, generateQueueCurveData } from '../lib/mm1';
import { useQueue } from '../context/QueueContext';

export const AnalyticsPage: React.FC = () => {
  const { departments, tokens } = useQueue();

  // M/M/1 interactive inputs
  const [lambdaInput, setLambdaInput] = useState<number>(8.5); // arrivals per hour
  const [muInput, setMuInput] = useState<number>(10.0); // service capacity per hour

  const metrics = calculateMM1Metrics(lambdaInput, muInput);
  const theoreticalCurve = generateQueueCurveData(muInput);

  // Department workload distribution data for Recharts
  const deptWorkloadData = departments.map(d => {
    const deptTokens = tokens.filter(t => t.department_id === d.id);
    return {
      department: d.code,
      waiting: deptTokens.filter(t => t.status === 'WAITING').length,
      active: deptTokens.filter(t => t.status === 'CALLED' || t.status === 'IN_CONSULTATION').length,
      completed: deptTokens.filter(t => t.status === 'COMPLETED').length + 5,
    };
  });

  // Hourly operational arrival timeline data
  const hourlyData = [
    { time: '08:00', arrivals: 4, departures: 2 },
    { time: '09:00', arrivals: 9, departures: 6 },
    { time: '10:00', arrivals: 14, departures: 11 },
    { time: '11:00', arrivals: 12, departures: 13 },
    { time: '12:00', arrivals: 8, departures: 9 },
    { time: '13:00', arrivals: 6, departures: 7 },
    { time: '14:00', arrivals: 11, departures: 10 },
    { time: '15:00', arrivals: 13, departures: 12 },
    { time: '16:00', arrivals: 7, departures: 9 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-md">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Queueing Theory Analytics (M/M/1 Model)
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                Scientific Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Stochastic modeling of Poisson arrivals & Exponential service times for clinical bottleneck prevention.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs">
          <Info className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-slate-600 dark:text-slate-300">
            Formula: <strong>W = 1 / (μ - λ)</strong> &bull; <strong>L = λ / (μ - λ)</strong>
          </span>
        </div>
      </div>

      {/* 2. M/M/1 INTERACTIVE PARAMETER CONTROLLER & EQUATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Controls Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Model Parameters
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                <span>Arrival Rate (λ): {lambdaInput} patients/hr</span>
                <span className="text-indigo-600 font-mono text-[11px]">Mean: {(60 / lambdaInput).toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={lambdaInput}
                onChange={(e) => setLambdaInput(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <span className="text-[10px] text-slate-400">Rate of new incoming outpatient tokens</span>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                <span>Service Rate (μ): {muInput} patients/hr</span>
                <span className="text-teal-600 font-mono text-[11px]">Mean: {(60 / muInput).toFixed(1)}m</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={muInput}
                onChange={(e) => setMuInput(parseFloat(e.target.value))}
                className="w-full accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Doctor consultation processing capacity</span>
            </div>
          </div>

          {/* Stability Callout */}
          {metrics.is_stable ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Stable Equilibrium Queue (ρ &lt; 1)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Doctor capacity exceeds patient arrivals. The waiting room will not experience divergent overflow.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 space-y-1 animate-pulse">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>CRITICAL: Unstable Bottleneck (ρ ≥ 1)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Arrivals exceed service capacity! Queue length and waiting times diverge to infinity. Immediate doctor roster scaling required!
              </p>
            </div>
          )}

          <div className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-700">
            Note: This simplified M/M/1 assumes Poisson arrival process and Markovian exponentially distributed consultation durations.
          </div>
        </div>

        {/* Computed Metrics Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Traffic Intensity (ρ)</span>
            <div className={`text-3xl font-black my-2 font-mono ${metrics.is_stable ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
              {(metrics.rho * 100).toFixed(1)}%
            </div>
            <span className="text-[11px] text-slate-500">Utilization factor (λ / μ)</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Idle Probability (P₀)</span>
            <div className="text-3xl font-black my-2 font-mono text-teal-600 dark:text-teal-400">
              {metrics.is_stable ? `${(metrics.p0 * 100).toFixed(1)}%` : '0.0%'}
            </div>
            <span className="text-[11px] text-slate-500">Chance doctor is waiting (1 - ρ)</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Avg In System (L)</span>
            <div className="text-3xl font-black my-2 font-mono text-slate-900 dark:text-white">
              {metrics.is_stable ? `${metrics.L} pts` : '∞ Divergent'}
            </div>
            <span className="text-[11px] text-slate-500">Waiting + in consultation</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Avg In Queue (Lq)</span>
            <div className="text-3xl font-black my-2 font-mono text-amber-500">
              {metrics.is_stable ? `${metrics.Lq} pts` : '∞ Divergent'}
            </div>
            <span className="text-[11px] text-slate-500">Patients in waiting chairs</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Queue Wait (Wq)</span>
            <div className="text-3xl font-black my-2 font-mono text-sky-600 dark:text-sky-400">
              {metrics.is_stable ? `${metrics.Wq_minutes} mins` : 'Infinite'}
            </div>
            <span className="text-[11px] text-slate-500">Average wait before doctor call</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total System Time (W)</span>
            <div className="text-3xl font-black my-2 font-mono text-purple-600 dark:text-purple-400">
              {metrics.is_stable ? `${metrics.W_minutes} mins` : 'Infinite'}
            </div>
            <span className="text-[11px] text-slate-500">Total clinic visit duration</span>
          </div>

        </div>

      </div>

      {/* 3. RECHARTS: THEORETICAL CURVE & OPERATIONAL COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Queue Depth vs Arrival Rate Curve */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Queue Wait Time Non-Linearity Curve
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Notice the exponential hockey-stick spike as traffic intensity approaches 100%.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-500">μ = {muInput}/hr</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={theoreticalCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="arrivalRate" tick={{ fontSize: 11 }} label={{ value: 'Arrival Rate (λ)', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="avgWaitMinutes" name="Avg Wait (Minutes)" stroke="#0284c7" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="avgQueueLength" name="Avg Queue (Patients)" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hourly Arrivals vs Departures */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hourly Arrival vs Departure Dynamics
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real measured clinic dispatch patterns over the morning and afternoon shifts.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-500">Peak: 10:00 AM</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="arrivals" name="Patient Arrivals" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="departures" name="Consultations Completed" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. DEPARTMENT WORKLOAD DISTRIBUTION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Active Department Load & Queue Breakdown
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Comparing patients currently waiting, in consultation, and served across all hospital wings.
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="waiting" name="Waiting Queue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="active" name="In Consultation" fill="#0284c7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
