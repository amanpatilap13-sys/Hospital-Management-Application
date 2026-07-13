import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Video, FileText, LogOut, CheckSquare, Send } from 'lucide-react';
import { getDB, saveDB, addNotification } from '../utils/mockDb';
import type { Doctor, Appointment, Prescription, TimeSlot } from '../utils/mockDb';
import { NotificationToast } from '../components/NotificationToast';

interface DoctorDashboardProps {
  user: { id: string; name: string; email: string };
  onLogout: () => void;
  onLaunchVideo: (roomName: string, patientName: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user, onLogout, onLaunchVideo }) => {
  const [db, setDb] = useState(getDB());
  const [slotTime, setSlotTime] = useState('09:00 AM');
  const [slotDate, setSlotDate] = useState('2026-07-14');
  
  // Prescription Form State
  const [creatingPrescriptionApp, setCreatingPrescriptionApp] = useState<Appointment | null>(null);
  const [diagnoses, setDiagnoses] = useState('');
  const [medications, setMedications] = useState<{ name: string; dosage: string; frequency: string; duration: string }[]>([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [instructions, setInstructions] = useState('');
  const [signature, setSignature] = useState(`Dr. ${user.name.split(' ').pop()}`);

  const refreshDb = () => {
    setDb(getDB());
  };

  useEffect(() => {
    refreshDb();
    const handleUpdate = () => refreshDb();
    window.addEventListener('hms_notification', handleUpdate);
    return () => window.removeEventListener('hms_notification', handleUpdate);
  }, []);

  const currentDoctor = db.doctors.find((d: Doctor) => d.id === user.id);
  const doctorAppointments = db.appointments.filter((a: Appointment) => a.doctorId === user.id);

  // Slot Generation handler
  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotTime || !slotDate) return;

    const updatedDb = getDB();
    const targetDoc = updatedDb.doctors.find((d: Doctor) => d.id === user.id);
    if (!targetDoc) return;

    // Check duplicate slot
    const duplicate = targetDoc.availableSlots.some((s: TimeSlot) => s.time === slotTime && s.date === slotDate);
    if (duplicate) {
      alert('This slot already exists.');
      return;
    }

    const newSlot: TimeSlot = {
      id: `slot-${Date.now()}`,
      time: slotTime,
      date: slotDate,
      isBooked: false,
    };

    targetDoc.availableSlots.push(newSlot);
    saveDB(updatedDb);
    setDb(updatedDb);

    addNotification(
      user.id,
      'Slot Generated Successfully',
      `New consultation slot added for ${slotDate} at ${slotTime}.`
    );
  };

  // Launch Video Consultation
  const handleStartConsultation = (app: Appointment) => {
    const updatedDb = getDB();
    const targetApp = updatedDb.appointments.find((a: Appointment) => a.id === app.id);
    if (!targetApp) return;

    targetApp.status = 'in-progress';
    saveDB(updatedDb);
    setDb(updatedDb);

    // Notify patient
    addNotification(
      targetApp.patientId,
      'Consultation In Progress',
      `Dr. ${user.name} has started your video consultation. Click video call to join!`
    );

    onLaunchVideo(targetApp.id, targetApp.patientName);
  };

  // Handle Add Medication Row
  const addMedicationRow = () => {
    setMedications(prev => [...prev, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  // Handle Prescription Submit
  const handlePrescriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatingPrescriptionApp) return;

    const updatedDb = getDB();
    const targetApp = updatedDb.appointments.find((a: Appointment) => a.id === creatingPrescriptionApp.id);
    if (!targetApp) return;

    const prescriptionId = `rx-${Date.now()}`;
    const newPrescription: Prescription = {
      id: prescriptionId,
      appointmentId: targetApp.id,
      patientId: targetApp.patientId,
      patientName: targetApp.patientName,
      doctorId: user.id,
      doctorName: user.name,
      date: new Date().toISOString().split('T')[0],
      diagnoses,
      medications: medications.filter(m => m.name.trim() !== ''),
      instructions,
      signature,
    };

    targetApp.status = 'completed';
    targetApp.prescriptionId = prescriptionId;
    
    updatedDb.prescriptions.push(newPrescription);
    saveDB(updatedDb);
    setDb(updatedDb);

    // Clear form states
    setCreatingPrescriptionApp(null);
    setDiagnoses('');
    setMedications([{ name: '', dosage: '', frequency: '', duration: '' }]);
    setInstructions('');

    // Notifications
    addNotification(
      targetApp.patientId,
      'New Prescription Uploaded',
      `Dr. ${user.name} has uploaded a prescription for your consultation. Check your Prescriptions Library.`
    );

    addNotification(
      user.id,
      'Prescription Uploaded',
      `Prescription for ${targetApp.patientName} submitted successfully.`
    );
  };

  return (
    <div className="app-container">
      {/* Top Header Navigation */}
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
          <div style={{ background: 'var(--accent-glow)', padding: '8px', borderRadius: '10px' }}>
            <Calendar size={24} color="hsl(var(--accent))" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Schedula Care</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doctor Portal</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontWeight: 600, display: 'block', fontSize: '0.9rem' }}>{user.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--accent))' }}>{currentDoctor?.specialty}</span>
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

      {/* Main Grid View */}
      <main style={{ flex: 1, padding: '40px', maxWidth: '1440px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
        
        {/* Left Side - Patient Appointments List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={20} color="hsl(var(--primary))" />
              Patient Appointment Bookings ({doctorAppointments.length})
            </h3>

            {doctorAppointments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: '0.9rem' }}>
                No appointments booked for today. Create more available slots in the right sidebar.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {doctorAppointments.map((app: Appointment) => (
                  <div 
                    key={app.id}
                    className="glass"
                    style={{
                      padding: '20px',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      alignItems: 'center',
                      gap: '16px',
                      background: 'rgba(0,0,0,0.1)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{app.patientName}</h4>
                        {app.status === 'scheduled' && <span className="badge badge-info">Scheduled</span>}
                        {app.status === 'checked-in' && <span className="badge badge-success">Checked In</span>}
                        {app.status === 'in-progress' && <span className="badge badge-warning">In Progress</span>}
                        {app.status === 'completed' && <span className="badge badge-success">Completed</span>}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>Time: {app.time}</span>
                        <span>Date: {app.date}</span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleStartConsultation(app)}
                        disabled={app.status !== 'checked-in' && app.status !== 'scheduled' && app.status !== 'in-progress'}
                        className="btn btn-primary"
                        style={{
                          padding: '10px 16px',
                          fontSize: '0.8rem',
                          background: app.status === 'in-progress' ? 'hsl(var(--warning))' : 'hsl(var(--primary))',
                        }}
                      >
                        <Video size={16} />
                        {app.status === 'in-progress' ? 'Resume Call' : 'Start Call'}
                      </button>

                      <button
                        onClick={() => setCreatingPrescriptionApp(app)}
                        disabled={app.status !== 'in-progress' && app.status !== 'completed'}
                        className="btn btn-secondary"
                        style={{ padding: '10px 16px', fontSize: '0.8rem' }}
                      >
                        <FileText size={16} />
                        Rx Prescription
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Slot Generation Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Dynamic Slot Generator */}
          <div className="glass" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="hsl(var(--accent))" />
              Slot Generation
            </h3>

            <form onSubmit={handleCreateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Date</label>
                <input 
                  type="date" 
                  value={slotDate} 
                  onChange={e => setSlotDate(e.target.value)}
                  className="text-input"
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Time</label>
                <select 
                  value={slotTime} 
                  onChange={e => setSlotTime(e.target.value)}
                  className="text-input"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:30 PM">01:30 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
                <Plus size={16} />
                Generate Slot
              </button>
            </form>

            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>Active Available Slots ({currentDoctor?.availableSlots.length || 0})</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {currentDoctor?.availableSlots.map((s: TimeSlot) => (
                  <span 
                    key={s.id} 
                    className={`badge ${s.isBooked ? 'badge-danger' : 'badge-success'}`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {s.time} • {s.isBooked ? 'Booked' : 'Free'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Prescription Modal */}
      {creatingPrescriptionApp && (
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
          <div className="glass" style={{ width: '100%', maxWidth: '580px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Create Digital Prescription</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Patient Name: {creatingPrescriptionApp.patientName}</p>

            <form onSubmit={handlePrescriptionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Diagnoses / Primary Observations</label>
                <textarea 
                  value={diagnoses} 
                  onChange={e => setDiagnoses(e.target.value)}
                  className="text-input" 
                  style={{ minHeight: '60px', fontFamily: 'inherit' }}
                  placeholder="e.g. Hypertension, Acute Rhinopharyngitis"
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="input-label">Prescribed Medications</label>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={addMedicationRow}>
                    + Add Medication
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {medications.map((m, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '6px' }}>
                      <input 
                        type="text" 
                        placeholder="Meds Name" 
                        value={m.name} 
                        onChange={e => {
                          const updated = [...medications];
                          updated[idx].name = e.target.value;
                          setMedications(updated);
                        }}
                        className="text-input"
                        style={{ fontSize: '0.8rem', padding: '8px 10px' }}
                        required
                      />
                      <input 
                        type="text" 
                        placeholder="Dosage" 
                        value={m.dosage} 
                        onChange={e => {
                          const updated = [...medications];
                          updated[idx].dosage = e.target.value;
                          setMedications(updated);
                        }}
                        className="text-input"
                        style={{ fontSize: '0.8rem', padding: '8px 10px' }}
                        required
                      />
                      <input 
                        type="text" 
                        placeholder="Freq" 
                        value={m.frequency} 
                        onChange={e => {
                          const updated = [...medications];
                          updated[idx].frequency = e.target.value;
                          setMedications(updated);
                        }}
                        className="text-input"
                        style={{ fontSize: '0.8rem', padding: '8px 10px' }}
                        required
                      />
                      <input 
                        type="text" 
                        placeholder="Duration" 
                        value={m.duration} 
                        onChange={e => {
                          const updated = [...medications];
                          updated[idx].duration = e.target.value;
                          setMedications(updated);
                        }}
                        className="text-input"
                        style={{ fontSize: '0.8rem', padding: '8px 10px' }}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Additional Instructions</label>
                <textarea 
                  value={instructions} 
                  onChange={e => setInstructions(e.target.value)}
                  className="text-input" 
                  style={{ minHeight: '60px', fontFamily: 'inherit' }}
                  placeholder="e.g. Bed rest, avoid dairy, drink fluids"
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Digital Signature</label>
                <input 
                  type="text" 
                  value={signature} 
                  onChange={e => setSignature(e.target.value)}
                  className="text-input" 
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCreatingPrescriptionApp(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Send size={16} />
                  Upload Rx
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
