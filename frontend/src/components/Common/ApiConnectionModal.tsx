import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Globe,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const ApiConnectionModal: React.FC = () => {
  const {
    isApiModalOpen,
    setIsApiModalOpen,
    apiUrl,
    backendConnected,
    setCustomApiUrl,
    refreshGigs,
    addToast,
  } = useApp();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isApiModalOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputUrl.trim().replace(/\/+$/, '');
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`${clean}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        setTestResult({ ok: true, message: `Connected successfully! (Service: ${data.service || 'Marketplace Backend'})` });
        setCustomApiUrl(clean);
        await refreshGigs();
        addToast('success', 'Backend Connected 🟢', 'Real-time database sync is active across all portals.');
      } else {
        setTestResult({ ok: false, message: `Backend responded with HTTP ${res.status}. Check your Render logs.` });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: `Failed to reach ${clean}. Make sure your Render backend service is awake and not sleeping.`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetDefault = () => {
    const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    setInputUrl(envUrl);
    setCustomApiUrl('');
    setTestResult(null);
    addToast('info', 'Reset to Environment Default', `Using URL: ${envUrl}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={() => setIsApiModalOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'var(--bg-card, #111827)',
          border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: backendConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                color: backendConnected ? 'var(--accent-emerald, #10b981)' : '#f43f5e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Server size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main, #f9fafb)' }}>
                Cloud Backend Sync Status
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #9ca3af)' }}>
                Synchronizes Gigs, Bids, Escrows & Verifications in real time
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsApiModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #9ca3af)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Banner */}
        <div style={{ padding: '20px 24px' }}>
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: backendConnected
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(244, 63, 94, 0.1)',
              border: `1px solid ${
                backendConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'
              }`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            {backendConnected ? (
              <CheckCircle2 size={22} style={{ color: '#10b981', flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={22} style={{ color: '#f43f5e', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: backendConnected ? '#10b981' : '#f43f5e' }}>
                {backendConnected ? 'Backend Connected & Active' : 'Backend Unreachable / Offline'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #9ca3af)', marginTop: '2px' }}>
                {backendConnected
                  ? `All client, freelancer, and admin data is synchronizing in real time with: ${apiUrl}`
                  : `Your frontend cannot reach the API server at: ${apiUrl}`}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleTestAndSave}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-main, #f9fafb)',
                marginBottom: '8px',
              }}
            >
              Backend API URL
            </label>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Globe
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #9ca3af)',
                }}
              />
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://marketplace-backend-xxxx.onrender.com"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                  borderRadius: '10px',
                  color: 'var(--text-main, #f9fafb)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {testResult && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  marginBottom: '16px',
                  background: testResult.ok ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: testResult.ok ? '#10b981' : '#f43f5e',
                  border: `1px solid ${testResult.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                }}
              >
                {testResult.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="submit"
                disabled={testing || !inputUrl.trim()}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: testing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: testing ? 0.7 : 1,
                }}
              >
                {testing ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Connecting & Testing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Connect & Sync Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetDefault}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-muted, #9ca3af)',
                  border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset Default
              </button>
            </div>
          </form>

          {/* Render Sleep Notice */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              fontSize: '0.78rem',
              color: 'var(--text-muted, #9ca3af)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main, #f9fafb)', marginBottom: '4px' }}>
              <ShieldCheck size={14} style={{ color: 'var(--accent-cyan, #0ea5e9)' }} />
              <span>Tip for Render Free Tier:</span>
            </div>
            If your backend hasn't received requests for 15 minutes, Render puts it to sleep. The first request takes ~30–50 seconds to spin up. Once awake, all bids, gigs, and verifications synchronize instantly across all devices.
          </div>
        </div>
      </div>
    </div>
  );
};
