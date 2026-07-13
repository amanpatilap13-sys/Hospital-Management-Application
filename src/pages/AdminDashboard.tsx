import React, { useState, useEffect } from 'react';
import { Activity, Users, LogOut, BarChart, Server } from 'lucide-react';
import { getDB } from '../utils/mockDb';
import type { Appointment, Doctor, TimeSlot } from '../utils/mockDb';
import { NotificationToast } from '../components/NotificationToast';
import { QRScanner } from '../components/QRScanner';

interface AdminDashboardProps {
  user: { name: string; email: string };
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [db, setDb] = useState(getDB());
  const [logs, setLogs] = useState<string[]>([]);

  const refreshDb = () => {
    const freshDb = getDB();
    setDb(freshDb);
  };

  useEffect(() => {
    refreshDb();
    
    // Seed initial mock logs
    setLogs([
      `[${new Date().toLocaleTimeString()}] Schedula API gateway started.`,
      `[${new Date().toLocaleTimeString()}] Encrypted WebRTC signaling channels opened.`,
      `[${new Date().toLocaleTimeString()}] Seed doctors and patients loaded into memory.`
    ]);

    const handleUpdate = () => {
      refreshDb();
      setLogs(prev => [
        `[${new Date().toLocaleTimeString()}] Database update: State synced across clients.`,
        ...prev
      ]);
    };

    window.addEventListener('hms_notification', handleUpdate);
    return () => window.removeEventListener('hms_notification', handleUpdate);
  }, []);

  const totalAppointments = db.appointments.length;
  const checkedInCount = db.appointments.filter((a: Appointment) => a.status === 'checked-in' || a.status === 'in-progress' || a.status === 'completed').length;
  const activeConsults = db.appointments.filter((a: Appointment) => a.status === 'in-progress').length;
  
  const checkinRate = totalAppointments > 0 ? Math.round((checkedInCount / totalAppointments) * 100) : 0;

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header 
        style={{
          padding: '16px 40px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(19, 22, 34, 0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--primary-glow)', padding: '8px', borderRadius: '10px' }}>
            <Activity size={24} color="hsl(var(--primary))" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Schedula Care</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin Operations Control</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 600, display: 'block', fontSize: '0.9rem' }}>{user.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--danger))' }}>System Administrator</span>
          </div>
          <NotificationToast currentUserId="admin" />
          <button 
            onClick={onLogout}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'hsl(var(--danger))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            className="glass-interactive"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Admin Content Area */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1440px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
        
        {/* Left Side: Stats and System Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="glass" style={{ padding: '24px', position: 'relative' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>TOTAL APPOINTMENTS</span>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>{totalAppointments}</span>
              <div style={{ position: 'absolute', right: '20px', bottom: '20px', color: 'hsl(var(--primary))', opacity: 0.15 }}>
                <BarChart size={40} />
              </div>
            </div>

            <div className="glass" style={{ padding: '24px', position: 'relative' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>CHECK-IN RATE</span>
              <span style={{ fontSize: '2rem', fontWeight: 800 }}>{checkinRate}%</span>
              <div style={{ background: 'var(--border-color)', height: '4px', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ background: 'hsl(var(--success))', height: '100%', width: `${checkinRate}%` }}></div>
              </div>
            </div>

            <div className="glass" style={{ padding: '24px', position: 'relative' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>ACTIVE VIDEO ROOMS</span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'hsl(var(--warning))' }}>{activeConsults}</span>
              <div style={{ position: 'absolute', right: '20px', bottom: '20px', color: 'hsl(var(--warning))', opacity: 0.15 }}>
                <Server size={40} />
              </div>
            </div>
          </div>

          {/* Doctors Availability and Slots Schedule */}
          <div className="glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="hsl(var(--primary))" />
              Doctor Calendars & Active Slots
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {db.doctors.map((d: Doctor) => (
                <div key={d.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 700 }}>{d.name} ({d.specialty})</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.availableSlots.length} Total Slots</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {d.availableSlots.map((slot: TimeSlot) => (
                      <span 
                        key={slot.id} 
                        className={`badge ${slot.isBooked ? 'badge-danger' : 'badge-success'}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {slot.time} • {slot.isBooked ? 'Booked' : 'Available'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Console Logs */}
          <div className="glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="hsl(var(--accent))" />
              Live Diagnostics Console Logs
            </h3>
            <div 
              style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: 'hsl(var(--success))',
                background: '#040508',
                padding: '16px',
                borderRadius: '8px',
                minHeight: '140px',
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Reception Desk Check-in Scanner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <QRScanner role="admin" onScanSuccess={() => refreshDb()} />
        </div>

      </main>
    </div>
  );
};
