import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  Tv, 
  BarChart3, 
  FlaskConical, 
  User, 
  Bell, 
  Moon, 
  Sun, 
  LogOut, 
  ChevronDown, 
  ShieldCheck,
  Stethoscope,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, role, logout, quickLoginAs, isAuthenticated } = useAuth();
  const { notifications, markNotificationRead, clearNotifications } = useQueue();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getDashboardPath = () => {
    switch (role) {
      case 'doctor':
        return '/doctor';
      case 'staff':
        return '/staff';
      case 'admin':
        return '/admin';
      case 'patient':
      default:
        return '/patient';
    }
  };

  const roleBadgeColors: Record<UserRole, string> = {
    patient: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-300',
    doctor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300',
    staff: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300',
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-300',
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  MED<span className="text-sky-600 dark:text-sky-400">QUEUE</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  SMART v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Hospital Queue Management
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/' 
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Overview
            </Link>

            <Link
              to="/display"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/display' 
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4 text-teal-500" />
              <span>TV Display</span>
            </Link>

            <Link
              to="/analytics"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/analytics' 
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>M/M/1 Analytics</span>
            </Link>

            <Link
              to="/simulation"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/simulation' 
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FlaskConical className="w-4 h-4 text-emerald-500" />
              <span>Simulator</span>
            </Link>

            {isAuthenticated && (
              <Link
                to={getDashboardPath()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.pathname.startsWith('/patient') || 
                  location.pathname.startsWith('/doctor') || 
                  location.pathname.startsWith('/staff') || 
                  location.pathname.startsWith('/admin')
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50' 
                    : 'text-slate-700 dark:text-slate-200 hover:text-sky-600'
                }`}
              >
                <span>Dashboard</span>
              </Link>
            )}
          </nav>

          {/* Right Action Tools: Role Switcher, Notifications, Dark Mode, Auth */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Quick Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(prev => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Switch role for demo testing"
              >
                <span className="hidden sm:inline">Role:</span>
                <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold uppercase border ${role ? roleBadgeColors[role] : 'bg-slate-200 text-slate-800'}`}>
                  {role || 'Guest'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {showRoleMenu && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50"
                  onMouseLeave={() => setShowRoleMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    One-Click Demo Switcher
                  </div>
                  
                  <button
                    onClick={() => { quickLoginAs('patient'); setShowRoleMenu(false); navigate('/patient'); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/60"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-500" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">Patient Portal</div>
                        <div className="text-[10px] text-slate-400">patient@medqueue.health</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => { quickLoginAs('doctor'); setShowRoleMenu(false); navigate('/doctor'); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/60"
                  >
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">Doctor Desk</div>
                        <div className="text-[10px] text-slate-400">Dr. Sarah (Cardiology)</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => { quickLoginAs('staff'); setShowRoleMenu(false); navigate('/staff'); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/60"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">Staff / Triage Desk</div>
                        <div className="text-[10px] text-slate-400">Nurse Wilson (FIFO/LIFO)</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => { quickLoginAs('admin'); setShowRoleMenu(false); navigate('/admin'); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/60"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">Hospital Director (Admin)</div>
                        <div className="text-[10px] text-slate-400">Full System Governance</div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Drawer */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(prev => !prev)}
                className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 py-3 z-50"
                  onMouseLeave={() => setShowNotifications(false)}
                >
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Live Notifications</h4>
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearNotifications}
                        className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No active queue notifications.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${!n.is_read ? 'bg-sky-50/50 dark:bg-sky-950/20' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* User Profile or Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => navigate(getDashboardPath())}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <img
                    src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || 'U'}`}
                    alt="User"
                    className="w-8 h-8 rounded-full border border-sky-500 object-cover"
                  />
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {user?.full_name?.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      {user?.role}
                    </div>
                  </div>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
              >
                Sign In
              </Link>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
