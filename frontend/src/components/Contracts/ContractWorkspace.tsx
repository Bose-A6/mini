import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileCheck2,
  CheckCircle2,
  Send,
  MessageSquare,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Clock,
  Briefcase,
  Star,
  Award,
  Check,
  UploadCloud,
  QrCode,
  CreditCard,
  Receipt,
  Camera,
  LifeBuoy,
  Sparkles,
  XCircle,
  X,
} from 'lucide-react';
import type { Milestone } from '../../types';
import {
  FreelancerPaymentModal,
  ClientPaymentModal,
  PaymentProofLightbox,
} from './PaymentComponents';

export const ContractWorkspace: React.FC = () => {
  const {
    currentUser,
    contracts,
    messages,
    selectedContractId,
    setSelectedContractId,
    submitDeliverable,
    approveMilestoneAndReleaseEscrow,
    updateFreelancerPaymentDetails,
    submitMilestonePaymentProof,
    confirmMilestonePayment,
    acceptContractOffer,
    declineContractOffer,
    cancelContractOffer,
    requestRevision,
    markWorkHandoverComplete,
    completeContract,
    sendMessage,
    openSupportModal,
    openInvoiceModal,
    getCollaborationBetween,
    getFreelancerRating,
    setActiveView,
    addToast,
  } = useApp();

  const userContracts = (contracts || []).filter((c) => {
    if (!currentUser) return true;
    if (currentUser.role === 'admin') return true;
    return String(c.clientId).trim() === String(currentUser.id).trim() || String(c.freelancerId).trim() === String(currentUser.id).trim();
  });

  const contract = (contracts || []).find((c) => c.id === selectedContractId) || userContracts[0] || null;
  const [chatInput, setChatInput] = useState('');
  const [revisionModalMilestoneId, setRevisionModalMilestoneId] = useState<string | null>(null);
  const [revisionReason, setRevisionReason] = useState('');

  // Decline Offer Modal State
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReasonText, setDeclineReasonText] = useState('');

  // Payment modal states
  const [freelancerPaymentModalMilestone, setFreelancerPaymentModalMilestone] = useState<Milestone | null>(null);
  const [clientPaymentModalMilestone, setClientPaymentModalMilestone] = useState<Milestone | null>(null);
  const [proofLightboxMilestone, setProofLightboxMilestone] = useState<Milestone | null>(null);

  // Milestone deliverable submission modal (Freelancer)
  const [deliverableModalMilestoneId, setDeliverableModalMilestoneId] = useState<string | null>(null);
  const [deliverableTitle, setDeliverableTitle] = useState('');
  const [deliverableDesc, setDeliverableDesc] = useState('');
  const [deliverableLiveUrl, setDeliverableLiveUrl] = useState('');
  const [deliverableFileUrl, setDeliverableFileUrl] = useState('');

  // Handover modal state (Freelancer)
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');

  // Final Completion modal state (Client)
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('Outstanding engineering execution, seamless communication, and on-time milestone delivery!');
  const [isEditingRating, setIsEditingRating] = useState(false);

  useEffect(() => {
    if (contract) {
      if (contract.clientRating) {
        setRating(Number(contract.clientRating) || 5);
      }
      if (contract.clientReview) {
        setReviewText(contract.clientReview);
      }
    }
  }, [contract]);

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const prevMsgCountRef = useRef<number>(0);

  const contractMessages = (messages || []).filter((m) => contract && m.orderId === contract.id);

  // Auto-scroll ONLY the internal chat container, never jumping the window/page viewport
  useEffect(() => {
    if (chatBoxRef.current && contractMessages.length !== prevMsgCountRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      prevMsgCountRef.current = contractMessages.length;
    }
  }, [contractMessages.length]);

  if (!contract) {
    return (
      <div className="app-container">
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FileCheck2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No Active Contracts in Escrow</h3>
          <p style={{ maxWidth: '420px', margin: '8px auto 20px' }}>
            When a client accepts a freelancer proposal and funds escrow, the active project workspace will open here.
          </p>
          <button className="btn-primary" onClick={() => setActiveView('gigs')}>
            <Briefcase size={16} /> Explore Gigs & Proposals
          </button>
        </div>
      </div>
    );
  }

  const isClient = currentUser?.role === 'client' || (Boolean(currentUser) && currentUser?.id === contract.clientId);
  const isFreelancer = currentUser?.role === 'freelancer' || (Boolean(currentUser) && currentUser?.id === contract.freelancerId && !isClient);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(contract.id, chatInput);
    setChatInput('');
  };

  const handleApproveMilestone = (milestoneId: string) => {
    approveMilestoneAndReleaseEscrow(contract.id, milestoneId);
    
    // If this milestone approval makes all milestone escrows approved, prompt the client to rate
    const remainingPending = (contract.milestones || []).filter(
      (m) => m.id !== milestoneId && m.status !== 'approved'
    );
    if (remainingPending.length === 0) {
      if (isClient) {
        addToast(
          'success',
          'All Escrows Approved! 🎉',
          'Please rate the specialist. Your score directly updates their platform arithmetic average.'
        );
        setShowCompleteModal(true);
      }
    }
  };

  const handleRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalMilestoneId || !revisionReason.trim()) return;
    requestRevision(contract.id, revisionModalMilestoneId, revisionReason);
    setRevisionModalMilestoneId(null);
    setRevisionReason('');
  };

  const handleSubmitMilestoneDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverableModalMilestoneId || !deliverableTitle.trim() || !deliverableDesc.trim()) {
      addToast('warning', 'Missing Fields', 'Please enter deliverable title and description.');
      return;
    }

    submitDeliverable(
      contract.id,
      deliverableModalMilestoneId,
      deliverableTitle,
      deliverableDesc,
      deliverableFileUrl ? [deliverableFileUrl] : [],
      deliverableLiveUrl || undefined
    );

    setDeliverableModalMilestoneId(null);
    setDeliverableTitle('');
    setDeliverableDesc('');
    setDeliverableLiveUrl('');
    setDeliverableFileUrl('');
  };

  const handleFinalHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverNotes.trim()) return;
    markWorkHandoverComplete(contract.id, handoverNotes);
    setShowHandoverModal(false);
    setHandoverNotes('');
  };

  const handleCompleteContract = (e: React.FormEvent) => {
    e.preventDefault();
    completeContract(contract.id, rating, reviewText);
    setShowCompleteModal(false);
    setIsEditingRating(false);
  };

  const isContractCompleted = contract.status === 'completed';
  const totalMilestonesCount = (contract.milestones || []).length;
  const approvedMilestonesCount = isContractCompleted
    ? totalMilestonesCount
    : (contract.milestones || []).filter((m) => m.status === 'approved').length;
  const allMilestonesApproved = totalMilestonesCount > 0 && approvedMilestonesCount === totalMilestonesCount;
  const approvedTotal = isContractCompleted
    ? contract.amount
    : (contract.milestones || [])
        .filter((m) => m.status === 'approved')
        .reduce((sum, m) => sum + (m.amount || 0), 0);

  const totalAmount = contract.amount || 1;

  // Freelancer overall rating stats and live average calculation
  const freelancerRatingStats = getFreelancerRating(contract.freelancerId);
  const otherCompletedContracts = (contracts || []).filter(
    (c) =>
      String(c.freelancerId).trim() === String(contract.freelancerId).trim() &&
      c.id !== contract.id &&
      c.status === 'completed' &&
      typeof c.clientRating === 'number' &&
      c.clientRating > 0
  );
  const otherRatingsSum = otherCompletedContracts.reduce((acc, c) => acc + (c.clientRating || 0), 0);
  const projectedAvgRating = Math.round(((otherRatingsSum + rating) / (otherCompletedContracts.length + 1)) * 10) / 10;

  const ratingLabels: Record<number, string> = {
    5: '5.0 ★ Exceptional Quality, Speed & Collaboration',
    4: '4.0 ★ Very Good Delivery & Communication',
    3: '3.0 ★ Satisfactory Delivery (Met Baseline Requirements)',
    2: '2.0 ★ Below Expectations (Required Multiple Fixes)',
    1: '1.0 ★ Unsatisfactory Quality',
  };

  return (
    <div className="app-container">
      {/* Workspace Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="persona-badge badge-client">ESCROW CONTRACT: {contract.id}</span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                background:
                  contract.status === 'completed'
                    ? 'rgba(16, 185, 129, 0.2)'
                    : contract.status === 'delivered'
                    ? 'rgba(6, 182, 212, 0.2)'
                    : contract.status === 'pending_acceptance'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(99, 102, 241, 0.2)',
                color:
                  contract.status === 'completed'
                    ? 'var(--accent-emerald)'
                    : contract.status === 'delivered'
                    ? 'var(--accent-cyan)'
                    : contract.status === 'pending_acceptance'
                    ? 'var(--accent-amber)'
                    : '#c7d2fe',
                fontWeight: 800,
                border:
                  contract.status === 'completed'
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : contract.status === 'delivered'
                    ? '1px solid rgba(6, 182, 212, 0.4)'
                    : contract.status === 'pending_acceptance'
                    ? '1px solid rgba(245, 158, 11, 0.4)'
                    : '1px solid rgba(99, 102, 241, 0.4)',
              }}
            >
              STATUS: {contract.status === 'pending_acceptance' ? 'PENDING ACCEPTANCE' : contract.status.toUpperCase()}
            </span>
          </div>
          <h2>{contract.gigTitle}</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Client: <strong>{contract.clientName}</strong> • Freelancer: <strong>{contract.freelancerName}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {contracts.length > 1 && (
            <select
              value={contract.id}
              onChange={(e) => setSelectedContractId(e.target.value)}
              style={{ padding: '10px 14px', fontSize: '0.85rem' }}
            >
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.gigTitle.slice(0, 32)}... (${c.amount}) [{c.status === 'pending_acceptance' ? 'OFFER PENDING' : c.status.toUpperCase()}]
                </option>
              ))}
            </select>
          )}

          {/* Official Tax Invoice & Receipt Modal button */}
          <button
            className="btn-secondary"
            onClick={() => openInvoiceModal(contract.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#c7d2fe',
              background: 'rgba(99, 102, 241, 0.1)',
            }}
            title="View, print, and export official tax invoice & escrow settlement receipt"
          >
            <Receipt size={16} color="var(--accent-cyan)" />
            <span>Invoice & Receipt</span>
          </button>

          {/* Quick Support / Mediation button */}
          <button
            className="btn-secondary"
            onClick={() => openSupportModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--accent-amber)',
            }}
            title="Raise a query or dispute regarding this contract to Admin Support"
          >
            <LifeBuoy size={16} />
            <span>Mediation & Doubts</span>
          </button>

          {/* Quick Handover button for Freelancer */}
          {contract.status !== 'completed' && contract.status !== 'pending_acceptance' && isFreelancer && (
            <button className="btn-primary" onClick={() => setShowHandoverModal(true)}>
              <Award size={16} /> Submit Final Handover
            </button>
          )}

          {/* Complete Contract button for Client - strictly locked until all individual milestone escrows are approved */}
          {contract.status !== 'completed' && contract.status !== 'pending_acceptance' && isClient && (
            <button
              className={allMilestonesApproved ? "btn-success" : "btn-secondary"}
              onClick={() => {
                if (allMilestonesApproved) {
                  setShowCompleteModal(true);
                } else {
                  addToast(
                    'warning',
                    'Escrows Incomplete',
                    `Please approve and release escrow for all ${totalMilestonesCount} milestones individually before final sign-off (${approvedMilestonesCount}/${totalMilestonesCount} escrows released).`
                  );
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: allMilestonesApproved ? 1 : 0.7,
                cursor: allMilestonesApproved ? 'pointer' : 'not-allowed',
                border: allMilestonesApproved ? 'none' : '1px solid rgba(245, 158, 11, 0.4)',
                background: allMilestonesApproved ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(245, 158, 11, 0.1)',
                color: allMilestonesApproved ? '#ffffff' : 'var(--accent-amber)',
              }}
              title={
                allMilestonesApproved
                  ? "All milestone escrows released! Click to give final review & close contract."
                  : `Locked: ${approvedMilestonesCount}/${totalMilestonesCount} escrows released. Please release all milestone escrows individually.`
              }
            >
              <CheckCircle2 size={16} color={allMilestonesApproved ? '#ffffff' : 'var(--accent-amber)'} />
              <span>Accept Work & Complete Contract</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 7px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  background: allMilestonesApproved ? 'rgba(255,255,255,0.25)' : 'rgba(245, 158, 11, 0.25)',
                  color: allMilestonesApproved ? '#ffffff' : 'var(--accent-amber)',
                }}
              >
                {approvedMilestonesCount}/{totalMilestonesCount} Escrows
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Repeat Collaboration Domain Banner if they worked together */}
      {(() => {
        const repeatCollab = getCollaborationBetween(contract.clientId, contract.freelancerId, contract.categoryName);
        if (!repeatCollab) return null;
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.12))',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              marginBottom: '20px',
              fontSize: '0.84rem',
              color: 'var(--text-primary)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.25)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--accent-emerald)',
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <strong style={{ color: 'var(--accent-emerald)', display: 'block' }}>
                  🌟 Trusted Domain Collaboration: {repeatCollab.domain}
                </strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  {contract.clientName} and {contract.freelancerName} have successfully completed {repeatCollab.completedContractsCount} previous project(s) (${repeatCollab.totalAmount.toLocaleString()} total settled).
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.74rem',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                }}
              >
                100% On-Time Delivery Track Record
              </span>
            </div>
          </div>
        );
      })()}

      {/* Mutual Agreement / Pending Acceptance Hero Banner */}
      {contract.status === 'pending_acceptance' && (
        <div
          className="glass-panel"
          style={{
            padding: '24px 28px',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(16, 185, 129, 0.1))',
            border: '1px solid rgba(99, 102, 241, 0.45)',
            borderRadius: '16px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: 'var(--accent-amber)',
                    fontWeight: 800,
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={13} /> PENDING MUTUAL ACCEPTANCE
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Two-Way Consent Required
                </span>
              </div>

              <h3 style={{ fontSize: '1.35rem', margin: '0 0 8px', color: 'var(--text-primary)' }}>
                {isFreelancer ? `Direct Work Offer from ${contract.clientName}` : `Waiting for ${contract.freelancerName} to Accept`}
              </h3>

              <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {isFreelancer ? (
                  <>
                    The client has assigned this contract to you with <strong>${contract.amount.toLocaleString()} USD</strong> deposited into the platform escrow vault. Please review the deliverable milestones and deadline below before agreeing to begin work.
                  </>
                ) : (
                  <>
                    Your direct contract offer and <strong>${contract.amount.toLocaleString()} USD</strong> escrow funding have been sent to <strong>{contract.freelancerName}</strong>. Milestones will activate as soon as the specialist accepts the terms.
                  </>
                )}
              </p>

              {(contract.invitationNote || contract.handoverNotes) && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '14px',
                    fontSize: '0.85rem',
                    color: '#e2e8f0',
                  }}
                >
                  <strong style={{ color: 'var(--accent-cyan)', display: 'block', marginBottom: '4px' }}>
                    Client's Collaboration Brief & Scope:
                  </strong>
                  {contract.invitationNote || contract.handoverNotes}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>🎯 Domain: <strong style={{ color: '#cbd5e1' }}>{contract.categoryName || 'Engineering'}</strong></span>
                <span>📅 Target Delivery: <strong style={{ color: '#cbd5e1' }}>{contract.deadline}</strong></span>
                <span>🔒 Escrow Status: <strong style={{ color: 'var(--accent-emerald)' }}>100% Vault Funded (${contract.amount.toLocaleString()})</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
              {isFreelancer && (
                <>
                  <button
                    className="btn-primary"
                    onClick={() => acceptContractOffer(contract.id)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      padding: '12px 20px',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle2 size={18} /> Accept & Start Work
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setShowDeclineModal(true)}
                    style={{
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      color: 'var(--accent-rose)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <XCircle size={16} /> Decline Offer
                  </button>
                </>
              )}

              {isClient && (
                <button
                  className="btn-secondary"
                  onClick={() => cancelContractOffer(contract.id)}
                  style={{
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: 'var(--accent-rose)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    padding: '10px 16px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <XCircle size={16} /> Withdraw Offer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Banner if Completed */}
      {contract.status === 'completed' && (
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.08))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.25)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--accent-emerald)',
              }}
            >
              <Award size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-emerald)', marginBottom: '4px' }}>
                🎉 Contract Successfully Completed & Escrow Settled
              </h3>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
                All deliverables were signed off by the client, and 100% of the funds (${contract.amount.toLocaleString()}) have been released.
              </p>
              {contract.clientReview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', color: 'var(--accent-amber)' }}>
                    {[...Array(contract.clientRating || 5)].map((_, i) => (
                      <Star key={i} size={14} fill="var(--accent-amber)" />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    "{contract.clientReview}"
                  </span>
                </div>
              )}
            </div>
          </div>

          <span
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-emerald)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={16} /> Final Sign-Off Complete
          </span>
        </div>
      )}

      {/* Two Column Layout: Left (Milestones) / Right (Live Chat) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)', gap: '24px' }}>
        
        {/* LEFT: Milestone Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Escrow Status Banner */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ESCROW VAULT STATUS</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <ShieldCheck size={20} color="var(--accent-emerald)" />
                  <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                    {contract.status === 'completed' ? '100% Escrow Disbursed' : '100% Vault Funded'}
                  </strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PAYOUT PROGRESS</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--accent-emerald)', display: 'block', marginTop: '4px' }}>
                  ${approvedTotal.toLocaleString()} / ${contract.amount.toLocaleString()}
                </strong>
              </div>
            </div>

            <div style={{ width: '100%', height: '10px', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(approvedTotal / totalAmount) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-emerald))',
                  borderRadius: 'inherit',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          {/* Rating & Review Card for Client and Freelancer once all milestone escrows are approved */}
          {allMilestonesApproved && (
            <div
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '16px',
                background: isContractCompleted
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.08))'
                  : 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(16, 185, 129, 0.15))',
                border: isContractCompleted
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid rgba(99, 102, 241, 0.5)',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isContractCompleted ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.25)',
                      display: 'grid',
                      placeItems: 'center',
                      color: isContractCompleted ? 'var(--accent-emerald)' : '#c7d2fe',
                    }}
                  >
                    <Star size={20} fill={isContractCompleted ? 'var(--accent-emerald)' : '#c7d2fe'} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)' }}>
                      {isClient
                        ? (isContractCompleted ? 'Client Rating & Official Testimonial' : 'Rate Specialist & Complete Sign-off')
                        : 'Official Client Rating & Feedback'}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {isContractCompleted
                        ? 'Recorded on escrow settlement & public specialist profile'
                        : `All ${totalMilestonesCount} milestone escrows approved • Provide final rating to conclude contract`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: isContractCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: isContractCompleted ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                      fontWeight: 700,
                      border: isContractCompleted ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                    }}
                  >
                    {isContractCompleted ? 'RATING SUBMITTED ✅' : `ALL ${totalMilestonesCount} ESCROWS APPROVED 🌟`}
                  </span>
                </div>
              </div>

              {/* Specialist Platform Rating Context Banner */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  fontSize: '0.84rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--accent-amber)" />
                  <span style={{ color: '#cbd5e1' }}>
                    Freelancer Overall Rating: <strong style={{ color: 'var(--accent-amber)' }}>★ {freelancerRatingStats.averageRating} / 5.0</strong> ({freelancerRatingStats.reviewsCount} {freelancerRatingStats.reviewsCount === 1 ? 'client review' : 'client reviews'})
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  📈 Calculated as the true arithmetic average of all client ratings
                </div>
              </div>

              {/* Client interactive rating form or completed display */}
              {isClient ? (
                <div>
                  {isContractCompleted && !isEditingRating ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '4px', color: 'var(--accent-amber)' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={22} fill={s <= (contract.clientRating || 5) ? 'var(--accent-amber)' : 'none'} />
                          ))}
                        </div>
                        <strong style={{ fontSize: '1rem', color: 'var(--accent-amber)' }}>
                          {ratingLabels[contract.clientRating || 5] || `${contract.clientRating || 5}.0 ★`}
                        </strong>
                      </div>

                      <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.5 }}>
                          "{contract.clientReview || reviewText}"
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setIsEditingRating(true)}
                          style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Star size={14} /> Update Rating or Review
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      completeContract(contract.id, rating, reviewText);
                      setIsEditingRating(false);
                      setShowCompleteModal(false);
                    }}>
                      {/* Interactive Star Picker */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                          Select Rating (1 to 5 Stars):
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  color: (hoverRating || rating) >= star ? 'var(--accent-amber)' : 'rgba(255,255,255,0.2)',
                                  transition: 'transform 0.15s ease',
                                  transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                                }}
                                title={`${star} Star${star > 1 ? 's' : ''}`}
                              >
                                <Star
                                  size={30}
                                  fill={(hoverRating || rating) >= star ? 'var(--accent-amber)' : 'none'}
                                />
                              </button>
                            ))}
                          </div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-amber)', marginLeft: '6px' }}>
                            {ratingLabels[hoverRating || rating]}
                          </span>
                        </div>
                      </div>

                      {/* Review Textarea */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                          Client Review & Testimonial:
                        </label>
                        <textarea
                          rows={3}
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share feedback on deliverable quality, technical velocity, communication..."
                          style={{ width: '100%', resize: 'vertical', fontSize: '0.88rem' }}
                          required
                        />
                      </div>

                      {/* Live calculation impact preview */}
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          marginBottom: '16px',
                          fontSize: '0.82rem',
                          color: '#a7f3d0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <CheckCircle2 size={16} color="var(--accent-emerald)" />
                        <span>
                          Live Impact: Submitting <strong>{rating}★</strong> will update {contract.freelancerName}'s overall platform average to <strong style={{ color: '#ffffff' }}>★ {projectedAvgRating}</strong> across {otherCompletedContracts.length + 1} completed client projects.
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        {isEditingRating && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setIsEditingRating(false)}
                            style={{ fontSize: '0.85rem' }}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          className="btn-success"
                          style={{
                            fontSize: '0.88rem',
                            padding: '10px 20px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircle2 size={18} />
                          <span>{isContractCompleted ? 'Save Updated Rating & Review' : 'Submit Rating & Complete Contract'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Freelancer View of Rating */
                <div>
                  {contract.clientRating ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '3px', color: 'var(--accent-amber)' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={20} fill={s <= (contract.clientRating || 5) ? 'var(--accent-amber)' : 'none'} />
                          ))}
                        </div>
                        <strong style={{ color: 'var(--accent-amber)', fontSize: '0.95rem' }}>
                          {ratingLabels[contract.clientRating || 5]}
                        </strong>
                      </div>
                      <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0', fontStyle: 'italic' }}>
                          "{contract.clientReview || 'Outstanding engineering execution and on-time milestone delivery!'}"
                        </p>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} />
                        <span>Rating added to your specialist profile! Your overall average is now <strong>★ {freelancerRatingStats.averageRating}</strong> ({freelancerRatingStats.reviewsCount} reviews).</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.85rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} />
                      <span>All milestone escrows are approved! Waiting for {contract.clientName} to submit their official rating & testimonial.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Milestones List */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck2 size={18} color="var(--accent-cyan)" />
                Contract Milestones & Deliverables
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {approvedMilestonesCount} of {(contract.milestones || []).length} Milestones Approved
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(contract.milestones || []).map((m, idx) => {
                const isApproved = m.status === 'approved' || isContractCompleted;
                const isSubmitted = m.status === 'submitted' && !isContractCompleted;
                const displayStatus = isApproved ? 'APPROVED' : (m.status || 'PENDING').toUpperCase();
                const hasPaymentProof = Boolean(m.paymentProof?.proofUrl || m.paymentStatus === 'proof_submitted');
                const hasPaymentDetails = Boolean(m.paymentDetails?.upiId || contract.upiId);

                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '18px',
                      borderRadius: 'var(--radius-md)',
                      background: isApproved ? 'rgba(16, 185, 129, 0.06)' : isSubmitted ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isApproved ? '1px solid rgba(16, 185, 129, 0.3)' : isSubmitted ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isApproved ? 'var(--accent-emerald)' : isSubmitted ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          {isApproved ? <CheckCircle2 size={16} /> : idx + 1}
                        </span>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{m.title}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                            Due {m.deadline || 'Soon'} • Status: {displayStatus}
                          </span>
                        </div>
                      </div>

                      <strong style={{ fontSize: '1.15rem', color: 'var(--accent-emerald)' }}>
                        ${m.amount.toLocaleString()}
                      </strong>
                    </div>

                    {/* Deliverable Notes */}
                    {m.deliverableNote && (
                      <div style={{ padding: '12px', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', marginTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                          <Clock size={12} />
                          <span>Submitted Deliverable Notes:</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                          {m.deliverableNote}
                        </p>
                        {m.deliverableFiles && m.deliverableFiles.length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {m.deliverableFiles.map((file, fIdx) => (
                              <a
                                key={fIdx}
                                href={file}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.75rem',
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  color: 'var(--accent-cyan)',
                                }}
                              >
                                <ExternalLink size={12} /> Live Link / Archive
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payment & Payout Details Strip */}
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: isApproved
                          ? 'rgba(16, 185, 129, 0.08)'
                          : hasPaymentProof
                          ? 'rgba(6, 182, 212, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CreditCard size={15} color={isApproved ? 'var(--accent-emerald)' : 'var(--accent-cyan)'} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            UPI & Payout:
                          </span>
                        </div>

                        {hasPaymentDetails ? (
                          <span style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <code>{m.paymentDetails?.upiId || contract.upiId || 'baca@oksbi'}</code>
                            {(m.paymentDetails?.phoneNumber || contract.phoneNumber) && (
                              <span style={{ color: 'var(--text-muted)' }}>• {m.paymentDetails?.phoneNumber || contract.phoneNumber}</span>
                            )}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No UPI ID provided yet
                          </span>
                        )}

                        {hasPaymentProof && (
                          <button
                            type="button"
                            onClick={() => setProofLightboxMilestone(m)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(6, 182, 212, 0.2)',
                              color: 'var(--accent-cyan)',
                              border: '1px solid rgba(6, 182, 212, 0.4)',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            <Camera size={12} /> View Proof Screenshot
                          </button>
                        )}
                      </div>

                      {/* Payment Quick Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isFreelancer && contract.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => setFreelancerPaymentModalMilestone(m)}
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: '#c7d2fe',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <QrCode size={12} /> {hasPaymentDetails ? 'Edit UPI/QR' : 'Share UPI & QR'}
                          </button>
                        )}

                        {isClient && contract.status !== 'completed' && !isApproved && (
                          isSubmitted ? (
                            <button
                              type="button"
                              onClick={() => setClientPaymentModalMilestone(m)}
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#a7f3d0',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <QrCode size={12} /> Pay via UPI & Proof
                            </button>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-muted)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Escrow release unlocks only after the freelancer submits deliverable work for this milestone."
                            >
                              🔒 Awaiting Deliverable Submission
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Actions for Freelancer on Active In-Progress Milestone */}
                    {m.status === 'in_progress' && isFreelancer && contract.status !== 'completed' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                          onClick={() => {
                            setDeliverableModalMilestoneId(m.id);
                            setDeliverableTitle(`Deliverable for: ${m.title}`);
                            setDeliverableDesc('All requirements implemented and verified. Ready for milestone sign-off.');
                          }}
                        >
                          <UploadCloud size={14} /> Submit Milestone Deliverable
                        </button>
                      </div>
                    )}

                    {/* Indicator for Client on In-Progress Milestone (Awaiting Freelancer Deliverable) */}
                    {m.status === 'in_progress' && isClient && !isFreelancer && contract.status !== 'completed' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(245, 158, 11, 0.04)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.18)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
                          <Clock size={14} />
                          <span>Specialist is currently developing deliverables for Phase {idx + 1}.</span>
                        </div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          🔒 Escrow Release Unlocks on Delivery
                        </span>
                      </div>
                    )}

                    {/* Indicator for Freelancer on Pending Milestone */}
                    {m.status === 'pending' && isFreelancer && contract.status !== 'completed' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          🔒 Unlocks after previous milestone approval
                        </span>
                      </div>
                    )}

                    {/* Indicator for Client on Pending Milestone */}
                    {m.status === 'pending' && isClient && !isFreelancer && contract.status !== 'completed' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          🔒 Phase {idx + 1} Locked • Unlocks sequentially after previous milestone approval
                        </span>
                      </div>
                    )}

                    {/* Indicator for Freelancer when Milestone is Submitted */}
                    {m.status === 'submitted' && isFreelancer && !isClient && contract.status !== 'completed' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          ⏳ Deliverable Submitted • Awaiting Client Review & Escrow Release
                        </span>

                        {hasPaymentProof && m.paymentStatus !== 'settled' && (
                          <button
                            type="button"
                            className="btn-success"
                            style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                            onClick={() => confirmMilestonePayment(contract.id, m.id)}
                          >
                            <CheckCircle2 size={13} /> Confirm Payment Received ✅
                          </button>
                        )}
                      </div>
                    )}

                    {/* Actions for Client on Submitted Milestone */}
                    {m.status === 'submitted' && isClient && contract.status !== 'completed' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => setRevisionModalMilestoneId(m.id)}
                        >
                          <RotateCcw size={14} /> Request Revision
                        </button>

                        {!hasPaymentProof ? (
                          <button
                            className="btn-success"
                            style={{
                              padding: '6px 16px',
                              fontSize: '0.82rem',
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                            }}
                            onClick={() => setClientPaymentModalMilestone(m)}
                          >
                            <QrCode size={14} /> Attach Payment Proof & Release Escrow (${m.amount.toLocaleString()})
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => setClientPaymentModalMilestone(m)}
                            >
                              <Camera size={14} /> Update Proof
                            </button>

                            <button
                              className="btn-success"
                              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                              onClick={() => handleApproveMilestone(m.id)}
                            >
                              <CheckCircle2 size={14} /> Approve & Release Escrow (${m.amount.toLocaleString()})
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Approved Milestone Tag */}
                    {isApproved && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                        {hasPaymentProof && (
                          <button
                            type="button"
                            onClick={() => setProofLightboxMilestone(m)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--accent-cyan)',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Receipt size={14} /> View Receipt
                          </button>
                        )}
                        <span style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Escrow Released & Settled (${m.amount.toLocaleString()})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Real-Time Live Chat */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '620px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--accent-primary)" />
              <strong style={{ fontSize: '0.95rem' }}>Contract Collaboration Feed</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-emerald)' }} /> Live Channel
            </span>
          </div>

          <div ref={chatBoxRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }}>
            {contractMessages.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '0.85rem' }}>No messages yet. Send a message to start real-time collaboration.</p>
              </div>
            ) : (
              contractMessages.map((msg) => {
                const isMine = currentUser && msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{msg.senderName}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      style={{
                        maxWidth: '85%',
                        padding: '10px 14px',
                        borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        background: isMine ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.06)',
                        color: isMine ? 'white' : 'var(--text-primary)',
                        fontSize: '0.88rem',
                        lineHeight: 1.45,
                        border: isMine ? 'none' : '1px solid var(--border-subtle)',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {msg.content}

                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {msg.attachments.map((att, attIdx) => (
                            <div
                              key={attIdx}
                              style={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                maxWidth: '240px',
                                background: 'rgba(0, 0, 0, 0.4)',
                              }}
                            >
                              <img
                                src={att}
                                alt="Attachment"
                                style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', display: 'block' }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <input
              type="text"
              placeholder="Send message to collaborator..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', fontSize: '0.88rem' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '0 16px' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Freelancer Payment Details (UPI/QR) Modal */}
      {freelancerPaymentModalMilestone && (
        <FreelancerPaymentModal
          milestone={freelancerPaymentModalMilestone}
          contractId={contract.id}
          contractFreelancerName={contract.freelancerName}
          initialDetails={freelancerPaymentModalMilestone.paymentDetails || (contract.upiId ? { upiId: contract.upiId, phoneNumber: contract.phoneNumber, qrCodeUrl: contract.qrCodeUrl } : undefined)}
          onSave={(details) => {
            updateFreelancerPaymentDetails(contract.id, freelancerPaymentModalMilestone.id, details);
          }}
          onClose={() => setFreelancerPaymentModalMilestone(null)}
        />
      )}

      {/* Client UPI Payment & Proof Upload Modal */}
      {clientPaymentModalMilestone && (
        <ClientPaymentModal
          milestone={clientPaymentModalMilestone}
          contractId={contract.id}
          freelancerName={contract.freelancerName}
          freelancerAvatar={contract.freelancerAvatar}
          initialDetails={clientPaymentModalMilestone.paymentDetails || (contract.upiId ? { upiId: contract.upiId, phoneNumber: contract.phoneNumber, qrCodeUrl: contract.qrCodeUrl } : undefined)}
          onSubmitProof={(proof, andApprove) => {
            if (andApprove) {
              approveMilestoneAndReleaseEscrow(contract.id, clientPaymentModalMilestone.id, proof);
            } else {
              submitMilestonePaymentProof(contract.id, clientPaymentModalMilestone.id, proof);
            }
          }}
          onClose={() => setClientPaymentModalMilestone(null)}
        />
      )}

      {/* Payment Proof Lightbox Modal */}
      {proofLightboxMilestone && (
        <PaymentProofLightbox
          milestone={proofLightboxMilestone}
          isFreelancer={isFreelancer}
          onConfirmReceipt={() => {
            confirmMilestonePayment(contract.id, proofLightboxMilestone.id);
          }}
          onClose={() => setProofLightboxMilestone(null)}
        />
      )}

      {/* Deliverable Submission Modal (Freelancer) */}
      {deliverableModalMilestoneId && (
        <div className="modal-overlay" onClick={() => setDeliverableModalMilestoneId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <UploadCloud size={24} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.25rem' }}>Submit Milestone Deliverable</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Provide the deliverables, live links, and testing notes for the client to review and approve escrow payout.
            </p>

            <form onSubmit={handleSubmitMilestoneDeliverable}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  DELIVERABLE TITLE
                </label>
                <input
                  type="text"
                  value={deliverableTitle}
                  onChange={(e) => setDeliverableTitle(e.target.value)}
                  placeholder="e.g. Next.js 15 Frontend & Supabase Vector Pipeline"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  DESCRIPTION & VERIFICATION NOTES
                </label>
                <textarea
                  rows={4}
                  value={deliverableDesc}
                  onChange={(e) => setDeliverableDesc(e.target.value)}
                  placeholder="Summarize what was built, key features implemented, and how to test..."
                  style={{ width: '100%', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  LIVE PREVIEW / STAGING URL (OPTIONAL)
                </label>
                <input
                  type="url"
                  value={deliverableLiveUrl}
                  onChange={(e) => setDeliverableLiveUrl(e.target.value)}
                  placeholder="https://preview.vercel.app or https://staging.mysaas.com"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  GITHUB REPO / ZIP ARCHIVE URL (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={deliverableFileUrl}
                  onChange={(e) => setDeliverableFileUrl(e.target.value)}
                  placeholder="https://github.com/org/repo or https://dropbox.com/s/deliverables.zip"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setDeliverableModalMilestoneId(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <UploadCloud size={16} /> Submit for Client Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Request Modal */}
      {revisionModalMilestoneId && (
        <div className="modal-overlay" onClick={() => setRevisionModalMilestoneId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Request Milestone Revision</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Provide clear feedback on what needs adjustments before you release escrow funds.
            </p>

            <form onSubmit={handleRequestRevision}>
              <textarea
                rows={5}
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="e.g. Please add unit tests and fix the mobile modal..."
                style={{ width: '100%', resize: 'vertical', marginBottom: '16px' }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setRevisionModalMilestoneId(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Submit Revision Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Final Handover Modal (Freelancer) */}
      {showHandoverModal && (
        <div className="modal-overlay" onClick={() => setShowHandoverModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Award size={24} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '1.3rem' }}>Submit Final Project Handover</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Notify the client that all deliverables, source code, and documentation have been finalized. The client will be prompted to approve the final sign-off and rate the project.
            </p>

            <form onSubmit={handleFinalHandover}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  FINAL HANDOVER NOTES & ASSET LOCATIONS
                </label>
                <textarea
                  rows={6}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="e.g. All 3 milestone deliverables are tested and deployed. Production credentials and GitHub repository transferred to your team."
                  style={{ width: '100%', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowHandoverModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <Award size={16} /> Submit Handover for Sign-off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Contract & Review Modal (Client) */}
      {showCompleteModal && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <CheckCircle2 size={24} color={allMilestonesApproved ? "var(--accent-emerald)" : "var(--accent-amber)"} />
              <h3 style={{ fontSize: '1.3rem' }}>Final Sign-off & Complete Contract</h3>
            </div>

            {/* Milestones Verification Checklist */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Milestone Escrow Status ({approvedMilestonesCount}/{totalMilestonesCount} Settled)
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: allMilestonesApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: allMilestonesApproved ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                    fontWeight: 700,
                  }}
                >
                  {allMilestonesApproved ? 'ALL ESCROWS RELEASED ✅' : `${totalMilestonesCount - approvedMilestonesCount} ESCROW(S) PENDING ⏳`}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(contract.milestones || []).map((m, idx) => {
                  const isMApproved = m.status === 'approved';
                  return (
                    <div
                      key={m.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: isMApproved ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        border: isMApproved ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.3)',
                        fontSize: '0.84rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isMApproved ? (
                          <CheckCircle2 size={16} color="var(--accent-emerald)" />
                        ) : (
                          <Clock size={16} color="var(--accent-amber)" />
                        )}
                        <span style={{ color: isMApproved ? '#e2e8f0' : 'var(--text-secondary)' }}>
                          Phase {idx + 1}: {m.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: isMApproved ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                          ${m.amount.toLocaleString()}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isMApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: isMApproved ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                            fontWeight: 600,
                          }}
                        >
                          {isMApproved ? 'Approved & Paid' : (m.status || 'Pending').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!allMilestonesApproved && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '0.82rem',
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <XCircle size={16} color="var(--accent-rose)" />
                  <span>
                    Each milestone escrow must be submitted and approved individually in the workspace before final sign-off.
                  </span>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Confirming completion will release final escrow, finalize blockchain records, and record your official rating for <strong>{contract.freelancerName}</strong>.
            </p>

            {/* Freelancer overall average preview */}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                marginBottom: '18px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="var(--accent-amber)" />
                <span style={{ color: '#cbd5e1' }}>
                  Current Public Average: <strong style={{ color: 'var(--accent-amber)' }}>★ {freelancerRatingStats.averageRating}</strong> ({freelancerRatingStats.reviewsCount} reviews)
                </span>
              </div>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                ➔ With this rating: ★ {projectedAvgRating}
              </span>
            </div>

            <form onSubmit={handleCompleteContract}>
              {/* Star Rating */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    FREELANCER PERFORMANCE RATING
                  </label>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                    {ratingLabels[hoverRating || rating]}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: (hoverRating || rating) >= star ? 'var(--accent-amber)' : 'rgba(255,255,255,0.2)',
                        transition: 'transform 0.15s ease',
                        transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                      }}
                      title={`${star} Star${star > 1 ? 's' : ''}`}
                    >
                      <Star size={30} fill={(hoverRating || rating) >= star ? 'var(--accent-amber)' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  PUBLIC REVIEW & RECOMMENDATION
                </label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share feedback on code quality, speed, communication..."
                  style={{ width: '100%', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCompleteModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-success"
                  disabled={!allMilestonesApproved}
                  style={{
                    opacity: allMilestonesApproved ? 1 : 0.5,
                    cursor: allMilestonesApproved ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {allMilestonesApproved
                      ? 'Sign Off & Complete Contract'
                      : `Sign Off Locked (${approvedMilestonesCount}/${totalMilestonesCount} Escrows)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decline Offer Modal (Freelancer) */}
      {showDeclineModal && (
        <div className="modal-overlay" onClick={() => setShowDeclineModal(false)} style={{ zIndex: 1200 }}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '480px',
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 30px rgba(239, 68, 68, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <XCircle size={22} color="var(--accent-rose)" />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Decline Contract Offer</h3>
              </div>
              <button
                onClick={() => setShowDeclineModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Declining will cancel this contract invitation and immediately refund the vaulted escrow of <strong>${contract.amount.toLocaleString()} USD</strong> to <strong>{contract.clientName}</strong>.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                declineContractOffer(contract.id, declineReasonText.trim() || undefined);
                setShowDeclineModal(false);
                setDeclineReasonText('');
              }}
            >
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  REASON FOR DECLINING (OPTIONAL)
                </label>
                <textarea
                  rows={3}
                  value={declineReasonText}
                  onChange={(e) => setDeclineReasonText(e.target.value)}
                  placeholder="e.g. Current capacity is full, or milestone budget requires adjustment..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowDeclineModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
                >
                  Confirm & Decline Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
