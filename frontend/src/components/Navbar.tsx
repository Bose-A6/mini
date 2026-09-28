import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Search,
  Briefcase,
  UserCheck,
  FileCheck2,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Sparkles,
  LogOut,
  Radio,
  Menu,
  X,
  Award,
  Clock,
  AlertCircle,
  LifeBuoy,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    verifications,
    tickets,
    activeView,
    setActiveView,
    notifications,
    openSupportModal,
    markNotificationRead,
    markAllNotificationsRead,
    logout,
  } = useApp();

  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const role = currentUser.role;

  const myVerif = (verifications || []).find(
    (v) =>
      currentUser &&
      (v.userId === currentUser.id ||
        (v.userEmail && v.userEmail.toLowerCase() === currentUser.email?.toLowerCase()))
  );
  const isApproved = currentUser.isVerified === true || myVerif?.status === 'approved';
  const isPending = myVerif?.status === 'pending' || myVerif?.status === 'under_review';
  const isRejected = myVerif?.status === 'rejected';

  const userNotifs = notifications.filter(
    (n) => n.userId === currentUser.id || role === 'admin'
  );
  const unreadCount = userNotifs.filter((n) => !n.isRead).length;

  const navigateTo = (view: any) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="app-navbar">
      {/* Brand & Active Workspace Badge */}
      <div
        className="nav-brand"
        onClick={() => {
          if (role === 'client') navigateTo('client');
          else if (role === 'freelancer') navigateTo('freelancer');
          else if (role === 'admin') navigateTo('admin');
        }}
        style={{ cursor: 'pointer' }}
      >
        <div className="brand-icon-box">
          <Layers size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="brand-title">FreelanceStack</span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                background:
                  role === 'client'
                    ? 'rgba(6, 182, 212, 0.2)'
                    : role === 'freelancer'
                    ? isApproved
                      ? 'rgba(16, 185, 129, 0.2)'
                      : isRejected
                      ? 'rgba(244, 63, 94, 0.2)'
                      : 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(245, 158, 11, 0.2)',
                color:
                  role === 'client'
                    ? 'var(--accent-cyan)'
                    : role === 'freelancer'
                    ? isApproved
                      ? 'var(--accent-emerald)'
                      : isRejected
                      ? 'var(--accent-rose)'
                      : 'var(--accent-amber)'
                    : 'var(--accent-amber)',
                border:
                  role === 'client'
                    ? '1px solid rgba(6, 182, 212, 0.4)'
                    : role === 'freelancer'
                    ? isApproved
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : isRejected
                      ? '1px solid rgba(244, 63, 94, 0.4)'
                      : '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(245, 158, 11, 0.4)',
              }}
            >
              {role === 'freelancer'
                ? isApproved
                  ? 'FREELANCER • VERIFIED PRO'
                  : isRejected
                  ? 'FREELANCER • ACTION NEEDED'
                  : isPending
                  ? 'FREELANCER • PENDING AUDIT'
                  : 'FREELANCER • UNVERIFIED'
                : `${role.toUpperCase()} PORTAL`}
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1 }}>
            {role === 'client'
              ? 'Client Project & Escrow Management'
              : role === 'freelancer'
              ? isApproved
                ? 'Verified Engineering Suite'
                : 'Trust & Verification Pending'
              : 'Master Platform Governance'}
          </p>
        </div>
      </div>

      {/* Segregated Role-Specific Navigation Links */}
      <nav className="nav-links">
        {/* 1. Client Links */}
        {role === 'client' && (
          <>
            <button
              className={`nav-item ${activeView === 'client' ? 'active' : ''}`}
              onClick={() => navigateTo('client')}
            >
              <Briefcase size={16} />
              <span>Client Hub & Postings</span>
            </button>
            <button
              className={`nav-item ${activeView === 'gigs' ? 'active' : ''}`}
              onClick={() => navigateTo('gigs')}
            >
              <Search size={16} />
              <span>Browse Marketplace</span>
            </button>
            <button
              className={`nav-item ${activeView === 'contracts' ? 'active' : ''}`}
              onClick={() => navigateTo('contracts')}
            >
              <FileCheck2 size={16} />
              <span>My Escrow Contracts</span>
            </button>
          </>
        )}

        {/* 2. Freelancer Links */}
        {role === 'freelancer' && (
          <>
            <button
              className={`nav-item ${activeView === 'freelancer' ? 'active' : ''}`}
              onClick={() => navigateTo('freelancer')}
            >
              <UserCheck size={16} />
              <span>{isApproved ? 'Freelancer Workspace' : 'Portal Status'}</span>
            </button>
            <button
              className={`nav-item ${activeView === 'gigs' ? 'active' : ''}`}
              onClick={() => navigateTo('gigs')}
            >
              <Search size={16} />
              <span>Explore Client Projects</span>
            </button>
            <button
              className={`nav-item ${activeView === 'contracts' ? 'active' : ''}`}
              onClick={() => navigateTo('contracts')}
            >
              <FileCheck2 size={16} />
              <span>Active Contracts</span>
            </button>
            <button
              className={`nav-item ${activeView === 'verification' ? 'active' : ''}`}
              onClick={() => navigateTo('verification')}
            >
              {isApproved ? (
                <>
                  <Award size={16} color="var(--accent-emerald)" />
                  <span>Verified Pass</span>
                </>
              ) : isPending ? (
                <>
                  <Clock size={16} color="var(--accent-amber)" />
                  <span>Pending Review</span>
                </>
              ) : isRejected ? (
                <>
                  <AlertCircle size={16} color="var(--accent-rose)" />
                  <span>Action Needed</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Get Verified</span>
                </>
              )}
            </button>
          </>
        )}

        {/* 3. Admin Links */}
        {role === 'admin' && (
          <>
            <button
              className={`nav-item ${activeView === 'admin' ? 'active' : ''}`}
              onClick={() => navigateTo('admin')}
            >
              <ShieldCheck size={16} />
              <span>Admin Governance</span>
            </button>
            <button
              className={`nav-item ${activeView === 'contracts' ? 'active' : ''}`}
              onClick={() => navigateTo('contracts')}
            >
              <FileCheck2 size={16} />
              <span>All Platform Escrows</span>
            </button>
            <button
              className={`nav-item ${activeView === 'gigs' ? 'active' : ''}`}
              onClick={() => navigateTo('gigs')}
            >
              <Search size={16} />
              <span>All Gigs Overview</span>
            </button>
          </>
        )}
      </nav>

      {/* Nav Actions (Right side) */}
      <div className="nav-actions">
        {/* Supabase Status */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: 'var(--accent-emerald)',
            fontWeight: 600,
          }}
          title="Supabase PostgreSQL & Auth Connected"
        >
          <Radio size={12} className="pulse-icon" />
          <span>Supabase Live</span>
        </div>

        {/* Support Helpdesk Button */}
        <button
          className="nav-btn-icon"
          onClick={() => {
            if (role === 'admin') {
              navigateTo('admin');
            } else {
              openSupportModal();
            }
          }}
          title={role === 'admin' ? 'Open Admin Helpdesk' : 'Need Help? Customer & Freelancer Support'}
          style={{ position: 'relative' }}
        >
          <LifeBuoy size={18} />
          {(tickets || []).some((t) => t.userId === currentUser.id && t.status === 'open') && (
            <span
              style={{
                position: 'absolute',
                top: 3,
                right: 3,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--accent-amber)',
              }}
            />
          )}
        </button>

        {/* Real-Time Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className="nav-btn-icon"
            onClick={() => setShowNotifs(!showNotifs)}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge" />}
          </button>

          {showNotifs && (
            <div
              style={{
                position: 'absolute',
                top: '52px',
                right: 0,
                width: '340px',
                maxHeight: '400px',
                overflowY: 'auto',
                background: 'rgba(13, 22, 38, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-luxury)',
                padding: '16px',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '6px',
                }}
              >
                <strong style={{ fontSize: '0.9rem' }}>Realtime Notifications</strong>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    style={{ background: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Mark read
                  </button>
                )}
              </div>

              {userNotifs.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No notifications yet.
                </p>
              ) : (
                userNotifs.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      markNotificationRead(item.id);
                      if (item.targetView) navigateTo(item.targetView);
                      setShowNotifs(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: item.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.1)',
                      marginBottom: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <strong style={{ fontSize: '0.82rem', display: 'block', color: 'var(--text-primary)' }}>
                      {item.title}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.body}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Pill & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="user-profile-pill"
            style={{ cursor: 'default' }}
          >
            <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="user-avatar-sm" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentUser.fullName}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  color:
                    role === 'client'
                      ? 'var(--accent-cyan)'
                      : role === 'freelancer'
                      ? 'var(--accent-emerald)'
                      : 'var(--accent-amber)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontWeight: 700,
                }}
              >
                {currentUser.isVerified && <CheckCircle2 size={10} />}
                {role.toUpperCase()}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="btn-ghost"
            title="Sign Out to Role Selection Portal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '0.85rem',
              color: 'var(--accent-rose)',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
          style={{
            display: 'none',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '8px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-drawer"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(7, 13, 24, 0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-medium)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 999,
          }}
        >
          {role === 'client' && (
            <>
              <button
                className={`nav-item ${activeView === 'client' ? 'active' : ''}`}
                onClick={() => navigateTo('client')}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
              >
                <Briefcase size={18} />
                <span>Client Hub & Postings</span>
              </button>
              <button
                className={`nav-item ${activeView === 'gigs' ? 'active' : ''}`}
                onClick={() => navigateTo('gigs')}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
              >
                <Search size={18} />
                <span>Browse Marketplace</span>
              </button>
              <button
                className={`nav-item ${activeView === 'contracts' ? 'active' : ''}`}
                onClick={() => navigateTo('contracts')}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
              >
                <FileCheck2 size={18} />
                <span>My Escrow Contracts</span>
              </button>
            </>
          )}

          {role === 'freelancer' && (
            <>
              <button
                className={`nav-item ${activeView === 'freelancer' ? 'active' : ''}`}
                onClick={() => navigateTo('freelancer')}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
              >
                <UserCheck size={18} />
                <span>Freelancer Suite</span>
              </button>
              <button
                className={`nav-item ${activeView === 'gigs' ? 'active' : ''}`}
                onClick={() => navigateTo('gigs')}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
              >
                <Search size={18} />
                <span>Client Requirements & Gigs</span>
              </button>
              <button
                className={`nav-item ${activeView === 'contracts' ? 'active' : ''}`}
                onClick={() => navigateTo('contracts')}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
              >
                <FileCheck2 size={18} />
                <span>Active Contracts</span>
              </button>
              <button
                className={`nav-item ${activeView === 'verification' ? 'active' : ''}`}
                onClick={() => navigateTo('verification')}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
              >
                <Sparkles size={18} />
                <span>Get Verified</span>
              </button>
            </>
          )}

          {role === 'admin' && (
            <>
              <button
                className={`nav-item ${activeView === 'admin' ? 'active' : ''}`}
                onClick={() => navigateTo('admin')}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
              >
                <ShieldCheck size={18} />
                <span>Admin Governance</span>
              </button>
              <button
                className={`nav-item ${activeView === 'contracts' ? 'active' : ''}`}
                onClick={() => navigateTo('contracts')}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
              >
                <FileCheck2 size={18} />
                <span>All Platform Escrows</span>
              </button>
              <button
                className={`nav-item ${activeView === 'gigs' ? 'active' : ''}`}
                onClick={() => navigateTo('gigs')}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
              >
                <Search size={18} />
                <span>All Gigs Overview</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="btn-ghost"
            style={{ width: '100%', justifyContent: 'center', color: 'var(--accent-rose)', marginTop: '8px', padding: '12px' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      )}
    </header>
  );
};
