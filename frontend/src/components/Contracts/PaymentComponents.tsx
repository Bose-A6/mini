import React, { useState, useRef } from 'react';
import {
  QrCode,
  Smartphone,
  CreditCard,
  Copy,
  Check,
  CheckCircle2,
  X,
  ShieldCheck,
  Camera,
  Receipt,
  FileCheck,
} from 'lucide-react';
import type { Milestone, MilestonePaymentDetails, MilestonePaymentProof } from '../../types';

// ==========================================
// 1. FREELANCER PAYMENT COORDINATES MODAL
// ==========================================
interface FreelancerPaymentModalProps {
  milestone: Milestone;
  contractId: string;
  contractFreelancerName?: string;
  initialDetails?: MilestonePaymentDetails;
  onSave: (details: MilestonePaymentDetails) => void;
  onClose: () => void;
}

export const FreelancerPaymentModal: React.FC<FreelancerPaymentModalProps> = ({
  milestone,
  contractFreelancerName,
  initialDetails,
  onSave,
  onClose,
}) => {
  const [upiId, setUpiId] = useState(initialDetails?.upiId || 'baca@oksbi');
  const [phoneNumber, setPhoneNumber] = useState(initialDetails?.phoneNumber || '+91 98765 43210');
  const [accountName, setAccountName] = useState(initialDetails?.accountName || contractFreelancerName || 'Verified Freelancer');
  const [paymentNote, setPaymentNote] = useState(initialDetails?.paymentNote || 'Please include the contract ID in the transfer remarks.');
  const [customQrUrl, setCustomQrUrl] = useState(initialDetails?.qrCodeUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate dynamic UPI payment URL
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(accountName.trim())}&am=${milestone.amount}&cu=INR&tn=${encodeURIComponent(`Milestone Payment: ${milestone.title.slice(0, 20)}`)}`;
  const dynamicQrImage = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiPayUrl)}`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomQrUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId.trim() && !phoneNumber.trim()) {
      alert('Please provide at least a UPI ID or Phone Number.');
      return;
    }

    onSave({
      upiId: upiId.trim(),
      phoneNumber: phoneNumber.trim(),
      accountName: accountName.trim(),
      paymentNote: paymentNote.trim(),
      qrCodeUrl: customQrUrl || dynamicQrImage,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, #131722, #0d111a)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Freelancer Payment Details</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                For Milestone: <strong>{milestone.title}</strong> (${milestone.amount.toLocaleString()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', marginBottom: '16px' }}>
            {/* Left Inputs */}
            <div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  UPI ID (VPA) <span style={{ color: 'var(--accent-cyan)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@oksbi or 9876543210@paytm"
                    style={{ width: '100%', paddingLeft: '36px' }}
                    required
                  />
                  <CreditCard size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  PHONE NUMBER (FOR GPAY / PHONEPE / PAYTM)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    style={{ width: '100%', paddingLeft: '36px' }}
                  />
                  <Smartphone size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  PAYEE / ACCOUNT NAME
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Official name on bank account / UPI"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  PAYMENT INSTRUCTIONS / NOTE
                </label>
                <textarea
                  rows={2}
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Please share UTR after payment or include contract ID"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Right: Live QR Preview */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--accent-cyan)', marginBottom: '10px' }}>
                LIVE SCANNER PREVIEW
              </span>

              <div
                style={{
                  background: 'white',
                  padding: '10px',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  marginBottom: '10px',
                  display: 'inline-block',
                }}
              >
                <img
                  src={customQrUrl || dynamicQrImage}
                  alt="UPI QR Code"
                  style={{ width: '160px', height: '160px', display: 'block', objectFit: 'contain' }}
                />
              </div>

              <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
                {upiId || 'Enter UPI ID'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Amount: ${milestone.amount.toLocaleString()}
              </span>

              <div style={{ marginTop: '12px', width: '100%' }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', fontSize: '0.78rem', padding: '6px 10px' }}
                >
                  <Camera size={14} /> {customQrUrl ? 'Change Custom QR' : 'Upload Custom QR'}
                </button>
                {customQrUrl && (
                  <button
                    type="button"
                    onClick={() => setCustomQrUrl('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-rose)',
                      fontSize: '0.72rem',
                      marginTop: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Reset to auto-generated QR
                  </button>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: '0.8rem',
              color: '#a7f3d0',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ShieldCheck size={16} color="var(--accent-emerald)" />
            <span>
              These details will be securely rendered for the client on this milestone with one-click copy and instant QR scanning.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Check size={16} /> Save & Share Coordinates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. CLIENT PAYMENT & PROOF SUBMISSION MODAL
// ==========================================
interface ClientPaymentModalProps {
  milestone: Milestone;
  contractId: string;
  freelancerName: string;
  freelancerAvatar?: string;
  initialDetails?: MilestonePaymentDetails;
  onSubmitProof: (proof: MilestonePaymentProof, andApprove?: boolean) => void;
  onClose: () => void;
}

export const ClientPaymentModal: React.FC<ClientPaymentModalProps> = ({
  milestone,
  contractId,
  freelancerName,
  initialDetails,
  onSubmitProof,
  onClose,
}) => {
  const upiId = milestone.paymentDetails?.upiId || initialDetails?.upiId || 'baca@oksbi';
  const phoneNumber = milestone.paymentDetails?.phoneNumber || initialDetails?.phoneNumber || '+91 98765 43210';
  const accountName = milestone.paymentDetails?.accountName || initialDetails?.accountName || freelancerName;
  const paymentNote = milestone.paymentDetails?.paymentNote || initialDetails?.paymentNote;

  // Auto-generate dynamic UPI payment URL
  const upiPayUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(accountName)}&am=${milestone.amount}&cu=INR&tn=${encodeURIComponent(`Milestone: ${milestone.title.slice(0, 20)}`)}`;
  const qrImage = milestone.paymentDetails?.qrCodeUrl || initialDetails?.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayUrl)}`;

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Proof form states
  const [proofUrl, setProofUrl] = useState(milestone.paymentProof?.proofUrl || '');
  const [transactionId, setTransactionId] = useState(milestone.paymentProof?.transactionId || `UPI-${Date.now().toString().slice(-8)}`);
  const [paymentMode, setPaymentMode] = useState<'upi' | 'gpay' | 'phonepe' | 'paytm' | 'bank_transfer' | 'other'>(milestone.paymentProof?.paymentMode || 'upi');
  const [clientNote, setClientNote] = useState(milestone.paymentProof?.note || `Paid $${milestone.amount.toLocaleString()} for milestone: ${milestone.title}`);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string, type: 'upi' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setProofUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinish = (andApprove: boolean) => {
    if (milestone.status !== 'submitted' && milestone.status !== 'approved') {
      setValidationError('⚠️ The freelancer must first submit deliverables for this milestone before escrow can be approved & released.');
      return;
    }

    if (!proofUrl) {
      setValidationError('⚠️ Please attach / upload the payment screenshot receipt before approving and releasing escrow.');
      return;
    }

    if (!transactionId.trim()) {
      setValidationError('⚠️ Please enter the Transaction ID / UTR reference number.');
      return;
    }

    setValidationError(null);
    const proof: MilestonePaymentProof = {
      proofUrl,
      transactionId: transactionId.trim(),
      paymentMode,
      amountPaid: milestone.amount,
      submittedAt: new Date().toISOString(),
      note: clientNote.trim(),
      status: andApprove ? 'confirmed' : 'submitted',
    };

    onSubmitProof(proof, andApprove);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '740px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, #131722, #0d111a)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="persona-badge badge-client">ESCROW SETTLEMENT</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                MILESTONE PAYOUT: ${milestone.amount.toLocaleString()}
              </span>
            </div>
            <h3 style={{ fontSize: '1.3rem', margin: 0 }}>Pay Freelancer & Upload Proof</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Contract: <strong>{contractId}</strong> • Payee: <strong>{freelancerName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {milestone.status !== 'submitted' && milestone.status !== 'approved' && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.84rem',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <X size={18} color="var(--accent-rose)" />
            <span>
              <strong>Deliverable Pending:</strong> The freelancer has not submitted deliverable work for this milestone yet. Escrow can only be released after deliverable submission and client review.
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.15fr)', gap: '22px', marginBottom: '20px' }}>
          
          {/* LEFT: SCAN TO PAY QR & UPI CODES */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <QrCode size={18} color="var(--accent-emerald)" />
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Scan with UPI App</strong>
            </div>

            {/* QR Card */}
            <div
              style={{
                background: 'white',
                padding: '12px',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                marginBottom: '14px',
              }}
            >
              <img
                src={qrImage}
                alt="Payment QR"
                style={{ width: '180px', height: '180px', display: 'block', objectFit: 'contain' }}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Compatible with <strong>Google Pay, PhonePe, Paytm, BHIM</strong>
            </div>

            {/* Quick Copy Badges */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* UPI ID */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>UPI ID</span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {upiId}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(upiId, 'upi')}
                  style={{
                    background: copiedUpi ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                  }}
                >
                  {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Phone Number */}
              {phoneNumber && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Phone / GPay</span>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{phoneNumber}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(phoneNumber, 'phone')}
                    style={{
                      background: copiedPhone ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copiedPhone ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}

              {/* Direct UPI Deep Link Action */}
              <a
                href={upiPayUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  marginTop: '4px',
                }}
              >
                <Smartphone size={14} /> Open in UPI App (Mobile / Desktop)
              </a>
            </div>

            {paymentNote && (
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', margin: '10px 0 0', textAlign: 'left', lineHeight: 1.3 }}>
                💡 <em>Freelancer note: {paymentNote}</em>
              </p>
            )}
          </div>

          {/* RIGHT: PROOF UPLOAD & TRANSACTION DETAILS */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} color="var(--accent-cyan)" />
              Submit Payment Proof & Receipt
            </h4>

            {/* Payment App / Mode */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                PAYMENT APP / CHANNEL USED
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'upi', label: 'UPI / BHIM' },
                  { id: 'gpay', label: 'Google Pay' },
                  { id: 'phonepe', label: 'PhonePe' },
                  { id: 'paytm', label: 'Paytm' },
                  { id: 'bank_transfer', label: 'Bank IMPS' },
                  { id: 'other', label: 'Other' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMode(mode.id as any)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      background: paymentMode === mode.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                      color: paymentMode === mode.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      border: paymentMode === mode.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction ID / UTR */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                TRANSACTION ID / UTR REFERENCE NUMBER <span style={{ color: 'var(--accent-cyan)' }}>*</span>
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. 428901239840 or UPI/Ref-98234"
                style={{ width: '100%', fontSize: '0.88rem' }}
                required
              />
            </div>

            {/* Screenshot Upload / Thumbnail */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                PAYMENT SCREENSHOT / RECEIPT IMAGE
              </label>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleScreenshotUpload}
                style={{ display: 'none' }}
              />

              {proofUrl ? (
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    maxHeight: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={proofUrl}
                    alt="Payment Proof"
                    style={{ width: '100%', maxHeight: '140px', objectFit: 'contain' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      display: 'flex',
                      gap: '6px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        border: 'none',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setProofUrl('')}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: 'rgba(239, 68, 68, 0.8)',
                        color: 'white',
                        border: 'none',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.02)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <Camera size={24} color="var(--accent-primary)" style={{ margin: '0 auto 6px' }} />
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Click to upload payment screenshot
                  </p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    PNG, JPG, WebP from GPay / PhonePe / Bank App
                  </span>
                </div>
              )}
            </div>

            {/* Note */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                CLIENT NOTES (OPTIONAL)
              </label>
              <input
                type="text"
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
                placeholder="e.g. Sent from HDFC account ending in 4102"
                style={{ width: '100%', fontSize: '0.82rem' }}
              />
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  fontSize: '0.8rem',
                  marginBottom: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{validationError}</span>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
              <button
                type="button"
                className="btn-success"
                onClick={() => handleFinish(true)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  fontSize: '0.88rem',
                  justifyContent: 'center',
                  opacity: !proofUrl ? 0.75 : 1,
                }}
              >
                <CheckCircle2 size={16} /> {!proofUrl ? 'Upload Proof to Approve & Release' : `Approve & Release Milestone ($${milestone.amount.toLocaleString()})`}
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  style={{ flex: 1, fontSize: '0.82rem', padding: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleFinish(false)}
                  style={{
                    flex: 1.3,
                    fontSize: '0.82rem',
                    padding: '8px',
                    justifyContent: 'center',
                    opacity: !proofUrl ? 0.75 : 1,
                  }}
                >
                  <FileCheck size={14} /> Send Proof Only
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. PAYMENT PROOF LIGHTBOX / VIEWER MODAL
// ==========================================
interface PaymentProofLightboxProps {
  milestone: Milestone;
  isFreelancer: boolean;
  onConfirmReceipt?: () => void;
  onClose: () => void;
}

export const PaymentProofLightbox: React.FC<PaymentProofLightboxProps> = ({
  milestone,
  isFreelancer,
  onConfirmReceipt,
  onClose,
}) => {
  const proof = milestone.paymentProof;
  const isConfirmed = proof?.status === 'confirmed' || milestone.paymentStatus === 'settled';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1150 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, #131722, #0d111a)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isConfirmed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                display: 'grid',
                placeItems: 'center',
                color: isConfirmed ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
              }}
            >
              {isConfirmed ? <CheckCircle2 size={20} /> : <Receipt size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Payment Proof & Receipt</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Milestone: <strong>{milestone.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            padding: '14px',
            borderRadius: '10px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>AMOUNT SETTLED</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>
              ${(proof?.amountPaid || milestone.amount).toLocaleString()}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>SETTLEMENT STATUS</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: isConfirmed ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
              }}
            >
              {isConfirmed ? 'VERIFIED & SETTLED ✅' : 'PROOF SUBMITTED 📸'}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>PAYMENT MODE</span>
            <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              {(proof?.paymentMode || 'UPI').toUpperCase()}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>UTR / REF NUMBER</span>
            <strong style={{ fontSize: '0.88rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
              {proof?.transactionId || 'UPI-REF-RECORDED'}
            </strong>
          </div>

          {proof?.note && (
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>CLIENT NOTE</span>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1' }}>{proof.note}</p>
            </div>
          )}
        </div>

        {/* Screenshot View */}
        {proof?.proofUrl && (
          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              PAYMENT RECEIPT SCREENSHOT
            </span>
            <div
              style={{
                borderRadius: '10px',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '340px',
              }}
            >
              <img
                src={proof.proofUrl}
                alt="Payment Receipt"
                style={{ width: '100%', maxHeight: '340px', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {isFreelancer && !isConfirmed && onConfirmReceipt && (
            <button
              type="button"
              className="btn-success"
              onClick={() => {
                onConfirmReceipt();
                onClose();
              }}
            >
              <CheckCircle2 size={16} /> Confirm Payment Received ✅
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
