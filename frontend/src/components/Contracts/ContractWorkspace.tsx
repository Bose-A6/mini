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
} from 'lucide-react';

export const ContractWorkspace: React.FC = () => {
  const {
    currentUser,
    contracts,
    messages,
    selectedContractId,
    setSelectedContractId,
    submitDeliverable,
    approveMilestoneAndReleaseEscrow,
    requestRevision,
    markWorkHandoverComplete,
    completeContract,
    sendMessage,
    setActiveView,
    addToast,
  } = useApp();

  const contract = (contracts || []).find((c) => c.id === selectedContractId) || contracts[0];
  const [chatInput, setChatInput] = useState('');
  const [revisionModalMilestoneId, setRevisionModalMilestoneId] = useState<string | null>(null);
  const [revisionReason, setRevisionReason] = useState('');

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
  const [reviewText, setReviewText] = useState('Outstanding engineering execution, seamless communication, and on-time milestone delivery!');

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

  const isFreelancer = currentUser?.role === 'freelancer' || (currentUser && currentUser.id === contract.freelancerId) || !currentUser;
  const isClient = currentUser?.role === 'client' || (currentUser && currentUser.id === contract.clientId) || !currentUser;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(contract.id, chatInput);
    setChatInput('');
  };

  const handleApproveMilestone = (milestoneId: string) => {
    approveMilestoneAndReleaseEscrow(contract.id, milestoneId);
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
  };

  const isContractCompleted = contract.status === 'completed';
  const approvedMilestonesCount = isContractCompleted
    ? (contract.milestones || []).length
    : (contract.milestones || []).filter((m) => m.status === 'approved').length;
  const approvedTotal = isContractCompleted
    ? contract.amount
    : (contract.milestones || [])
        .filter((m) => m.status === 'approved')
        .reduce((sum, m) => sum + (m.amount || 0), 0);

  const totalAmount = contract.amount || 1;

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
                    : 'rgba(99, 102, 241, 0.2)',
                color:
                  contract.status === 'completed'
                    ? 'var(--accent-emerald)'
                    : contract.status === 'delivered'
                    ? 'var(--accent-cyan)'
                    : '#c7d2fe',
                fontWeight: 800,
                border:
                  contract.status === 'completed'
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : contract.status === 'delivered'
                    ? '1px solid rgba(6, 182, 212, 0.4)'
                    : '1px solid rgba(99, 102, 241, 0.4)',
              }}
            >
              STATUS: {contract.status.toUpperCase()}
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
                  {c.gigTitle.slice(0, 32)}... (${c.amount}) [{c.status.toUpperCase()}]
                </option>
              ))}
            </select>
          )}

          {/* Quick Handover button for Freelancer */}
          {contract.status !== 'completed' && isFreelancer && (
            <button className="btn-primary" onClick={() => setShowHandoverModal(true)}>
              <Award size={16} /> Submit Final Handover
            </button>
          )}

          {/* Quick Complete Contract button for Client */}
          {contract.status !== 'completed' && isClient && (
            <button className="btn-success" onClick={() => setShowCompleteModal(true)}>
              <CheckCircle2 size={16} /> Accept Work & Complete Contract
            </button>
          )}
        </div>
      </div>

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

                  {/* Actions for Freelancer on Active Milestone */}
                  {(m.status === 'in_progress' || m.status === 'pending') && isFreelancer && contract.status !== 'completed' && (
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

                  {/* Actions for Client on Submitted Milestone */}
                  {m.status === 'submitted' && isClient && contract.status !== 'completed' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => setRevisionModalMilestoneId(m.id)}
                      >
                        <RotateCcw size={14} /> Request Revision
                      </button>

                      <button
                        className="btn-success"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        onClick={() => handleApproveMilestone(m.id)}
                      >
                        <CheckCircle2 size={14} /> Approve & Release Escrow (${m.amount.toLocaleString()})
                      </button>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <CheckCircle2 size={24} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '1.3rem' }}>Final Sign-off & Complete Contract</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Confirming completion will approve all remaining milestones, disburse 100% of escrow to <strong>{contract.freelancerName}</strong>, and close the contract.
            </p>

            <form onSubmit={handleCompleteContract}>
              {/* Star Rating */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  FREELANCER PERFORMANCE RATING
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: star <= rating ? 'var(--accent-amber)' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      <Star size={28} fill={star <= rating ? 'var(--accent-amber)' : 'none'} />
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
                  style={{ width: '100%', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCompleteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-success">
                  <CheckCircle2 size={16} /> Sign Off & Disburse Escrow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
