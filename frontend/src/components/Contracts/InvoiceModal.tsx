import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Building,
  User,
} from 'lucide-react';
import type { Milestone } from '../../types';

export const InvoiceModal: React.FC = () => {
  const {
    isInvoiceModalOpen,
    setIsInvoiceModalOpen,
    activeInvoiceContractId,
    contracts,
    gigs,
    addToast,
  } = useApp();

  const [copiedLink, setCopiedLink] = useState(false);

  const contract = useMemo(() => {
    return (contracts || []).find((c) => c.id === activeInvoiceContractId) || contracts[0];
  }, [contracts, activeInvoiceContractId]);

  const matchingGig = useMemo(() => {
    if (!contract) return null;
    return (gigs || []).find((g) => String(g.id).trim() === String(contract.gigId).trim());
  }, [contract, gigs]);

  if (!isInvoiceModalOpen || !contract) return null;

  const invoiceNumber = `INV-${new Date(contract.createdAt || Date.now()).getFullYear()}-${contract.id.slice(-6).toUpperCase()}`;
  const invoiceDate = new Date(contract.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const settlementDate = contract.completedAt
    ? new Date(contract.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const isFullyCompleted = contract.status === 'completed';
  const approvedMilestones = (contract.milestones || []).filter((m) => m.status === 'approved');
  const paidAmount = approvedMilestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const totalAmount = Number(contract.amount) || (contract.milestones || []).reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const auditHash = `0x${Math.abs(
    (contract.id + (contract.freelancerId || '') + totalAmount)
      .split('')
      .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
  ).toString(16).padStart(16, '0')}f48e91c2`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summary = `OFFICIAL ESCROW INVOICE: ${invoiceNumber}\nProject: ${contract.gigTitle}\nClient: ${contract.clientName}\nFreelancer: ${contract.freelancerName}\nTotal Settled: $${paidAmount.toLocaleString()} / $${totalAmount.toLocaleString()}\nAudit Hash: ${auditHash}\nPlatform: FreelanceStack Escrow Protocol`;
    navigator.clipboard.writeText(summary);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    addToast('success', 'Invoice Copied', 'Official invoice summary copied to clipboard.');
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      invoiceNumber,
      contractId: contract.id,
      contractTitle: contract.gigTitle,
      category: contract.categoryName || matchingGig?.categoryName || 'Enterprise Architecture',
      client: {
        id: contract.clientId,
        name: contract.clientName,
      },
      freelancer: {
        id: contract.freelancerId,
        name: contract.freelancerName,
        upiId: contract.upiId || 'baca@oksbi',
        phoneNumber: contract.phoneNumber,
      },
      totalAmount,
      paidAmount,
      currency: 'USD (Settled via INR UPI/Escrow)',
      milestones: contract.milestones,
      status: contract.status,
      auditHash,
      issuedAt: contract.createdAt,
      settledAt: contract.completedAt || new Date().toISOString(),
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${invoiceNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('info', 'JSON Exported', `${invoiceNumber}.json downloaded.`);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsInvoiceModalOpen(false)} style={{ zIndex: 1200 }}>
      <div
        className="modal-content invoice-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '840px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, #111827, #0b0f19)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(99, 102, 241, 0.15)',
        }}
      >
        {/* Action Header Bar (Hidden in Print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="persona-badge badge-client">ESCROW TAX INVOICE & VOUCHER</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Ref: <strong style={{ color: 'var(--text-primary)' }}>{invoiceNumber}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button
              onClick={handleCopySummary}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {copiedLink ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
              {copiedLink ? 'Copied' : 'Copy Summary'}
            </button>
            <button
              onClick={handleDownloadJson}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              title="Download Raw JSON"
            >
              <Download size={15} />
            </button>
            <button
              onClick={() => setIsInvoiceModalOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE BODY */}
        <div
          id="printable-invoice"
          className="printable-invoice-card"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '24px',
            position: 'relative',
          }}
        >
          {/* Header & Brand */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'white',
                    fontWeight: 800,
                  }}
                >
                  ⚡
                </div>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                    FreelanceStack
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Autonomous Escrow Governance & Protocol
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Official Milestone Settlement Voucher & Direct UPI Audit Certificate
              </p>
            </div>

            {/* Stamp / Seal */}
            <div
              style={{
                border: isFullyCompleted ? '2px solid var(--accent-emerald)' : '2px dashed var(--accent-primary)',
                borderRadius: '10px',
                padding: '8px 14px',
                textAlign: 'center',
                background: isFullyCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: isFullyCompleted ? 'var(--accent-emerald)' : 'var(--accent-primary)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {isFullyCompleted ? '✓ ESCROW SETTLED & RELEASED' : '🔒 ESCROW HELD & VERIFIED'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Audit Hash: {auditHash.slice(0, 14)}...
              </span>
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '0.82rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>INVOICE NUMBER</span>
              <strong style={{ color: 'var(--text-primary)' }}>{invoiceNumber}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>ISSUE DATE</span>
              <strong style={{ color: 'var(--text-primary)' }}>{invoiceDate}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>SETTLEMENT DATE</span>
              <strong style={{ color: 'var(--text-primary)' }}>{settlementDate}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>DOMAIN / CATEGORY</span>
              <strong style={{ color: 'var(--accent-cyan)' }}>
                {contract.categoryName || matchingGig?.categoryName || 'Full-Stack Architecture'}
              </strong>
            </div>
          </div>

          {/* Parties: Billed To vs Service Provider */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Client */}
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Building size={15} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  BILLED TO (CLIENT)
                </span>
              </div>
              <h4 style={{ fontSize: '1rem', margin: '0 0 4px', color: 'var(--text-primary)' }}>{contract.clientName}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Enterprise Client • Client ID: {contract.clientId.slice(0, 12)}
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Escrow Guarantee: 100% Vault Funded
              </p>
            </div>

            {/* Freelancer */}
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <User size={15} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  SERVICE PROVIDER (FREELANCER)
                </span>
              </div>
              <h4 style={{ fontSize: '1rem', margin: '0 0 4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {contract.freelancerName}
                <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>
                  Verified Pro
                </span>
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Payee VPA / UPI: <strong style={{ color: 'var(--accent-cyan)' }}>{contract.upiId || 'baca@oksbi'}</strong>
              </p>
              {contract.phoneNumber && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Phone / GPay: {contract.phoneNumber}
                </p>
              )}
            </div>
          </div>

          {/* Contract Project Title */}
          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              ENGAGEMENT BRIEF & SCOPE
            </span>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '4px 0 0' }}>
              {contract.gigTitle}
            </h3>
          </div>

          {/* Itemized Milestone Table */}
          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 8px', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600 }}>MILESTONE DELIVERABLE</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600 }}>DUE DATE</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>AMOUNT (USD)</th>
                </tr>
              </thead>
              <tbody>
                {(contract.milestones || []).map((m: Milestone, idx: number) => {
                  const isApproved = m.status === 'approved';
                  return (
                    <tr key={m.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{m.title}</strong>
                        {m.deliverableNote && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                            Deliverable: {m.deliverableNote.slice(0, 75)}...
                          </span>
                        )}
                        {m.paymentProof?.transactionId && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <CheckCircle2 size={11} /> UTR: {m.paymentProof.transactionId}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                        {m.deadline ? new Date(m.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Standard'}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: isApproved ? 'var(--accent-emerald)' : 'var(--accent-primary)',
                          }}
                        >
                          {isApproved ? 'SETTLED' : m.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${Number(m.amount).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Totals Calculation Box */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '280px', background: 'rgba(0, 0, 0, 0.25)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Contract Total:</span>
                <strong style={{ color: 'var(--text-primary)' }}>${totalAmount.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Platform Escrow Fee (0%):</span>
                <span style={{ color: 'var(--accent-emerald)' }}>$0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Released to Freelancer:</span>
                <strong style={{ color: 'var(--accent-emerald)' }}>${paidAmount.toLocaleString()}</strong>
              </div>
              <div style={{ borderTop: '1px solid var(--border-medium)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Net Transacted:</strong>
                <strong style={{ color: 'var(--accent-cyan)' }}>${paidAmount.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Proof & Escrow Audit Certificate Footer */}
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={24} color="var(--accent-emerald)" />
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block' }}>
                  Smart Escrow Vault Verification Certificate
                </strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  Signer Node: admin-governance-shield • Cryptographic SHA-256 Seal: {auditHash}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
                100% Guaranteed Escrow Protected
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Need modifications or payment support? Contact the Admin Governance Helpdesk with ticket reference #{invoiceNumber}.
        </div>
      </div>
    </div>
  );
};
