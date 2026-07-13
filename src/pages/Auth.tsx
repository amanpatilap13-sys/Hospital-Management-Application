import React, { useState } from 'react';
import { Activity, LogIn } from 'lucide-react';
import { getDB } from '../utils/mockDb';
import type { Patient, Doctor } from '../utils/mockDb';

interface AuthProps {
  onLogin: (user: { id: string; name: string; role: 'patient' | 'doctor' | 'admin'; email: string }) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [role, setRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password'); // Demo password prefill
  const [error, setError] = useState('');

  const db = getDB();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'admin') {
      if (email === 'admin@hospital.com' || email === 'admin') {
        onLogin({ id: 'admin', name: 'System Administrator', role: 'admin', email: 'admin@hospital.com' });
      } else {
        setError('Invalid admin credentials. Use admin@hospital.com');
      }
      return;
    }

    if (role === 'patient') {
      const patient = db.patients.find((p: Patient) => p.email.toLowerCase() === email.toLowerCase());
      if (patient) {
        onLogin({ id: patient.id, name: patient.name, role: 'patient', email: patient.email });
      } else {
        setError('Patient not found. Use john@example.com or alice@example.com');
      }
      return;
    }

    if (role === 'doctor') {
      const doctor = db.doctors.find((d: Doctor) => d.email.toLowerCase() === email.toLowerCase());
      if (doctor) {
        onLogin({ id: doctor.id, name: doctor.name, role: 'doctor', email: doctor.email });
      } else {
        setError('Doctor not found. Use sarah.connor@hospital.com or alex.pierce@hospital.com');
      }
      return;
    }
  };

  const handleDemoSelect = (demoEmail: string, demoRole: 'patient' | 'doctor' | 'admin') => {
    setRole(demoRole);
    setEmail(demoEmail);
    setPassword('password');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
    }}>
      {/* Decorative Blur Shapes */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '20%',
        width: '300px',
        height: '300px',
        background: 'rgba(59, 130, 246, 0.15)',
        filter: 'blur(100px)',
        borderRadius: '50%',
        zIndex: 0,
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '20%',
        width: '300px',
        height: '300px',
        background: 'rgba(168, 85, 247, 0.15)',
        filter: 'blur(100px)',
        borderRadius: '50%',
        zIndex: 0,
      }}></div>

      <div 
        className="glass animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '40px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
            color: 'white',
            marginBottom: '16px',
            boxShadow: '0 8px 24px var(--primary-glow)',
          }}>
            <Activity size={32} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>Schedula Care</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Smart Hospital Appointment & Virtual Consultation</p>
        </div>

        {/* Role Toggle Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '24px',
          border: '1px solid var(--border-color)',
        }}>
          {(['patient', 'doctor', 'admin'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setRole(tab);
                setError('');
                setEmail('');
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: role === tab ? 'hsl(var(--primary))' : 'transparent',
                color: role === tab ? 'white' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: 'var(--danger-glow)',
            color: 'hsl(var(--danger))',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '0.85rem',
            marginBottom: '20px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={role === 'admin' ? 'admin@hospital.com' : `Enter ${role} email`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="text-input"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="text-input"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '14px' }}
          >
            <LogIn size={18} />
            Sign In
          </button>
        </form>

        {/* Demo Fast Login Quick Access */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center', fontWeight: 600 }}>
            QUICK ACCESS DEMO ACCOUNTS
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => handleDemoSelect('john@example.com', 'patient')}
              className="glass-interactive"
              style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Patient: John Doe</span>
              <span style={{ color: 'hsl(var(--primary))' }}>john@example.com</span>
            </button>
            <button
              onClick={() => handleDemoSelect('sarah.connor@hospital.com', 'doctor')}
              className="glass-interactive"
              style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Doctor: Dr. Sarah Connor</span>
              <span style={{ color: 'hsl(var(--primary))' }}>sarah.connor@hospital.com</span>
            </button>
            <button
              onClick={() => handleDemoSelect('admin@hospital.com', 'admin')}
              className="glass-interactive"
              style={{ padding: '8px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Administrator</span>
              <span style={{ color: 'hsl(var(--primary))' }}>admin@hospital.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
