import { useState } from 'react';
import { Auth } from './pages/Auth';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { VideoRoom } from './components/VideoRoom';
import { addNotification } from './utils/mockDb';

interface UserSession {
  id: string;
  name: string;
  role: 'patient' | 'doctor' | 'admin';
  email: string;
}

function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ roomName: string; userName: string; role: 'doctor' | 'patient' } | null>(null);

  const handleLogin = (user: UserSession) => {
    setSession(user);
    
    // Broadcast notification on successful login
    addNotification(
      user.id,
      'Welcome to Schedula Care',
      `Logged in successfully as ${user.name} (${user.role}).`
    );
  };

  const handleLogout = () => {
    if (session) {
      addNotification(session.id, 'Logged Out', 'Your session ended safely.');
    }
    setSession(null);
  };

  const launchVideoRoom = (roomId: string, _otherPartyName: string) => {
    if (!session) return;
    
    setActiveVideo({
      roomName: roomId,
      userName: session.name,
      role: session.role === 'admin' ? 'patient' : session.role,
    });
  };

  return (
    <>
      {!session ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <>
          {session.role === 'patient' && (
            <PatientDashboard 
              user={session} 
              onLogout={handleLogout} 
              onLaunchVideo={(room, docName) => launchVideoRoom(room, docName)} 
            />
          )}

          {session.role === 'doctor' && (
            <DoctorDashboard 
              user={session} 
              onLogout={handleLogout} 
              onLaunchVideo={(room, patName) => launchVideoRoom(room, patName)} 
            />
          )}

          {session.role === 'admin' && (
            <AdminDashboard 
              user={session} 
              onLogout={handleLogout} 
            />
          )}
        </>
      )}

      {/* Video Overlay Room */}
      {activeVideo && (
        <VideoRoom 
          roomName={activeVideo.roomName} 
          userName={activeVideo.userName} 
          role={activeVideo.role} 
          onLeave={() => setActiveVideo(null)} 
        />
      )}
    </>
  );
}

export default App;
