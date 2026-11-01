import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Volume2, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { QueueToken } from '../types';
import { audioAlert } from '../lib/sound';

interface QueueTicketModalProps {
  token: QueueToken;
  position: number;
  onClose: () => void;
}

export const QueueTicketModal: React.FC<QueueTicketModalProps> = ({ token, position, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleTestAudio = () => {
    audioAlert.announceToken(token.token_number, token.room_number);
  };

  const priorityStyles: Record<string, { bg: string; text: string; label: string }> = {
    EMERGENCY: { bg: 'bg-rose-500 text-white', text: 'text-rose-600', label: '🚨 EMERGENCY PRIORITY' },
    PRIORITY: { bg: 'bg-amber-500 text-white', text: 'text-amber-600', label: '⚡ FAST-TRACK PRIORITY' },
    STANDARD: { bg: 'bg-sky-600 text-white', text: 'text-sky-600', label: 'STANDARD ADMISSION' },
  };

  const currentPriority = priorityStyles[token.priority_level] || priorityStyles.STANDARD;

  // The QR code contains verified token ticket data that hospital scanners can read
  const qrData = JSON.stringify({
    token: token.token_number,
    id: token.id,
    dept: token.department?.name || 'Medical Clinic',
    room: token.room_number,
    issued: token.arrival_time,
    verification: 'MEDQUEUE-AUTHENTICATED',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header bar */}
        <div className={`p-4 text-center ${currentPriority.bg} flex items-center justify-between`}>
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Digital Queue Pass</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Content Area */}
        <div className="p-6 text-center space-y-5">
          
          <div>
            <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
              {token.department?.name || 'Department Clinic'}
            </span>
            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1 font-mono">
              {token.token_number}
            </div>
            <div className="mt-1">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${currentPriority.bg}`}>
                {currentPriority.label}
              </span>
            </div>
          </div>

          {/* QR Code Graphic */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 dark:border-slate-700">
              <QRCodeSVG
                value={qrData}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Estimated Waiting metrics */}
          <div className="grid grid-cols-2 gap-3 py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-left">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Queue Position</span>
              <div className="text-xl font-bold text-sky-600 dark:text-sky-400">
                {position > 0 ? `#${position} in line` : 'Serving / Ready'}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Est. Wait Time</span>
              <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                ~{token.estimated_wait_minutes} mins
              </div>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Assigned Counter / Room:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{token.room_number || 'Room 101'}</span>
            </div>
          </div>

          {/* Notification status */}
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Real-time voice chime and screen alerts active</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleTestAudio}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-sky-500" />
              <span>Voice Preview</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Ticket</span>
            </button>
          </div>

        </div>

        {/* Footer instructions */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            Keep this ticket ready at the door
          </span>
          <span className="font-mono">MEDQ-{token.token_number}</span>
        </div>

      </div>
    </div>
  );
};
