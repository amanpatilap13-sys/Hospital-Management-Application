export interface TimeSlot {
  id: string;
  time: string;
  date: string;
  isBooked: boolean;
  bookedByPatientId?: string;
  patientName?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  photoUrl: string;
  availableSlots: TimeSlot[];
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  time: string;
  status: 'scheduled' | 'checked-in' | 'in-progress' | 'completed' | 'cancelled';
  qrCodeData: string;
  videoLink: string;
  prescriptionId?: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnoses: string;
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  instructions: string;
  signature: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Seed Data
const initialDoctors: Doctor[] = [
  {
    id: 'doc1',
    name: 'Dr. Sarah Connor',
    specialty: 'Cardiologist',
    email: 'sarah.connor@hospital.com',
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
    availableSlots: [
      { id: 'slot-1-1', time: '09:00 AM', date: '2026-07-14', isBooked: false },
      { id: 'slot-1-2', time: '10:30 AM', date: '2026-07-14', isBooked: false },
      { id: 'slot-1-3', time: '02:00 PM', date: '2026-07-14', isBooked: false },
      { id: 'slot-1-4', time: '04:30 PM', date: '2026-07-14', isBooked: false },
    ],
  },
  {
    id: 'doc2',
    name: 'Dr. Alexander Pierce',
    specialty: 'Neurologist',
    email: 'alex.pierce@hospital.com',
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
    availableSlots: [
      { id: 'slot-2-1', time: '09:30 AM', date: '2026-07-14', isBooked: false },
      { id: 'slot-2-2', time: '11:00 AM', date: '2026-07-14', isBooked: false },
      { id: 'slot-2-3', time: '03:00 PM', date: '2026-07-14', isBooked: false },
    ],
  },
  {
    id: 'doc3',
    name: 'Dr. Elena Rostova',
    specialty: 'Pediatrician',
    email: 'elena.rostova@hospital.com',
    photoUrl: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=300&q=80',
    availableSlots: [
      { id: 'slot-3-1', time: '10:00 AM', date: '2026-07-14', isBooked: false },
      { id: 'slot-3-2', time: '01:30 PM', date: '2026-07-14', isBooked: false },
      { id: 'slot-3-3', time: '04:00 PM', date: '2026-07-14', isBooked: false },
    ],
  },
];

const initialPatients: Patient[] = [
  { id: 'pat1', name: 'John Doe', email: 'john@example.com', phone: '+1 555-0199' },
  { id: 'pat2', name: 'Alice Smith', email: 'alice@example.com', phone: '+1 555-0144' },
];

export const getDB = () => {
  const doctors = localStorage.getItem('hms_doctors');
  const patients = localStorage.getItem('hms_patients');
  const appointments = localStorage.getItem('hms_appointments');
  const prescriptions = localStorage.getItem('hms_prescriptions');
  const notifications = localStorage.getItem('hms_notifications');

  if (!doctors) {
    localStorage.setItem('hms_doctors', JSON.stringify(initialDoctors));
    localStorage.setItem('hms_patients', JSON.stringify(initialPatients));
    localStorage.setItem('hms_appointments', JSON.stringify([]));
    localStorage.setItem('hms_prescriptions', JSON.stringify([]));
    localStorage.setItem('hms_notifications', JSON.stringify([]));

    return {
      doctors: initialDoctors,
      patients: initialPatients,
      appointments: [],
      prescriptions: [],
      notifications: [],
    };
  }

  return {
    doctors: JSON.parse(doctors),
    patients: JSON.parse(patients || '[]'),
    appointments: JSON.parse(appointments || '[]'),
    prescriptions: JSON.parse(prescriptions || '[]'),
    notifications: JSON.parse(notifications || '[]'),
  };
};

export const saveDB = (db: {
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  notifications: SystemNotification[];
}) => {
  localStorage.setItem('hms_doctors', JSON.stringify(db.doctors));
  localStorage.setItem('hms_patients', JSON.stringify(db.patients));
  localStorage.setItem('hms_appointments', JSON.stringify(db.appointments));
  localStorage.setItem('hms_prescriptions', JSON.stringify(db.prescriptions));
  localStorage.setItem('hms_notifications', JSON.stringify(db.notifications));
};

export const addNotification = (userId: string, title: string, message: string) => {
  const db = getDB();
  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  db.notifications.unshift(newNotif);
  saveDB(db);
  
  // Custom event so active views can listen and toast
  window.dispatchEvent(new CustomEvent('hms_notification', { detail: newNotif }));
};
