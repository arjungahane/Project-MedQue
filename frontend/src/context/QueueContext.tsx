import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  QueueToken, 
  Department, 
  Doctor, 
  SchedulingMode, 
  PriorityLevel, 
  AuditLog, 
  NotificationItem, 
  QueueEvent 
} from '../types';
import { 
  INITIAL_DEPARTMENTS, 
  INITIAL_DOCTORS, 
  INITIAL_TOKENS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_NOTIFICATIONS 
} from '../lib/mockData';
import { audioAlert } from '../lib/sound';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface QueueContextType {
  departments: Department[];
  doctors: Doctor[];
  tokens: QueueToken[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  queueEvents: QueueEvent[];
  schedulingMode: SchedulingMode;
  setSchedulingMode: (mode: SchedulingMode) => void;
  generateToken: (departmentId: string, priority: PriorityLevel, notes?: string, customPatientName?: string) => Promise<QueueToken>;
  callNextToken: (doctorId: string, departmentId: string) => Promise<QueueToken | null>;
  startConsultation: (tokenId: string) => Promise<void>;
  completeConsultation: (tokenId: string) => Promise<void>;
  skipToken: (tokenId: string, reason: string) => Promise<void>;
  markAbsent: (tokenId: string) => Promise<void>;
  elevatePriority: (tokenId: string, priority: PriorityLevel) => Promise<void>;
  cancelToken: (tokenId: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  getTokensForDepartment: (deptId: string) => QueueToken[];
  getServingToken: (deptId: string) => QueueToken | undefined;
  getUpcomingTokens: (deptId: string) => QueueToken[];
  getQueuePositionForToken: (tokenId: string) => number;
  calculateEstimatedWait: (deptId: string, position: number) => number;
  refreshFromDatabase: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType | null>(null);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('medqueue_departments');
    return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('medqueue_doctors');
    return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
  });

  const [tokens, setTokens] = useState<QueueToken[]>(() => {
    const saved = localStorage.getItem('medqueue_tokens');
    return saved ? JSON.parse(saved) : INITIAL_TOKENS;
  });

  const [schedulingMode, setSchedulingModeState] = useState<SchedulingMode>(() => {
    const saved = localStorage.getItem('medqueue_scheduling_mode');
    return (saved as SchedulingMode) || 'FIFO';
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('medqueue_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('medqueue_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [queueEvents, setQueueEvents] = useState<QueueEvent[]>([]);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('medqueue_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('medqueue_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('medqueue_tokens', JSON.stringify(tokens));
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem('medqueue_scheduling_mode', schedulingMode);
  }, [schedulingMode]);

  useEffect(() => {
    localStorage.setItem('medqueue_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('medqueue_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Push audit log helper
  const addAuditLog = useCallback((action: string, targetTable: string, targetId?: string, details = '') => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_email: user?.email || 'system@medqueue.health',
      user_role: user?.role || 'system',
      action,
      target_table: targetTable,
      target_id: targetId,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 99)]);
  }, [user]);

  // Push notification helper
  const addNotification = useCallback((userId: string, title: string, message: string, type: 'INFO' | 'ALERT' | 'CALL' | 'STATUS_CHANGE' = 'INFO') => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // Supabase Realtime synchronization
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('medqueue-live-tokens')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tokens' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTokens(prev => [payload.new as QueueToken, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTokens(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
        } else if (payload.eventType === 'DELETE') {
          setTokens(prev => prev.filter(t => t.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

  const refreshFromDatabase = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data: dbTokens } = await supabase.from('queue_tokens').select('*').order('created_at', { ascending: false });
      if (dbTokens && dbTokens.length > 0) {
        setTokens(dbTokens as QueueToken[]);
      }
    } catch (err) {
      console.warn('Could not sync with Supabase:', err);
    }
  };

  const setSchedulingMode = (mode: SchedulingMode) => {
    setSchedulingModeState(mode);
    addAuditLog('SCHEDULING_MODE_CHANGED', 'system', undefined, `Strategy switched to ${mode}. Priority scheduling remains active.`);
  };

  // Calculate estimated wait time based on average doctor consultation time
  const calculateEstimatedWait = useCallback((deptId: string, position: number): number => {
    const deptDoctors = doctors.filter(d => d.department_id === deptId && d.is_available);
    const avgDoctorSpeed = deptDoctors.length > 0
      ? deptDoctors.reduce((acc, d) => acc + d.avg_consultation_minutes, 0) / deptDoctors.length
      : 12; // default 12 mins

    const activeServers = Math.max(1, deptDoctors.length);
    return Math.max(0, Math.round((position * avgDoctorSpeed) / activeServers));
  }, [doctors]);

  // Core Queue Sorting Engine: Evaluates FIFO/LIFO with Priority Precedence
  const getSortedWaitingTokens = useCallback((deptId: string): QueueToken[] => {
    const waiting = tokens.filter(t => t.department_id === deptId && t.status === 'WAITING');

    // 1. Separate by priority level
    const emergency = waiting.filter(t => t.priority_level === 'EMERGENCY');
    const priority = waiting.filter(t => t.priority_level === 'PRIORITY');
    const standard = waiting.filter(t => t.priority_level === 'STANDARD');

    // Emergency and Priority always served FIFO
    emergency.sort((a, b) => new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime());
    priority.sort((a, b) => new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime());

    // Standard group sorts according to chosen algorithm (FIFO vs LIFO)
    if (schedulingMode === 'LIFO') {
      standard.sort((a, b) => new Date(b.arrival_time).getTime() - new Date(a.arrival_time).getTime());
    } else {
      standard.sort((a, b) => new Date(a.arrival_time).getTime() - new Date(b.arrival_time).getTime());
    }

    // High priority always sits in front of standard queue
    return [...emergency, ...priority, ...standard];
  }, [tokens, schedulingMode]);

  const getTokensForDepartment = useCallback((deptId: string): QueueToken[] => {
    return tokens.filter(t => t.department_id === deptId);
  }, [tokens]);

  const getServingToken = useCallback((deptId: string): QueueToken | undefined => {
    return tokens.find(t => t.department_id === deptId && (t.status === 'IN_CONSULTATION' || t.status === 'CALLED'));
  }, [tokens]);

  const getUpcomingTokens = useCallback((deptId: string): QueueToken[] => {
    return getSortedWaitingTokens(deptId).slice(0, 6);
  }, [getSortedWaitingTokens]);

  const getQueuePositionForToken = useCallback((tokenId: string): number => {
    const targetToken = tokens.find(t => t.id === tokenId);
    if (!targetToken || targetToken.status !== 'WAITING') return 0;

    const sorted = getSortedWaitingTokens(targetToken.department_id);
    const index = sorted.findIndex(t => t.id === tokenId);
    return index !== -1 ? index + 1 : 0;
  }, [tokens, getSortedWaitingTokens]);

  // Generate department-specific unique token
  const generateToken = async (
    departmentId: string,
    priority: PriorityLevel = 'STANDARD',
    notes = '',
    customPatientName?: string
  ): Promise<QueueToken> => {
    const dept = departments.find(d => d.id === departmentId) || departments[0];

    // Find latest sequence number for department today
    const deptTokens = tokens.filter(t => t.department_id === departmentId);
    const sequenceNumber = deptTokens.length + 1;
    const tokenNumber = `${dept.code}-${100 + sequenceNumber}`;

    const patientId = user?.id || 'usr-patient-1';
    const waitingList = getSortedWaitingTokens(departmentId);
    const estimatedMinutes = calculateEstimatedWait(departmentId, waitingList.length + 1);

    const newToken: QueueToken = {
      id: `tok-${dept.code.toLowerCase()}-${Date.now()}`,
      token_number: tokenNumber,
      department_id: departmentId,
      department: dept,
      patient_id: patientId,
      priority_level: priority,
      status: 'WAITING',
      sequence_number: sequenceNumber,
      scheduling_mode: schedulingMode,
      room_number: dept.room_number,
      arrival_time: new Date().toISOString(),
      estimated_wait_minutes: estimatedMinutes,
      notes: notes || (customPatientName ? `Patient: ${customPatientName}` : 'Walk-in check-in'),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('queue_tokens').insert([{
          token_number: newToken.token_number,
          department_id: newToken.department_id,
          patient_id: newToken.patient_id,
          priority_level: newToken.priority_level,
          status: 'WAITING',
          sequence_number: newToken.sequence_number,
          scheduling_mode: newToken.scheduling_mode,
          room_number: newToken.room_number,
          arrival_time: newToken.arrival_time,
          estimated_wait_minutes: newToken.estimated_wait_minutes,
          notes: newToken.notes,
        }]);
      } catch (err) {
        console.warn('Supabase token insertion error:', err);
      }
    }

    setTokens(prev => [newToken, ...prev]);
    addAuditLog('TOKEN_GENERATED', 'queue_tokens', newToken.id, `Generated token ${newToken.token_number} (${priority}) for ${dept.name}`);
    addNotification(patientId, 'Token Generated', `Your token ${newToken.token_number} has been issued. Est. wait: ~${estimatedMinutes}m.`, 'STATUS_CHANGE');

    return newToken;
  };

  // Doctor Action: Call Next Patient according to algorithm
  const callNextToken = async (doctorId: string, departmentId: string): Promise<QueueToken | null> => {
    const doctor = doctors.find(d => d.id === doctorId);
    const sortedWaiting = getSortedWaitingTokens(departmentId);

    if (sortedWaiting.length === 0) {
      return null;
    }

    const nextToken = sortedWaiting[0];
    const roomNumber = doctor?.consultation_room || nextToken.room_number || 'Room 101';

    // Update token status to CALLED
    const updatedToken: QueueToken = {
      ...nextToken,
      status: 'CALLED',
      doctor_id: doctorId,
      room_number: roomNumber,
      called_time: new Date().toISOString(),
    };

    setTokens(prev => prev.map(t => t.id === nextToken.id ? updatedToken : t));

    // Update doctor's current active token
    setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, current_token: updatedToken.token_number } : d));

    // Play chime & Speech Synthesis announcement
    audioAlert.announceToken(updatedToken.token_number, roomNumber, user?.role === 'doctor' ? undefined : undefined);

    addAuditLog('TOKEN_CALLED', 'queue_tokens', nextToken.id, `Called ${updatedToken.token_number} to ${roomNumber} by Dr. ${doctor?.profile?.full_name || 'Staff'}`);
    addNotification(nextToken.patient_id, 'Your Turn!', `Token ${updatedToken.token_number} is called to ${roomNumber}. Please proceed immediately.`, 'CALL');

    const event: QueueEvent = {
      id: `ev-${Date.now()}`,
      token_id: nextToken.id,
      token_number: nextToken.token_number,
      department_id: departmentId,
      event_type: 'CALLED',
      performed_by_name: doctor?.specialization || 'Staff',
      created_at: new Date().toISOString(),
    };
    setQueueEvents(prev => [event, ...prev]);

    return updatedToken;
  };

  const startConsultation = async (tokenId: string) => {
    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'IN_CONSULTATION',
          consultation_start_time: new Date().toISOString(),
        };
      }
      return t;
    }));
    addAuditLog('CONSULTATION_STARTED', 'queue_tokens', tokenId, `Consultation started for token.`);
  };

  const completeConsultation = async (tokenId: string) => {
    const target = tokens.find(t => t.id === tokenId);
    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'COMPLETED',
          completed_time: new Date().toISOString(),
        };
      }
      return t;
    }));

    if (target?.doctor_id) {
      setDoctors(prev => prev.map(d => d.id === target.doctor_id ? { ...d, current_token: undefined } : d));
    }

    addAuditLog('CONSULTATION_COMPLETED', 'queue_tokens', tokenId, `Consultation completed for ${target?.token_number}`);
    if (target) {
      addNotification(target.patient_id, 'Consultation Completed', `Your consultation for token ${target.token_number} is finished. Thank you!`, 'STATUS_CHANGE');
    }
  };

  const skipToken = async (tokenId: string, reason: string) => {
    const target = tokens.find(t => t.id === tokenId);
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, status: 'SKIPPED', skip_reason: reason } : t));
    addAuditLog('TOKEN_SKIPPED', 'queue_tokens', tokenId, `Skipped ${target?.token_number}. Reason: ${reason}`);
    if (target) {
      addNotification(target.patient_id, 'Token Skipped', `Token ${target.token_number} was skipped: ${reason}. Contact reception to rejoin queue.`, 'ALERT');
    }
  };

  const markAbsent = async (tokenId: string) => {
    const target = tokens.find(t => t.id === tokenId);
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, status: 'ABSENT' } : t));
    addAuditLog('TOKEN_ABSENT', 'queue_tokens', tokenId, `Marked ${target?.token_number} as absent.`);
  };

  const elevatePriority = async (tokenId: string, priority: PriorityLevel) => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, priority_level: priority } : t));
    addAuditLog('PRIORITY_ELEVATED', 'queue_tokens', tokenId, `Priority adjusted to ${priority}`);
  };

  const cancelToken = async (tokenId: string) => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, status: 'CANCELLED' } : t));
    addAuditLog('TOKEN_CANCELLED', 'queue_tokens', tokenId, `Token was cancelled.`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <QueueContext.Provider
      value={{
        departments,
        doctors,
        tokens,
        notifications,
        auditLogs,
        queueEvents,
        schedulingMode,
        setSchedulingMode,
        generateToken,
        callNextToken,
        startConsultation,
        completeConsultation,
        skipToken,
        markAbsent,
        elevatePriority,
        cancelToken,
        markNotificationRead,
        clearNotifications,
        getTokensForDepartment,
        getServingToken,
        getUpcomingTokens,
        getQueuePositionForToken,
        calculateEstimatedWait,
        refreshFromDatabase,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
