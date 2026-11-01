import React, { useState, useEffect, useRef } from 'react';
import { 
  FlaskConical, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  ShieldAlert,
  ArrowRight
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
import { PriorityLevel, SimulationPatient } from '../types';

export const SimulationPage: React.FC = () => {
  // Simulator configuration
  const [arrivalRate, setArrivalRate] = useState<number>(10); // patients / hr
  const [serviceRate, setServiceRate] = useState<number>(12); // patients / hr
  const [simulationStrategy, setSimulationStrategy] = useState<'FIFO' | 'LIFO'>('FIFO');
  const [emergencyRatio, setEmergencyRatio] = useState<number>(15); // % of emergency patients

  // Simulator runtime state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simClockMinute, setSimClockMinute] = useState<number>(0);
  const [simPatients, setSimPatients] = useState<SimulationPatient[]>([]);
  
  // History timeline for Recharts
  const [timelineData, setTimelineData] = useState<Array<{ minute: number; queueLength: number; completedCount: number }>>([]);

  const timerRef = useRef<any>(null);

  // Generate a synthetic patient
  const createSyntheticPatient = (currentMin: number): SimulationPatient => {
    const isEmergency = Math.random() * 100 < emergencyRatio;
    const priority: PriorityLevel = isEmergency 
      ? (Math.random() < 0.5 ? 'EMERGENCY' : 'PRIORITY') 
      : 'STANDARD';

    const serviceMinutes = Math.max(3, Math.round(60 / serviceRate + (Math.random() * 4 - 2)));
    const seq = simPatients.length + 1;

    return {
      id: `sim-pt-${seq}`,
      token_number: `SIM-${100 + seq}`,
      patient_name: `Synthetic Patient #${seq}`,
      arrival_minute: currentMin,
      service_duration: serviceMinutes,
      priority,
      type: Math.random() < 0.4 ? 'ONLINE' : 'WALKIN',
      status: 'WAITING',
    };
  };

  // Run simulation tick (each tick represents 1 simulated minute)
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSimClockMinute(prevMin => {
          const nextMin = prevMin + 1;

          setSimPatients(prevPatients => {
            let updated = [...prevPatients];

            // 1. Arrival probability check: lambda arrivals / 60 mins
            const arrivalProb = arrivalRate / 60;
            if (Math.random() < arrivalProb) {
              const newPt = createSyntheticPatient(nextMin);
              updated.push(newPt);
            }

            // 2. Check if server is currently occupied
            const currentlyServingIndex = updated.findIndex(p => p.status === 'SERVING');

            if (currentlyServingIndex !== -1) {
              const servingPatient = updated[currentlyServingIndex];
              const minutesServed = nextMin - (servingPatient.start_minute || nextMin);

              if (minutesServed >= servingPatient.service_duration) {
                // Consultation completed!
                updated[currentlyServingIndex] = {
                  ...servingPatient,
                  status: 'COMPLETED',
                  completed_minute: nextMin,
                  wait_duration: (servingPatient.start_minute || nextMin) - servingPatient.arrival_minute,
                };
              }
            }

            // 3. If server is now free, pick next patient according to strategy + priority
            const isFree = !updated.some(p => p.status === 'SERVING');
            if (isFree) {
              const waitingPatients = updated.filter(p => p.status === 'WAITING');

              if (waitingPatients.length > 0) {
                // Priority sorting first
                const emergency = waitingPatients.filter(p => p.priority === 'EMERGENCY');
                const priority = waitingPatients.filter(p => p.priority === 'PRIORITY');
                const standard = waitingPatients.filter(p => p.priority === 'STANDARD');

                let nextToServe: SimulationPatient | undefined;

                if (emergency.length > 0) {
                  nextToServe = emergency[0];
                } else if (priority.length > 0) {
                  nextToServe = priority[0];
                } else if (simulationStrategy === 'LIFO') {
                  // LIFO: last arrived is served first
                  nextToServe = standard[standard.length - 1];
                } else {
                  // FIFO: first arrived is served first
                  nextToServe = standard[0];
                }

                if (nextToServe) {
                  const targetIdx = updated.findIndex(p => p.id === nextToServe!.id);
                  if (targetIdx !== -1) {
                    updated[targetIdx] = {
                      ...nextToServe,
                      status: 'SERVING',
                      start_minute: nextMin,
                    };
                  }
                }
              }
            }

            // Record timeline snapshot
            const currentQueueLength = updated.filter(p => p.status === 'WAITING').length;
            const currentCompleted = updated.filter(p => p.status === 'COMPLETED').length;
            setTimelineData(td => [
              ...td.slice(-30),
              { minute: nextMin, queueLength: currentQueueLength, completedCount: currentCompleted }
            ]);

            return updated;
          });

          return nextMin;
        });
      }, 400); // 400ms = 1 simulated minute
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, arrivalRate, serviceRate, simulationStrategy, emergencyRatio]);

  const handleReset = () => {
    setIsRunning(false);
    setSimClockMinute(0);
    setSimPatients([]);
    setTimelineData([]);
  };

  const handleInjectEmergency = () => {
    const emergencyPt: SimulationPatient = {
      id: `sim-pt-${simPatients.length + 1}`,
      token_number: `SIM-EMERG-${Math.floor(Math.random() * 900 + 100)}`,
      patient_name: `🚨 Injected Trauma Patient`,
      arrival_minute: simClockMinute,
      service_duration: 8,
      priority: 'EMERGENCY',
      type: 'WALKIN',
      status: 'WAITING',
    };
    setSimPatients(prev => [emergencyPt, ...prev]);
  };

  const waitingCount = simPatients.filter(p => p.status === 'WAITING').length;
  const servingCount = simPatients.filter(p => p.status === 'SERVING').length;
  const completedCount = simPatients.filter(p => p.status === 'COMPLETED').length;

  const completedList = simPatients.filter(p => p.status === 'COMPLETED' && p.wait_duration !== undefined);
  const avgWaitTime = completedList.length > 0
    ? (completedList.reduce((acc, p) => acc + (p.wait_duration || 0), 0) / completedList.length).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. SIMULATOR HEADER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-md">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Stochastic Patient Queue Simulator
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                Sandbox Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Synthetic patient generation, FIFO vs LIFO comparison, and priority preemption benchmark testing.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={() => setIsRunning(false)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Pause className="w-4 h-4" />
              <span>Pause Simulator</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4" />
              <span>Start Simulation</span>
            </button>
          )}

          <button
            onClick={handleInjectEmergency}
            className="px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-colors"
            title="Inject Emergency Patient"
          >
            <Zap className="w-4 h-4" />
            <span>Inject Emergency</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. PARAMETERS & RUNTIME STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Simulator Configuration Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Simulation Parameters
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            {/* Algorithm Mode */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Dispatch Algorithm Strategy
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSimulationStrategy('FIFO')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all ${simulationStrategy === 'FIFO' ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-700 dark:text-sky-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                  FIFO (First-In, First-Out)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationStrategy('LIFO')}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all ${simulationStrategy === 'LIFO' ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                  LIFO (Last-In, First-Out)
                </button>
              </div>
            </div>

            {/* Arrival Rate */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Arrival Rate (λ): {arrivalRate} pts/hr</span>
              </div>
              <input
                type="range"
                min="4"
                max="25"
                step="1"
                value={arrivalRate}
                onChange={(e) => setArrivalRate(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            {/* Service Rate */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Service Capacity (μ): {serviceRate} pts/hr</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={serviceRate}
                onChange={(e) => setServiceRate(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            {/* Emergency Ratio */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Emergency Prevalence: {emergencyRatio}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={emergencyRatio}
                onChange={(e) => setEmergencyRatio(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 space-y-1">
              <div>Sim Clock: <strong className="text-slate-800 dark:text-slate-200 font-mono">{simClockMinute} mins elapsed</strong></div>
              <div>Data Separation: <strong className="text-emerald-600 font-semibold">100% Isolated Sandbox</strong></div>
            </div>
          </div>
        </div>

        {/* Live Simulation KPIs */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Waiting Line</span>
            <div className="text-3xl font-black text-amber-500 font-mono my-2">{waitingCount}</div>
            <span className="text-[10px] text-slate-500">Synthetic in queue</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">In Consultation</span>
            <div className="text-3xl font-black text-sky-500 font-mono my-2">{servingCount}</div>
            <span className="text-[10px] text-slate-500">Currently serving</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Completed</span>
            <div className="text-3xl font-black text-emerald-500 font-mono my-2">{completedCount}</div>
            <span className="text-[10px] text-slate-500">Throughput achieved</span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400">Average Wait</span>
            <div className="text-3xl font-black text-purple-500 font-mono my-2">{avgWaitTime}m</div>
            <span className="text-[10px] text-slate-500">Empirical measurement</span>
          </div>

          {/* Timeline Real-time Chart */}
          <div className="col-span-2 sm:col-span-4 p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Queue Growth & Throughput Dynamics
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="minute" label={{ value: 'Simulation Minute', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="queueLength" name="Queue Depth" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="completedCount" name="Completed Patients" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* 3. SIMULATED PATIENTS TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Synthetic Cohort Registry ({simPatients.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {simClockMinute} mins simulated
          </span>
        </div>

        {simPatients.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Click &quot;Start Simulation&quot; above to begin synthetic patient arrivals.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr className="text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Patient Identity</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Arrival Min</th>
                  <th className="py-2.5 px-3">Service Duration</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Wait Experienced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
                {simPatients.slice(-25).reverse().map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{p.token_number}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-sans">{p.patient_name}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.priority === 'EMERGENCY' ? 'bg-rose-500 text-white' :
                        p.priority === 'PRIORITY' ? 'bg-amber-500 text-white' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {p.priority}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 font-sans">{p.type}</td>
                    <td className="py-2 px-3 text-slate-500">t = {p.arrival_minute}m</td>
                    <td className="py-2 px-3 text-slate-500">{p.service_duration}m</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        p.status === 'SERVING' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 animate-pulse' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-teal-600 dark:text-teal-400 font-bold">
                      {p.wait_duration !== undefined ? `${p.wait_duration}m` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
