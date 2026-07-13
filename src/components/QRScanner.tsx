import React, { useState } from 'react';
import { QrCode, CheckCircle, AlertTriangle, Scan } from 'lucide-react';
import { getDB, saveDB, addNotification } from '../utils/mockDb';
import type { Appointment } from '../utils/mockDb';

interface QRScannerProps {
  onScanSuccess?: (appointment: Appointment) => void;
  role: 'admin' | 'patient';
  appointment?: Appointment;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, role, appointment }) => {
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generate a mock SVG QR Code pattern based on appointment details
  const renderQRCodeSVG = (data: string) => {
    // Generate deterministic dark/light modules based on string hashing
    const size = 15;
    const modules: boolean[][] = [];
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = data.charCodeAt(i) + ((hash << 5) - hash);
    }

    for (let r = 0; r < size; r++) {
      modules[r] = [];
      for (let c = 0; c < size; c++) {
        // Finder patterns (corners)
        const isFinder = 
          (r < 4 && c < 4) || // Top-left
          (r < 4 && c >= size - 4) || // Top-right
          (r >= size - 4 && c < 4); // Bottom-left
        
        if (isFinder) {
          // Standard finder pattern layout (outer ring and inner dot)
          const isRing = (r === 0 || r === 3 || c === 0 || c === 3) || 
                         (r === 0 || r === 3 || c === size - 1 || c === size - 4) ||
                         (r === size - 1 || r === size - 4 || c === 0 || c === 3);
          modules[r][c] = !isRing;
        } else {
          // Pseudorandom modules based on text data hash
          const val = Math.abs(Math.sin(hash + r * 13 + c * 37));
          modules[r][c] = val > 0.45;
        }
      }
    }

    return (
      <svg width="200" height="200" viewBox={`0 0 ${size} ${size}`} style={{ background: '#fff', padding: '12px', borderRadius: '12px' }}>
        {modules.map((row, r) => 
          row.map((active, c) => (
            <rect 
              key={`${r}-${c}`}
              x={c}
              y={r}
              width="1"
              height="1"
              fill={active ? '#0f111a' : '#fff'}
            />
          ))
        )}
      </svg>
    );
  };

  // Simulates scanning an appointment QR code
  const handleScanSimulation = (app: Appointment) => {
    setScanning(true);
    setSuccess(null);
    setError(null);

    setTimeout(() => {
      setScanning(false);
      const db = getDB();
      const targetApp = db.appointments.find((a: Appointment) => a.id === app.id);
      
      if (!targetApp) {
        setError('Invalid appointment QR code token.');
        return;
      }

      if (targetApp.status !== 'scheduled') {
        setError(`Appointment already ${targetApp.status}.`);
        return;
      }

      // Check-in patient
      targetApp.status = 'checked-in';
      saveDB(db);
      
      addNotification(
        targetApp.patientId,
        'Checked In Successfully',
        `You have been checked in for your appointment with ${targetApp.doctorName}. Please proceed to the waiting area.`
      );

      addNotification(
        targetApp.doctorId,
        'Patient Checked In',
        `Patient ${targetApp.patientName} has checked in for the ${targetApp.time} appointment.`
      );

      setSuccess(`Successfully Checked In ${targetApp.patientName}!`);
      
      if (onScanSuccess) {
        onScanSuccess(targetApp);
      }
    }, 1500);
  };

  if (role === 'patient' && appointment) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px' }}>
        <div style={{ padding: '16px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          {renderQRCodeSVG(JSON.stringify({
            id: appointment.id,
            patientId: appointment.patientId,
            time: appointment.time,
            date: appointment.date,
          }))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Your Check-in Pass</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Show this QR code at the reception desk to check in instantly.</p>
        </div>
      </div>
    );
  }

  // Admin view - Simulated receptionist scanner
  const db = getDB();
  const scheduledApps = db.appointments.filter((a: Appointment) => a.status === 'scheduled');

  return (
    <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'var(--primary-glow)', padding: '8px', borderRadius: '10px' }}>
          <Scan size={24} color="hsl(var(--primary))" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem' }}>Simulated QR Check-in Terminal</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scan incoming patient check-in codes at the front desk</p>
        </div>
      </div>

      {scanning ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', gap: '16px', border: '2px dashed var(--border-focus)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
          <div className="pulse-glow" style={{ width: '60px', height: '60px', border: '3px solid hsl(var(--primary))', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Scanning check-in QR Code...</span>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', background: 'rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>Select Patient QR Code to Simulate Scan:</p>
          
          {scheduledApps.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              No scheduled appointments found to check in.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {scheduledApps.map((app: Appointment) => (
                <button
                  key={app.id}
                  onClick={() => handleScanSimulation(app)}
                  className="glass-interactive"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-secondary)',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, display: 'block' }}>{app.patientName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>with {app.doctorName} • {app.time}</span>
                  </div>
                  <QrCode size={16} color="hsl(var(--primary))" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--success-glow)', color: 'hsl(var(--success))', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.85rem' }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--danger-glow)', color: 'hsl(var(--danger))', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '0.85rem' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
