import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Lock, Mail, User, ShieldCheck, Briefcase, UserCheck, KeyRound } from 'lucide-react';
import type { AccountRole } from '../../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    login,
    signup,
    adminLogin,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AccountRole>('client');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const isAdmin = role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isAdmin) {
        if (!password.trim()) {
          setErrorMsg('Master admin passcode is required.');
          return;
        }
        if (password.trim() !== 'admin@426') {
          setErrorMsg('Invalid Admin Master Passcode. Access denied.');
          return;
        }
        const result = await adminLogin(password.trim());
        if (!result.success) {
          setErrorMsg(result.error || 'Admin login failed.');
        }
        return;
      }

      if (authMode === 'login') {
        const result = await login(email, password);
        if (!result.success) {
          setErrorMsg(result.error || 'Invalid credentials.');
        }
      } else {
        const result = await signup(email, password, fullName, role);
        if (!result.success) {
          setErrorMsg(result.error || 'Failed to create account.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '32px' }}>
        <button className="modal-close-btn" onClick={() => setIsAuthModalOpen(false)}>
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: isAdmin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--accent-gradient)',
              margin: '0 auto 12px',
              display: 'grid',
              placeItems: 'center',
              color: isAdmin ? '#030712' : 'white',
              boxShadow: isAdmin ? '0 8px 20px -4px rgba(245, 158, 11, 0.5)' : 'var(--glow-indigo)',
            }}
          >
            {isAdmin ? <ShieldCheck size={24} /> : <Lock size={22} />}
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>
            {isAdmin ? 'Admin Governance Access' : authMode === 'login' ? 'Sign In to Workspace' : 'Create Supabase Account'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isAdmin
              ? 'Enter master administrator security passcode to unlock full platform controls.'
              : authMode === 'login'
              ? 'Access real-time gigs, escrow contracts, and collaboration tools.'
              : 'Connect directly to Supabase authentication and database.'}
          </p>
        </div>

        {/* Role Switcher */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>
            ROLE SELECTION
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            {(['client', 'freelancer', 'admin'] as AccountRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  setErrorMsg('');
                  setPassword('');
                }}
                style={{
                  padding: '8px 4px',
                  borderRadius: 'var(--radius-sm)',
                  background: role === r ? (r === 'admin' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.25)') : 'rgba(255, 255, 255, 0.04)',
                  border: role === r ? (r === 'admin' ? '1px solid var(--accent-amber)' : '1px solid var(--accent-primary)') : '1px solid var(--border-subtle)',
                  color: role === r ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                {r === 'client' && <Briefcase size={12} />}
                {r === 'freelancer' && <UserCheck size={12} />}
                {r === 'admin' && <ShieldCheck size={12} />}
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs: Only for Client & Freelancer */}
        {!isAdmin && (
          <div className="auth-tabs" style={{ marginBottom: '20px' }}>
            <button
              type="button"
              className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg('');
              }}
            >
              Sign Up
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="auth-error" style={{ marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isAdmin ? (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', marginBottom: '6px', display: 'block', fontWeight: 700 }}>
                ADMIN MASTER PASSCODE
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-amber)' }} />
                <input
                  type="password"
                  placeholder="Enter admin password (admin@426)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: '40px', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                  required
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <>
              {authMode === 'signup' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    FULL NAME
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="e.g. Alex Morgan"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: '100%', paddingLeft: '40px' }}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  EMAIL ADDRESS
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                  PASSWORD
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', paddingLeft: '40px' }}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              marginTop: '6px',
              background: isAdmin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : undefined,
              color: isAdmin ? '#030712' : undefined,
              fontWeight: 700,
            }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : isAdmin ? 'Unlock Admin Console' : authMode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

