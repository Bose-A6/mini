import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Zap,
  AlertCircle,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import type { AccountRole } from '../../types';

export const AuthPage: React.FC = () => {
  const {
    authMode,
    setAuthMode,
    login,
    signup,
    setActiveView,
    currentUser,
    logout,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AccountRole>('client');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isSignup = authMode === 'signup';

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setErrorMessage('Please provide both email and password.');
        setLoading(false);
        return;
      }

      if (isSignup) {
        if (!fullName.trim()) {
          setErrorMessage('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const result = await signup(email.trim(), password, fullName.trim(), role);
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to register account.');
        } else {
          // Route to respective hub
          if (role === 'client') setActiveView('client');
          else if (role === 'freelancer') setActiveView('freelancer');
          else if (role === 'admin') setActiveView('admin');
          else setActiveView('gigs');
        }
      } else {
        const result = await login(email.trim(), password);
        if (!result.success) {
          setErrorMessage(result.error || 'Invalid credentials or user does not exist.');
        } else {
          setActiveView('gigs');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole: AccountRole) => {
    setLoading(true);
    setErrorMessage('');
    const demoEmail = `${demoRole}@freelancestack.io`;
    const demoPass = 'Password123!';
    const demoName =
      demoRole === 'client'
        ? 'Alex Rivera (Client)'
        : demoRole === 'freelancer'
        ? 'Elena Vance (Lead AI Eng)'
        : 'System Admin';

    const res = await signup(demoEmail, demoPass, demoName, demoRole);
    if (!res.success) {
      // If user already exists, try logging in
      const loginRes = await login(demoEmail, demoPass);
      if (!loginRes.success) {
        setErrorMessage(loginRes.error || 'Demo login failed.');
      } else {
        if (demoRole === 'client') setActiveView('client');
        else if (demoRole === 'freelancer') setActiveView('freelancer');
        else if (demoRole === 'admin') setActiveView('admin');
      }
    } else {
      if (demoRole === 'client') setActiveView('client');
      else if (demoRole === 'freelancer') setActiveView('freelancer');
      else if (demoRole === 'admin') setActiveView('admin');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page-container" style={{ minHeight: '85vh', padding: '40px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '1080px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'stretch' }}>
        
        {/* Left Side: Brand Value Proposition & Trust Badges */}
        <div
          className="glass-panel"
          style={{
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(145deg, rgba(13, 22, 38, 0.95), rgba(7, 13, 24, 0.95))',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle glowing blob */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              left: '-80px',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div>
            <button
              onClick={() => setActiveView('gigs')}
              className="btn-ghost"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                fontSize: '0.85rem',
                marginBottom: '28px',
                color: 'var(--text-secondary)',
              }}
            >
              <ArrowLeft size={16} /> Back to Marketplace
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div className="brand-icon-box" style={{ width: 44, height: 44 }}>
                <Layers size={22} />
              </div>
              <div>
                <span className="brand-title" style={{ fontSize: '1.4rem' }}>FreelanceStack</span>
                <span className="brand-tag" style={{ marginLeft: '6px' }}>PRO</span>
              </div>
            </div>

            <h2 style={{ fontSize: '1.8rem', lineHeight: 1.2, marginBottom: '14px', fontWeight: 800 }}>
              Direct Supabase Auth & <span className="hero-highlight">Milestone Escrow</span>.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
              Join the next-generation decentralized talent platform. Zero simulation mode, 100% verified real-time transactions, automated smart contract escrow, and AI project scoping.
            </p>

            {/* Feature List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>100% Escrow Vault Guarantee</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Funds are locked in protected smart escrow vaults until deliverables are approved.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                  <Zap size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>Supabase Real-Time Engine</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ultra-fast PostgreSQL synchronization and JWT session authentication.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>AI Scoping & Proposal Assistant</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generate enterprise job requirements and winning technical bids in seconds.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
              ⚡ Quick 1-Click Demo Profiles (Instant Test)
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('client')}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                disabled={loading}
              >
                <Briefcase size={14} color="var(--accent-cyan)" /> Demo Client
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('freelancer')}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                disabled={loading}
              >
                <UserCheck size={14} color="var(--accent-emerald)" /> Demo Freelancer
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                disabled={loading}
              >
                <ShieldCheck size={14} color="var(--accent-amber)" /> Demo Admin
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div
          className="glass-panel"
          style={{
            padding: '40px 36px',
            background: 'rgba(13, 22, 38, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          }}
        >
          {currentUser ? (
            /* Logged in state inside Auth Page */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '3px solid var(--accent-primary)', marginBottom: '16px' }}
              />
              <h3 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{currentUser.fullName}</h3>
              <p style={{ color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
                Role: {currentUser.role.toUpperCase()}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                {currentUser.email}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (currentUser.role === 'client') setActiveView('client');
                    else if (currentUser.role === 'freelancer') setActiveView('freelancer');
                    else if (currentUser.role === 'admin') setActiveView('admin');
                    else setActiveView('gigs');
                  }}
                  style={{ width: '100%' }}
                >
                  Go to {currentUser.role === 'client' ? 'Client Hub' : currentUser.role === 'freelancer' ? 'Freelancer Suite' : 'Admin Console'} <ArrowRight size={16} />
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setActiveView('gigs')}
                  style={{ width: '100%' }}
                >
                  Browse Marketplace Gigs
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => logout()}
                  style={{ width: '100%', color: 'var(--accent-rose)', marginTop: '8px' }}
                >
                  Sign Out of Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs Switcher */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(5, 10, 18, 0.8)',
                  padding: '4px',
                  borderRadius: '14px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '28px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    transition: 'all 0.25s ease',
                    background: !isSignup ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    color: !isSignup ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: !isSignup ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none',
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage('');
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    transition: 'all 0.25s ease',
                    background: isSignup ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    color: isSignup ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: isSignup ? '0 4px 15px rgba(99, 102, 241, 0.4)' : 'none',
                  }}
                >
                  Create Account
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
                  {isSignup ? 'Register New Account' : 'Welcome Back'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {isSignup
                    ? 'Create your verified FreelanceStack account with Supabase.'
                    : 'Enter your credentials to access your real-time dashboard.'}
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fecdd3',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  <AlertCircle size={18} color="var(--accent-rose)" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Sign Up Role Picker */}
                {isSignup && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Choose Account Type
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setRole('client')}
                        style={{
                          padding: '12px 8px',
                          borderRadius: '12px',
                          border: role === 'client' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                          background: role === 'client' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(5, 10, 18, 0.6)',
                          color: role === 'client' ? '#ffffff' : 'var(--text-secondary)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Briefcase size={20} color={role === 'client' ? 'var(--accent-cyan)' : 'currentColor'} />
                        <span>Client</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('freelancer')}
                        style={{
                          padding: '12px 8px',
                          borderRadius: '12px',
                          border: role === 'freelancer' ? '2px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                          background: role === 'freelancer' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 10, 18, 0.6)',
                          color: role === 'freelancer' ? '#ffffff' : 'var(--text-secondary)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <UserCheck size={20} color={role === 'freelancer' ? 'var(--accent-emerald)' : 'currentColor'} />
                        <span>Freelancer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        style={{
                          padding: '12px 8px',
                          borderRadius: '12px',
                          border: role === 'admin' ? '2px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                          background: role === 'admin' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(5, 10, 18, 0.6)',
                          color: role === 'admin' ? '#ffffff' : 'var(--text-secondary)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ShieldCheck size={20} color={role === 'admin' ? 'var(--accent-amber)' : 'currentColor'} />
                        <span>Admin</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Full Name for signup */}
                {isSignup && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="e.g. Satoshi Nakamoto"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        style={{ width: '100%', paddingLeft: '44px' }}
                      />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ width: '100%', paddingLeft: '44px' }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ width: '100%', paddingLeft: '44px', paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '12px',
                        background: 'none',
                        color: 'var(--text-muted)',
                        padding: '2px',
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {isSignup && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Minimum 6 characters with letters and numbers.
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                  }}
                >
                  {loading ? (
                    'Processing Supabase Request...'
                  ) : isSignup ? (
                    <>
                      Create Supabase Account <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      Sign In to Workspace <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switcher */}
              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isSignup ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMessage('');
                      }}
                      style={{ background: 'none', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Sign In here
                    </button>
                  </span>
                ) : (
                  <span>
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setErrorMessage('');
                      }}
                      style={{ background: 'none', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Create free account
                    </button>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
