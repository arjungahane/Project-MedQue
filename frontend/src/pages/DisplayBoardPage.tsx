import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Clock, 
  Activity, 
  Maximize, 
  Minimize, 
  Sparkles, 
  DoorOpen, 
  CheckCircle2,
  BellRing
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import { audioAlert } from '../lib/sound';

export const DisplayBoardPage: React.FC = () => {
  const { departments, tokens, schedulingMode } = useQueue();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live digital clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleTestChime = () => {
    audioAlert.playChime();
  };

  const handleTestAnnouncement = () => {
    const serving = tokens.find(t => t.status === 'CALLED' || t.status === 'IN_CONSULTATION');
    if (serving) {
      audioAlert.announceToken(serving.token_number, serving.room_number);
    } else {
      audioAlert.announceToken('CARD-102', 'Room 204');
    }
  };

  // Filter departments to display
  const deptsToDisplay = selectedDeptId === 'ALL'
    ? departments
    : departments.filter(d => d.id === selectedDeptId);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      
      {/* 1. KIOSK HEADER BAR */}
      <header className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-800 gap-4">
        
        {/* Hospital Branding */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
            <Activity className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-white">
                MED<span className="text-sky-400">QUEUE</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                LIVE KIOSK
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Central Hospital Patient Calling & Dispatch System
            </p>
          </div>
        </div>

        {/* Central Controls: Department Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 hidden md:inline">Department:</span>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Departments (Multi-Bay View)</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        {/* Live Clock & Audio Controls */}
        <div className="flex items-center gap-4">
          
          {/* Sound Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestAnnouncement}
              className="px-3 py-1.5 rounded-lg bg-sky-900/60 hover:bg-sky-800 border border-sky-600/40 text-[11px] font-bold text-sky-300 flex items-center gap-1.5 transition-colors"
              title="Test Voice Announcement"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voice Test</span>
            </button>
            <button
              onClick={handleTestChime}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
              title="Test Chime Sound"
            >
              <BellRing className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>

          {/* Digital Clock */}
          <div className="text-right pl-4 border-l border-slate-800">
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

        </div>

      </header>

      {/* 2. REALTIME MULTI-DEPARTMENT CALL GRID */}
      <main className="my-8 flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {deptsToDisplay.map(dept => {
          const deptTokens = tokens.filter(t => t.department_id === dept.id);
          
          // Current serving or called token
          const currentToken = deptTokens.find(t => t.status === 'CALLED' || t.status === 'IN_CONSULTATION');
          
          // Waiting queue for this department
          const waitingQueue = deptTokens.filter(t => t.status === 'WAITING').slice(0, 5);
          const totalWaiting = deptTokens.filter(t => t.status === 'WAITING').length;

          return (
            <div
              key={dept.id}
              className="rounded-3xl bg-slate-900 border-2 border-slate-800/80 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-sky-500/50 transition-colors"
            >
              
              {/* Department Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 text-sky-400 font-mono font-black text-xs border border-sky-500/30">
                      {dept.code}
                    </span>
                    <h2 className="text-xl font-bold tracking-tight text-white">{dept.name}</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{dept.floor} &bull; {dept.room_number}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Waiting</span>
                  <span className="text-base font-black text-amber-400">{totalWaiting} pts</span>
                </div>
              </div>

              {/* CURRENTLY SERVING TOKEN CALL BOX */}
              <div className="my-6 text-center">
                <span className="text-xs uppercase font-extrabold tracking-widest text-teal-400 block mb-2">
                  NOW SERVING
                </span>

                {currentToken ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-sky-950/80 to-slate-900 border-2 border-sky-400/80 shadow-2xl shadow-sky-500/20 animate-pulse-glow">
                    <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white">
                      {currentToken.token_number}
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-sky-500 text-slate-950">
                        {currentToken.room_number || dept.room_number}
                      </span>
                      {currentToken.priority_level !== 'STANDARD' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-rose-500 text-white animate-pulse">
                          {currentToken.priority_level}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-teal-300 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Proceed to Consultation Room</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-500">
                    <span className="text-sm font-semibold">Doctor Bay Ready</span>
                    <p className="text-xs text-slate-600 mt-1">Awaiting patient call</p>
                  </div>
                )}
              </div>

              {/* UP NEXT QUEUE LIST */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-3">
                  <span>UPCOMING PATIENTS</span>
                  <span>EST. WAIT</span>
                </div>

                {waitingQueue.length === 0 ? (
                  <div className="text-center py-3 text-xs text-slate-600 font-medium">
                    No waiting tokens in this department.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {waitingQueue.map((tok, idx) => (
                      <div
                        key={tok.id}
                        className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2.5 font-mono">
                          <span className="text-slate-500 font-bold text-[11px]">#{idx + 1}</span>
                          <span className="text-white font-bold">{tok.token_number}</span>
                          {tok.priority_level !== 'STANDARD' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {tok.priority_level}
                            </span>
                          )}
                        </div>
                        <span className="text-teal-400 font-semibold text-xs">
                          ~{tok.estimated_wait_minutes} mins
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </main>

      {/* 3. FOOTER STATUS BAR */}
      <footer className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-white font-semibold">MedQueue Real-Time Hospital Dispatch</span>
          <span>&bull; Strategy: <strong className="text-sky-400">{schedulingMode}</strong></span>
        </div>
        <div className="text-[11px] text-slate-500">
          Audio synthesizer enabled &bull; Please listen for your token announcement
        </div>
      </footer>

    </div>
  );
};
