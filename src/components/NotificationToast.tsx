import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { getDB } from '../utils/mockDb';
import type { SystemNotification } from '../utils/mockDb';

interface NotificationToastProps {
  currentUserId: string;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ currentUserId }) => {
  const [toast, setToast] = useState<SystemNotification | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  useEffect(() => {
    // Load existing notifications
    const loadNotifs = () => {
      const db = getDB();
      const userNotifs = db.notifications.filter((n: SystemNotification) => n.userId === currentUserId || n.userId === 'all');
      setNotifications(userNotifs);
    };

    loadNotifs();

    // Listen to new notifications
    const handleNewNotif = (e: Event) => {
      const notif = (e as CustomEvent<SystemNotification>).detail;
      if (notif.userId === currentUserId || notif.userId === 'all') {
        setToast(notif);
        loadNotifs();
        // Auto-dismiss toast
        setTimeout(() => {
          setToast(null);
        }, 5000);
      }
    };

    window.addEventListener('hms_notification', handleNewNotif);
    return () => window.removeEventListener('hms_notification', handleNewNotif);
  }, [currentUserId]);

  const markAllAsRead = () => {
    const db = getDB();
    db.notifications.forEach((n: SystemNotification) => {
      if (n.userId === currentUserId || n.userId === 'all') {
        n.isRead = true;
      }
    });
    localStorage.setItem('hms_notifications', JSON.stringify(db.notifications));
    setNotifications(prev => prev.map((n: SystemNotification) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ position: 'relative', zIndex: 1000 }}>
      {/* Toast popup */}
      {toast && (
        <div 
          className="glass animate-fade-in"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 20px',
            maxWidth: '350px',
            borderLeft: '4px solid hsl(var(--primary))',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            zIndex: 9999,
          }}
        >
          <div style={{ background: 'var(--primary-glow)', padding: '6px', borderRadius: '8px' }}>
            <Bell size={20} color="hsl(var(--primary))" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', fontWeight: 600 }}>{toast.title}</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Bell Trigger */}
      <button 
        onClick={() => setShowDrawer(!showDrawer)}
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
        }}
        className="glass-interactive"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span 
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              background: 'hsl(var(--danger))',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {showDrawer && (
        <>
          <div 
            onClick={() => setShowDrawer(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'transparent',
              zIndex: 9997,
            }}
          />
          <div 
            className="glass animate-fade-in"
            style={{
              position: 'absolute',
              top: '55px',
              right: 0,
              width: '320px',
              maxHeight: '400px',
              overflowY: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              padding: '16px',
              zIndex: 9998,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem' }}>Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  style={{ background: 'none', border: 'none', color: 'hsl(var(--primary))', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Mark all read
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  No notifications yet.
                </p>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      background: n.isRead ? 'rgba(0,0,0,0.1)' : 'var(--primary-glow)',
                      borderLeft: `3px solid ${n.isRead ? 'transparent' : 'hsl(var(--primary))'}`,
                    }}
                  >
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '2px', fontWeight: n.isRead ? 500 : 600 }}>{n.title}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{n.message}</p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
