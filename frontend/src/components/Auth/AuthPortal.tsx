import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Briefcase,
  UserCheck,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Layers,
  Radio,
  KeyRound,
} from 'lucide-react';
import type { AccountRole } from '../../types';

export const AuthPortal: React.FC = () => {
  const { login, signup, adminLogin, setActiveView } = useApp();

  // Selected role tab for login/signup
  const [selectedRole, setSelectedRole] = useState<AccountRole>('client');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isSignup = authMode === 'signup';
  const isAdmin = selectedRole === 'admin';

  const roleMeta = {
    client: {
      title: 'Client Workspace',
      tagline: 'Hire top engineers & manage milestone escrows',
      badge: 'CLIENT PORTAL',
      icon: Briefcase,
      color: 'var(--accent-cyan)',
      bgGlow: 'rgba(6, 182, 212, 0.12)',
      borderActive: 'rgba(6, 182, 212, 0.5)',
      desc: 'Post job requirements, receive bids from verified freelancers, create automated milestone escrows, and approve deliverables.',
      features: [
        'Post project scopes with AI Copilot',
        'Review technical proposals & bids',
        'Secure 100% smart milestone escrows',
        'Approve deliverables & release funds',
      ],
      demoName: 'Alex Rivera (Client Founder)',
      demoEmail: 'client@freelancestack.io',
      demoPass: 'Password123!',
      targetView: 'client' as const,
    },
    freelancer: {
      title: 'Freelancer Suite',
      tagline: 'Discover client scopes & secure payouts',
      badge: 'FREELANCER ACCESS',
      icon: UserCheck,
      color: 'var(--accent-emerald)',
      bgGlow: 'rgba(16, 185, 129, 0.12)',
      borderActive: 'rgba(16, 185, 129, 0.5)',
      desc: 'Explore open client job requirements, generate winning AI proposals, submit milestone deliverables, and build your verified reputation.',
      features: [
        'Browse high-paying client requirements',
        'Submit technical bids & milestones',
        'Direct workspace chat & file handover',
        'Identity & skill trust verification',
      ],
      demoName: 'Elena Vance (AI & Full-Stack Lead)',
      demoEmail: 'freelancer@freelancestack.io',
      demoPass: 'Password123!',
      targetView: 'freelancer' as const,
    },
    admin: {
      title: 'Admin Governance',
      tagline: 'Master Passcode Protected • Escrow Audit & Platform Supervision',
      badge: 'MASTER CONSOLE',
      icon: ShieldCheck,
      color: 'var(--accent-amber)',
      bgGlow: 'rgba(245, 158, 11, 0.12)',
      borderActive: 'rgba(245, 158, 11, 0.5)',
      desc: 'Master platform supervision: inspect GMV volume, resolve escrow dispute mediation, verify applicant identities, and audit system logs.',
      features: [
        'Protected by Master Security Passcode',
        'Full platform GMV & analytics oversight',
        'Review & approve identity verifications',
        'Dispute mediation & escrow fund control',
      ],
      demoName: 'Platform Administrator',
      demoEmail: 'admin@freelancestack.io',
      demoPass: 'admin@426',
      targetView: 'admin' as const,
    },
  };

  const activeMeta = roleMeta[selectedRole];
  const ActiveIcon = activeMeta.icon;

  const handleRoleSelect = (role: AccountRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    setEmail('');
    setPassword('');
    setFullName('');
    setAdminPasscode('');
  };

  // Standard Client / Freelancer Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        setErrorMessage('Please enter both your email address and password.');
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

        const result = await signup(email.trim(), password, fullName.trim(), selectedRole);
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to create account.');
        } else {
          setActiveView(activeMeta.targetView);
        }
      } else {
        const result = await login(email.trim(), password);
        if (!result.success) {
          setErrorMessage(result.error || 'Invalid credentials or user not found.');
        } else {
          setActiveView(activeMeta.targetView);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  // Admin Master Passcode Submit
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (!adminPasscode.trim()) {
        setErrorMessage('Please enter the master admin passcode.');
        setLoading(false);
        return;
      }

      if (adminPasscode.trim() !== 'admin@426') {
        setErrorMessage('Invalid Admin Master Passcode. Access denied.');
        setLoading(false);
        return;
      }

      const result = await adminLogin(adminPasscode.trim());
      if (!result.success) {
        setErrorMessage(result.error || 'Admin verification failed.');
      } else {
        setActiveView('admin');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Admin authentication error.');
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Demo Login (for Client and Freelancer)
  const handleInstantDemoLogin = async (role: AccountRole) => {
    setLoading(true);
    setErrorMessage('');
    const targetMeta = roleMeta[role];

    if (role === 'admin') {
      const res = await adminLogin('admin@426');
      if (!res.success) {
        setErrorMessage(res.error || 'Admin login failed.');
      } else {
        setActiveView('admin');
      }
      setLoading(false);
      return;
    }

    const regRes = await signup(targetMeta.demoEmail, targetMeta.demoPass, targetMeta.demoName, role);
    if (!regRes.success) {
      const loginRes = await login(targetMeta.demoEmail, targetMeta.demoPass);
      if (!loginRes.success) {
        setErrorMessage(loginRes.error || 'Demo login failed.');
      } else {
        setActiveView(targetMeta.targetView);
      }
    } else {
      setActiveView(targetMeta.targetView);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99, 102, 241, 0.22), transparent 70%), #040810',
        color: 'var(--text-primary)',
        padding: '32px 20px 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Top Branding Header */}
      <div
        style={{
          maxWidth: '1200px',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '36px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-icon-box" style={{ width: 44, height: 44 }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-title" style={{ fontSize: '1.4rem' }}>FreelanceStack</span>
              <span className="brand-tag">ELITE</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Decentralized Talent & Milestone Escrow Engine
            </p>
          </div>
        </div>

        {/* Live Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Live Supabase Connection Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8rem',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--accent-emerald)',
              fontWeight: 600,
            }}
          >
            <Radio size={14} className="pulse-icon" />
            <span>⚡ Supabase Live</span>
          </div>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div style={{ textAlign: 'center', maxWidth: '780px', marginBottom: '40px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#a5b4fc',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          <Sparkles size={14} />
          <span>Segregated Role-Based Portals</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '14px' }}>
          Select Your Workspace to <span className="hero-highlight">Get Started</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Choose your designated portal below. Clients and Freelancers access standard account workflows, while Admin requires master security passcode authentication.
        </p>
      </div>

      {/* 3 Prominent Role Selection Cards */}
      <div
        style={{
          maxWidth: '1200px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}
      >
        {(['client', 'freelancer', 'admin'] as const).map((r) => {
          const item = roleMeta[r];
          const Icon = item.icon;
          const isSelected = selectedRole === r;

          return (
            <div
              key={r}
              onClick={() => handleRoleSelect(r)}
              style={{
                padding: '28px 24px',
                borderRadius: '20px',
                background: isSelected ? item.bgGlow : 'rgba(13, 22, 38, 0.65)',
                border: isSelected ? `2px solid ${item.color}` : '1px solid var(--border-subtle)',
                boxShadow: isSelected ? `0 16px 36px -8px ${item.bgGlow}` : 'none',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                transform: isSelected ? 'translateY(-4px)' : 'none',
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: item.color,
                    color: '#030712',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                  }}
                >
                  ACTIVE
                </div>
              )}

              <div>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                    display: 'grid',
                    placeItems: 'center',
                    color: item.color,
                    marginBottom: '18px',
                    border: `1px solid ${isSelected ? item.color : 'rgba(255, 255, 255, 0.1)'}`,
                  }}
                >
                  <Icon size={26} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: item.color,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {item.badge}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
                  {item.desc}
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {item.features.map((feat, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={14} color={item.color} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action button inside card */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleSelect(r);
                }}
                className="btn-secondary"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  justifyContent: 'center',
                  background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  borderColor: isSelected ? item.borderActive : 'var(--border-subtle)',
                }}
              >
                {r === 'admin' ? (
                  <>
                    <KeyRound size={14} color={item.color} /> Enter with Master Passcode
                  </>
                ) : (
                  <>
                    <Zap size={14} color={item.color} /> Select {r.toUpperCase()} Portal
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Auth Box for the Selected Role */}
      <div
        className="glass-panel"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '36px 32px',
          borderRadius: '24px',
          background: 'rgba(13, 22, 38, 0.95)',
          border: `1px solid ${activeMeta.borderActive}`,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* Header inside form */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: activeMeta.bgGlow,
              display: 'grid',
              placeItems: 'center',
              color: activeMeta.color,
              border: `1px solid ${activeMeta.color}`,
            }}
          >
            <ActiveIcon size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {isAdmin ? 'Admin Master Governance Access' : isSignup ? `Register for ${activeMeta.title}` : `Sign In to ${activeMeta.title}`}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isAdmin ? 'Enter master security passcode to access administrator console.' : activeMeta.tagline}
            </span>
          </div>
        </div>

        {/* Tab Switcher: Only shown for Client & Freelancer (Hidden for Admin) */}
        {!isAdmin && (
          <div
            style={{
              display: 'flex',
              background: 'rgba(5, 10, 18, 0.8)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '24px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage('');
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                background: !isSignup ? activeMeta.color : 'transparent',
                color: !isSignup ? '#030712' : 'var(--text-secondary)',
                cursor: 'pointer',
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
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                background: isSignup ? activeMeta.color : 'transparent',
                color: isSignup ? '#030712' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Create New Account
            </button>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
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

        {/* ADMIN EXCLUSIVE: Passcode Only Form */}
        {isAdmin ? (
          <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                ADMIN MASTER PASSCODE
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--accent-amber)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter admin password (admin@426)"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                    paddingRight: '44px',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    background: 'rgba(13, 22, 38, 0.9)',
                  }}
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
                    cursor: 'pointer',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                🔒 Single password access for master administrator console.
              </span>
            </div>

            {/* Admin Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.98rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#030712',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.4)',
              }}
            >
              {loading ? (
                'Verifying Master Passcode...'
              ) : (
                <>
                  <ShieldCheck size={18} /> Enter Admin Governance Console <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* CLIENT & FREELANCER: Standard Auth Form */
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Full Name for Signup */}
            {isSignup && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Your Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder={selectedRole === 'client' ? 'e.g. Satoshi Nakamoto' : 'e.g. Ada Lovelace'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={{ width: '100%', paddingLeft: '44px' }}
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder={`you@${selectedRole}.com`}
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
                    cursor: 'pointer',
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {isSignup && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Must be at least 6 characters.
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
                fontSize: '0.98rem',
                fontWeight: 700,
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              {loading ? (
                'Authenticating with Supabase...'
              ) : isSignup ? (
                <>
                  Create {selectedRole.toUpperCase()} Account <ArrowRight size={18} />
                </>
              ) : (
                <>
                  Enter {selectedRole.toUpperCase()} Workspace <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Demo Credentials Footer for Client / Freelancer */}
        {!isAdmin && (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Need quick test access?</span>
            <button
              type="button"
              onClick={() => handleInstantDemoLogin(selectedRole)}
              style={{
                background: 'none',
                color: activeMeta.color,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Zap size={14} /> Enter as Demo {selectedRole.toUpperCase()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

