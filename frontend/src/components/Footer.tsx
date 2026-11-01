import React from 'react';
import { Activity, Shield, HeartHandshake, PhoneCall, MapPin, Clock } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Overview */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                <Activity className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">
                MED<span className="text-sky-600">QUEUE</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Next-generation hospital queue management platform. Powered by queueing theory mathematics, priority triage scheduling, and real-time patient dispatching.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {isSupabaseConfigured ? 'Connected to Cloud PostgreSQL' : 'Local High-Fidelity Engine Active'}
            </div>
          </div>

          {/* Clinical Departments */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Departments
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>Cardiology & Heart Care</li>
              <li>Pediatrics & Child Wellness</li>
              <li>Orthopedic Surgery</li>
              <li>General Medicine</li>
              <li>Emergency & Trauma Bay</li>
            </ul>
          </div>

          {/* Core Algorithms */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Queueing Engine
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>FIFO (First-In, First-Out)</li>
              <li>LIFO (Last-In, First-Out)</li>
              <li>Priority Preemptive Scheduling</li>
              <li>M/M/1 Mathematical Model</li>
              <li>Realtime Voice Kiosk Dispatch</li>
            </ul>
          </div>

          {/* Hospital Contact Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Medical Center Desk
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Central Medical Complex, Metro Hub</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Emergency Hotline: (800) MED-QUEUE</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>24/7 Outpatient & Emergency Triage</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>© {new Date().getFullYear()} MedQueue Smart Hospital Systems. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-sky-500" />
              HIPAA Compliant Architecture
            </span>
            <span className="flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
              Patient-Centric Care
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
