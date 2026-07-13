import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Video, QrCode, LogOut, Clock, Activity, Download } from 'lucide-react';
import { getDB, saveDB, addNotification } from '../utils/mockDb';
import type { Doctor, Appointment, Prescription, TimeSlot } from '../utils/mockDb';
import { NotificationToast } from '../components/NotificationToast';
import { QRScanner } from '../components/QRScanner';

interface PatientDashboardProps {
  user: { id: string; name: string; email: string };
  onLogout: () => void;
  onLaunchVideo: (roomName: string, docName: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ user, onLogout, onLaunchVideo }) => {
  const [db, setDb] = useState(getDB());
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [viewingQRApp, setViewingQRApp] = useState<Appointment | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);

  // Sync state with local DB updates
  const refreshDb = () => {
    setDb(getDB());
  };

  useEffect(() => {
    refreshDb();
    // Refresh if any status updates happen in window notifications
    const handleUpdate = () => refreshDb();
    window.addEventListener('hms_notification', handleUpdate);
    return () => window.removeEventListener('hms_notification', handleUpdate);
  }, []);

  const specialties = ['All', ...Array.from(new Set(db.doctors.map((d: Doctor) => d.specialty)))] as string[];
  const filteredDoctors = selectedSpecialty === 'All' 
    ? db.doctors 
    : db.doctors.filter((d: Doctor) => d.specialty === selectedSpecialty);

  const patientAppointments = db.appointments.filter((a: Appointment) => a.patientId === user.id);
  const patientPrescriptions = db.prescriptions.filter((p: Prescription) => p.patientId === user.id);

  // Handle Book Appointment
  const bookAppointment = (doctor: Doctor, slot: TimeSlot) => {
    const updatedDb = getDB();
    
    // Find doc and slot in db
    const targetDoc = updatedDb.doctors.find((d: Doctor) => d.id === doctor.id);
    if (!targetDoc) return;
    
    const targetSlot = targetDoc.availableSlots.find((s: TimeSlot) => s.id === slot.id);
    if (!targetSlot || targetSlot.isBooked) return;

    // Mark slot as booked
    targetSlot.isBooked = true;
    targetSlot.bookedByPatientId = user.id;
    targetSlot.patientName = user.name;

    // Create Appointment
    const newAppointment: Appointment = {
      id: `app-${Date.now()}`,
      patientId: user.id,
      patientName: user.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      date: slot.date,
      time: slot.time,
      status: 'scheduled',
      qrCodeData: `CHECKIN-${doctor.id}-${user.id}-${slot.id}`,
      videoLink: `https://meet.schedulacare.com/${doctor.id}-${user.id}`,
    };

    updatedDb.appointments.push(newAppointment);
    saveDB(updatedDb);
    setDb(updatedDb);
    setSelectedDoctor(null);

    // Toast notification
    addNotification(
      user.id,
      'Appointment Booked!',
      `Your appointment with ${doctor.name} on ${slot.date} at ${slot.time} has been scheduled.`
    );
    
    addNotification(
      doctor.id,
      'New Booking Received',
      `Patient ${user.name} booked a slot on ${slot.date} at ${slot.time}.`
    );
  };

  const handleDownloadPrescription = (p: Prescription) => {
    // Simulated prescription download
    const element = document.createElement("a");
    const file = new Blob([
      `SCHEDULA CLINIC PRESCRIPTION\n`,
      `============================\n`,
      `Date: ${p.date}\n`,
      `Doctor: ${p.doctorName}\n`,
      `Patient: ${p.patientName}\n\n`,
      `Diagnoses: ${p.diagnoses}\n\n`,
      `Medications:\n`,
      p.medications.map(m => `- ${m.name}: ${m.dosage} (${m.frequency}) for ${m.duration}`).join('\n'),
      `\n\nInstructions: ${p.instructions}\n`,
      `============================\n`,
      `Digitally Signed By: ${p.signature}`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Prescription-${p.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient Portal</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 600, display: 'block', fontSize: '0.9rem' }}>{user.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</span>
          </div>
          <NotificationToast currentUserId={user.id} />
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

      {/* Main Content Layout */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1440px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
        
        {/* Left Primary Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Welcome Intro Banner */}
          <div 
            className="glass"
            style={{
              padding: '30px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Welcome back, {user.name}!</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '0.95rem' }}>
              Manage your healthcare securely. Book a checkup, join active video consultations, and access your prescription logs immediately.
            </p>
          </div>

          {/* Doctors List & Specialty Filter */}
          <div className="glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="hsl(var(--primary))" />
                Find and Book a Doctor
              </h3>
              
              {/* Specialty Filtering */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {specialties.map((spec: string) => (
                  <button
                    key={spec}
                    onClick={() => setSelectedSpecialty(spec)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: selectedSpecialty === spec ? 'hsl(var(--primary))' : 'var(--bg-tertiary)',
                      color: selectedSpecialty === spec ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Doctors Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredDoctors.map((doctor: Doctor) => (
                <div key={doctor.id} className="glass-interactive" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }} onClick={() => setSelectedDoctor(doctor)}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <img 
                      src={doctor.photoUrl} 
                      alt={doctor.name} 
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{doctor.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', fontWeight: 600 }}>{doctor.specialty}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doctor.email}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {doctor.availableSlots.filter((s: TimeSlot) => !s.isBooked).length} slots available
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', fontWeight: 600 }}>Book Appt →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Book Appointment Modal / Drawer Overlay */}
          {selectedDoctor && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
              className="animate-fade-in"
            >
              <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Select Slot with {selectedDoctor.name}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Specialty: {selectedDoctor.specialty}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                  {selectedDoctor.availableSlots.filter((s: TimeSlot) => !s.isBooked).length === 0 ? (
                    <p style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0' }}>
                      No available slots left for today.
                    </p>
                  ) : (
                    selectedDoctor.availableSlots.filter((s: TimeSlot) => !s.isBooked).map((slot: TimeSlot) => (
                      <button
                        key={slot.id}
                        onClick={() => bookAppointment(selectedDoctor, slot)}
                        className="glass-interactive"
                        style={{
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{slot.time}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{slot.date}</span>
                      </button>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedDoctor(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Active Consultation QR Code modal */}
          {viewingQRApp && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
              className="animate-fade-in"
            >
              <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '30px', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Check-in QR Pass</h3>
                <QRScanner role="patient" appointment={viewingQRApp} />
                <button className="btn btn-secondary" style={{ marginTop: '16px', width: '100%' }} onClick={() => setViewingQRApp(null)}>Close Pass</button>
              </div>
            </div>
          )}

          {/* Prescription Viewer Overlay */}
          {viewingPrescription && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
              }}
              className="animate-fade-in"
            >
              <div className="glass" style={{ width: '100%', maxWidth: '550px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem' }}>Medical Prescription</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dated: {viewingPrescription.date}</span>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={() => handleDownloadPrescription(viewingPrescription)}>
                    <Download size={16} />
                  </button>
                </div>

                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PRESCRIBING PHYSICIAN</p>
                  <p style={{ fontWeight: 700 }}>{viewingPrescription.doctorName}</p>
                </div>

                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>DIAGNOSES / FINDINGS</p>
                  <p style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    {viewingPrescription.diagnoses}
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>RECOMMENDED RX MEDICATIONS</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {viewingPrescription.medications.map((m, idx) => (
                      <div key={idx} style={{ background: 'rgba(0,0,0,0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>{m.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dosage: {m.dosage} • {m.frequency}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--primary))', fontWeight: 600 }}>{m.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ADDITIONAL CLINIC INSTRUCTIONS</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{viewingPrescription.instructions}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Signature Verification</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'hsl(var(--success))', fontWeight: 600 }}>{viewingPrescription.signature}</span>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setViewingPrescription(null)}>Dismiss</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Patient Appts Checklist */}
          <div className="glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="hsl(var(--accent))" />
              Your Appointments
            </h3>

            {patientAppointments.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No active bookings yet. Find a doctor on the left grid.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {patientAppointments.map((app: Appointment) => (
                  <div key={app.id} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>{app.doctorName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{app.doctorSpecialty}</span>
                      </div>
                      
                      {app.status === 'scheduled' && <span className="badge badge-info">Scheduled</span>}
                      {app.status === 'checked-in' && <span className="badge badge-success">Checked In</span>}
                      {app.status === 'in-progress' && <span className="badge badge-warning">Active Consult</span>}
                      {app.status === 'completed' && <span className="badge badge-success">Completed</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>Date: {app.date}</span>
                      <span>Time: {app.time}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      <button 
                        onClick={() => setViewingQRApp(app)} 
                        className="btn btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <QrCode size={14} />
                        QR Pass
                      </button>
                      
                      <button 
                        onClick={() => onLaunchVideo(app.id, app.doctorName)}
                        disabled={app.status !== 'in-progress' && app.status !== 'checked-in'}
                        className="btn btn-primary" 
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.75rem', 
                          opacity: (app.status === 'in-progress' || app.status === 'checked-in') ? 1 : 0.5,
                          cursor: (app.status === 'in-progress' || app.status === 'checked-in') ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <Video size={14} />
                        Video Call
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prescriptions Library */}
          <div className="glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="hsl(var(--success))" />
              Prescriptions Library
            </h3>

            {patientPrescriptions.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No prescriptions uploaded yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {patientPrescriptions.map((p: Prescription) => (
                  <button
                    key={p.id}
                    onClick={() => setViewingPrescription(p)}
                    className="glass-interactive"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      background: 'rgba(0,0,0,0.1)',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{p.doctorName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Diagnoses: {p.diagnoses}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Dated: {p.date}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};
