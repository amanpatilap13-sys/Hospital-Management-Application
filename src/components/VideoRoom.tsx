import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react';

interface VideoRoomProps {
  roomName: string;
  userName: string;
  role: 'doctor' | 'patient';
  onLeave: () => void;
}

export const VideoRoom: React.FC<VideoRoomProps> = ({ roomName, userName, role, onLeave }) => {
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: role === 'doctor' ? 'System' : 'Dr. Sarah Connor', text: 'Hello! Welcome to your digital clinic consultation.', time: '12:00 PM' }
  ]);
  const [inputText, setInputText] = useState('');
  const [timer, setTimer] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Timer Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format Timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Canvas animated background to simulate a high-quality video feed
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let angle = 0;

    const render = () => {
      ctx.fillStyle = '#141625';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (videoActive) {
        // Draw some techy/glowing diagnostic HUD elements
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

        // Medical wave lines (pulse waveform)
        ctx.beginPath();
        ctx.strokeStyle = 'hsl(220, 95%, 60%)';
        ctx.lineWidth = 3;
        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + Math.sin(x * 0.02 + angle) * 30 * Math.sin(angle * 0.05);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Pulsing circles (digital diagnostics)
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 80 + Math.sin(angle) * 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.stroke();

        // Face locator HUD
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Top left
        ctx.moveTo(canvas.width / 2 - 40, canvas.height / 2 - 60);
        ctx.lineTo(canvas.width / 2 - 60, canvas.height / 2 - 60);
        ctx.lineTo(canvas.width / 2 - 60, canvas.height / 2 - 40);
        // Top right
        ctx.moveTo(canvas.width / 2 + 40, canvas.height / 2 - 60);
        ctx.lineTo(canvas.width / 2 + 60, canvas.height / 2 - 60);
        ctx.lineTo(canvas.width / 2 + 60, canvas.height / 2 - 40);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(role === 'doctor' ? 'Patient Stream (Simulated)' : 'Doctor Stream (Simulated)', canvas.width / 2, canvas.height / 2 + 120);
      } else {
        // Video disabled view
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '16px Outfit, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Camera Turned Off', canvas.width / 2, canvas.height / 2 + 80);
      }

      angle += 0.05;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [videoActive, role]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      sender: userName,
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulate auto-response after 2s
    setTimeout(() => {
      const autoMsg = {
        sender: role === 'doctor' ? 'Patient' : 'Doctor',
        text: role === 'doctor' 
          ? 'Yes doctor, I have been experiencing this for 3 days now.' 
          : 'Please make sure to drink plenty of fluids and take rest. I am uploading your prescription now.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, autoMsg]);
    }, 2000);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#090a0f',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
      className="animate-fade-in"
    >
      {/* Top Header */}
      <div 
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(19, 22, 34, 0.9)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--success-glow)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', background: 'hsl(var(--success))', borderRadius: '50%', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--success))' }}>LIVE CONSULTATION</span>
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Room: {roomName}</span>
        </div>
        
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'hsl(var(--primary))', fontFamily: 'monospace' }}>
          {formatTime(timer)}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={16} color="hsl(var(--accent))" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>HD Secure Connection</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video Canvas Container */}
        <div style={{ flex: 1, position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={500} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />

          {/* Self Preview Overlay */}
          <div 
            className="glass"
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              width: '180px',
              height: '110px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#090a0f',
            }}
          >
            {videoActive ? (
              <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                <div 
                  className="pulse-glow"
                  style={{ width: '12px', height: '12px', background: 'hsl(var(--primary))', borderRadius: '50%', margin: '0 auto 8px' }}
                ></div>
                <span>You (Self View)</span>
              </div>
            ) : (
              <VideoOff size={24} color="var(--text-muted)" />
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div 
            className="glass"
            style={{
              width: '350px',
              borderLeft: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(19, 22, 34, 0.8)',
              borderRadius: 0,
            }}
          >
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} />
                Consultation Chat
              </h3>
            </div>
            
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  style={{
                    alignSelf: m.sender === userName ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                  }}
                >
                  <div 
                    style={{
                      background: m.sender === userName ? 'hsl(var(--primary))' : 'var(--bg-tertiary)',
                      padding: '10px 14px',
                      borderRadius: m.sender === userName ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      border: m.sender === userName ? 'none' : '1px solid var(--border-color)',
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: '2px', color: m.sender === userName ? '#e0f2fe' : 'hsl(var(--primary))' }}>
                      {m.sender}
                    </p>
                    <p>{m.text}</p>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', textAlign: m.sender === userName ? 'right' : 'left', marginTop: '3px' }}>
                    {m.time}
                  </span>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={sendMessage} style={{ padding: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Type a message..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="text-input"
                style={{ padding: '10px 12px', fontSize: '0.85rem' }}
              />
              <button className="btn btn-primary" style={{ padding: '10px' }} type="submit">
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Control Actions Bar */}
      <div 
        style={{
          padding: '20px 40px',
          background: 'rgba(9, 10, 15, 0.95)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={18} color="hsl(var(--warning))" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Protected by HIPAA-compliant encryption</span>
        </div>

        {/* Mic, Video, Chat, and End Call Control Buttons */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setMicActive(!micActive)}
            className="btn btn-secondary" 
            style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0 }}
          >
            {micActive ? <Mic size={20} /> : <MicOff size={20} color="hsl(var(--danger))" />}
          </button>
          
          <button 
            onClick={() => setVideoActive(!videoActive)}
            className="btn btn-secondary" 
            style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0 }}
          >
            {videoActive ? <Video size={20} /> : <VideoOff size={20} color="hsl(var(--danger))" />}
          </button>

          <button 
            onClick={() => setShowChat(!showChat)}
            className={`btn ${showChat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0 }}
          >
            <MessageSquare size={20} />
          </button>
          
          <button 
            onClick={onLeave}
            className="btn btn-danger" 
            style={{ borderRadius: '50%', width: '48px', height: '48px', padding: 0 }}
          >
            <PhoneOff size={20} />
          </button>
        </div>

        <div style={{ width: '200px', textAlign: 'right' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{userName}</span>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{role}</span>
        </div>
      </div>
    </div>
  );
};
