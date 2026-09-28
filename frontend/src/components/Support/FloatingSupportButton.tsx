import React from 'react';
import { useApp } from '../../context/AppContext';
import { LifeBuoy } from 'lucide-react';

export const FloatingSupportButton: React.FC = () => {
  const { currentUser, tickets, openSupportModal } = useApp();

  if (!currentUser) return null;

  // Don't show floating button on admin page since admin has the dedicated helpdesk tab
  if (currentUser.role === 'admin') return null;

  const myOpenTickets = (tickets || []).filter(
    (t) =>
      (t.userId === currentUser.id ||
        (t.userEmail && t.userEmail.toLowerCase() === currentUser.email?.toLowerCase())) &&
      (t.status === 'open' || t.status === 'in_progress')
  );

  return (
    <button
      onClick={() => openSupportModal()}
      className="floating-support-btn"
      title="Need Help? Contact Admin Support Desk"
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 9990,
        background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-cyan) 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: 'var(--radius-full)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: 700,
        fontSize: '0.88rem',
        cursor: 'pointer',
        boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4), 0 0 15px rgba(6, 182, 212, 0.3)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <LifeBuoy size={20} className="pulse-icon" />
        {myOpenTickets.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: 'var(--accent-rose)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(10, 18, 32, 0.9)',
            }}
          >
            {myOpenTickets.length}
          </span>
        )}
      </div>
      <span>Support & Doubts</span>
    </button>
  );
};
