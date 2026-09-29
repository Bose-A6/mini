import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AuthPortal } from './components/Auth/AuthPortal';
import { ToastContainer } from './components/Common/ToastContainer';
import { GigExplorer } from './components/Marketplace/GigExplorer';
import { ClientDashboard } from './components/Client/ClientDashboard';
import { FreelancerDashboard } from './components/Freelancer/FreelancerDashboard';
import { ContractWorkspace } from './components/Contracts/ContractWorkspace';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { VerificationWizard } from './components/Verification/VerificationWizard';
import { GigDetailModal } from './components/Marketplace/GigDetailModal';
import { SupportModal } from './components/Support/SupportModal';
import { FloatingSupportButton } from './components/Support/FloatingSupportButton';
import { InvoiceModal } from './components/Contracts/InvoiceModal';
import { DirectContractModal } from './components/Contracts/DirectContractModal';
import { ApiConnectionModal } from './components/Common/ApiConnectionModal';
import { ShieldCheck, Lock, Sparkles, Layers } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, activeView } = useApp();

  // If no user is logged in, show the Segregated Role Portal as the first and only entry gate
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AuthPortal />
        <ApiConnectionModal />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Segregated Role Navigation Bar */}
      <Navbar />

      {/* 2. Role-Dedicated Workspace Views */}
      <main style={{ flex: 1 }}>
        {activeView === 'client' && <ClientDashboard />}
        {activeView === 'freelancer' && <FreelancerDashboard />}
        {activeView === 'admin' && <AdminDashboard />}
        {activeView === 'gigs' && <GigExplorer />}
        {activeView === 'contracts' && <ContractWorkspace />}
        {activeView === 'verification' && <VerificationWizard />}
      </main>

      {/* 3. Global Project Detail & Proposal Modal */}
      <GigDetailModal />

      {/* 4. Global Customer & Freelancer Support Modal */}
      <SupportModal />

      {/* 5. Floating Quick Support Button */}
      <FloatingSupportButton />

      {/* 6. Branded Tax Invoice & Payment Receipt Modal */}
      <InvoiceModal />

      {/* 7. Direct Re-Hire & Escrow Contract Modal */}
      <DirectContractModal />

      {/* 8. Live Backend API Connection & Diagnostics Modal */}
      <ApiConnectionModal />

      {/* 6. Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '36px 32px 28px',
          background: 'rgba(5, 10, 18, 0.95)',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-icon-box" style={{ width: 32, height: 32 }}>
              <Layers size={18} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>FreelanceStack Elite</strong>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                Logged in as <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{currentUser.fullName}</span> ({currentUser.role.toUpperCase()})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} color="var(--accent-emerald)" /> 100% Milestone Escrow Guarantee
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={15} color="var(--accent-cyan)" /> Supabase JWT Authentication
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={15} color="var(--accent-amber)" /> AI Project Copilot
            </span>
          </div>
        </div>

        <div
          style={{
            maxWidth: '1400px',
            margin: '20px auto 0',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <span>© 2026 FreelanceStack. Direct Supabase Cloud Connection.</span>
          <span>Zero simulation mode • Clean slate state.</span>
        </div>
      </footer>

      {/* 5. Toast Notifications Container */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
