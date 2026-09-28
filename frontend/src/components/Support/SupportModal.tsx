import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { TicketCategory, TicketPriority, SupportTicket } from '../../types';
import {
  LifeBuoy,
  X,
  MessageSquare,
  PlusCircle,
  Clock,
  CheckCircle2,
  Send,
  Paperclip,
  Image as ImageIcon,
  FileCheck2,
  CreditCard,
  UserCheck,
  Sparkles,
  Bot,
  HelpCircle,
  Lock,
} from 'lucide-react';

export const SupportModal: React.FC = () => {
  const {
    currentUser,
    tickets,
    contracts,
    gigs,
    isSupportModalOpen,
    setIsSupportModalOpen,
    activeSupportTicketId,
    setActiveSupportTicketId,
    createSupportTicket,
    sendTicketMessage,
    adminUpdateTicket,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'my-tickets' | 'new-ticket'>('my-tickets');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  // Form State for New Ticket
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('payment_escrow');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [description, setDescription] = useState('');
  const [selectedContractId, setSelectedContractId] = useState<string>('');
  const [selectedGigId, setSelectedGigId] = useState<string>('');
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chat message input state
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<string | null>(null);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Filter user's tickets
  const myTickets = useMemo(() => {
    if (!currentUser) return [];
    return (tickets || []).filter(
      (t) =>
        t.userId === currentUser.id ||
        (t.userEmail && t.userEmail.toLowerCase() === currentUser.email?.toLowerCase())
    );
  }, [tickets, currentUser]);

  const filteredTickets = useMemo(() => {
    return myTickets.filter((t) => {
      return statusFilter === 'all' || t.status === statusFilter;
    });
  }, [myTickets, statusFilter]);

  // Selected Active Ticket
  const activeTicket = useMemo(() => {
    if (!activeSupportTicketId) return null;
    return (tickets || []).find((t) => String(t.id).trim() === String(activeSupportTicketId).trim()) || null;
  }, [tickets, activeSupportTicketId]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (activeTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTicket?.messages?.length]);

  // User's available contracts and gigs for linking
  const userContracts = useMemo(() => {
    if (!currentUser) return [];
    return (contracts || []).filter(
      (c) => c.clientId === currentUser.id || c.freelancerId === currentUser.id
    );
  }, [contracts, currentUser]);

  const userGigs = useMemo(() => {
    if (!currentUser) return [];
    return (gigs || []).filter(
      (g) => g.clientId === currentUser.id
    );
  }, [gigs, currentUser]);

  if (!isSupportModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isReply = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('warning', 'Image Only', 'Please upload a PNG or JPEG screenshot image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('warning', 'File Too Large', 'Maximum screenshot size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (isReply) {
        setReplyAttachment(dataUrl);
      } else {
        setAttachmentPreview(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      addToast('warning', 'Missing Fields', 'Please enter a subject and detailed description of your doubt.');
      return;
    }

    setIsSubmitting(true);
    const linkedContract = userContracts.find((c) => c.id === selectedContractId);
    const linkedGig = userGigs.find((g) => g.id === selectedGigId);

    const attachments = attachmentPreview ? [attachmentPreview] : [];

    const newTck = await createSupportTicket({
      subject: subject.trim(),
      category,
      priority,
      description: description.trim(),
      contractId: selectedContractId || undefined,
      contractTitle: linkedContract ? linkedContract.gigTitle : undefined,
      gigId: selectedGigId || undefined,
      gigTitle: linkedGig ? linkedGig.title : undefined,
      attachments,
    });

    setIsSubmitting(false);

    if (newTck) {
      setSubject('');
      setDescription('');
      setAttachmentPreview(null);
      setSelectedContractId('');
      setSelectedGigId('');
      setActiveTab('my-tickets');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || (!replyText.trim() && !replyAttachment)) return;

    setIsSendingReply(true);
    const attachments = replyAttachment ? [replyAttachment] : [];
    await sendTicketMessage(activeTicket.id, replyText.trim() || 'Uploaded attachment screenshot.', attachments);

    setReplyText('');
    setReplyAttachment(null);
    setIsSendingReply(false);
  };

  const handleMarkResolved = async () => {
    if (!activeTicket) return;
    await adminUpdateTicket(activeTicket.id, { status: 'resolved' });
    addToast('success', 'Ticket Resolved', 'Your inquiry has been marked as resolved.');
  };

  const getCategoryLabel = (cat: TicketCategory) => {
    switch (cat) {
      case 'payment_escrow':
        return { label: 'Payment & Escrow', icon: <CreditCard size={14} />, color: 'var(--accent-emerald)' };
      case 'contract_milestone':
        return { label: 'Milestone & Handover', icon: <FileCheck2 size={14} />, color: 'var(--accent-cyan)' };
      case 'verification':
        return { label: 'Trust & Verification', icon: <UserCheck size={14} />, color: 'var(--accent-amber)' };
      case 'account_security':
        return { label: 'Account & Security', icon: <Lock size={14} />, color: 'var(--accent-rose)' };
      case 'technical':
        return { label: 'Technical Issue', icon: <Bot size={14} />, color: 'var(--accent-indigo)' };
      default:
        return { label: 'General Query', icon: <HelpCircle size={14} />, color: 'var(--accent-primary)' };
    }
  };

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'urgent':
        return { label: 'Urgent', bg: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)', border: 'rgba(244, 63, 94, 0.4)' };
      case 'high':
        return { label: 'High Priority', bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)', border: 'rgba(245, 158, 11, 0.4)' };
      case 'medium':
        return { label: 'Medium', bg: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', border: 'rgba(6, 182, 212, 0.4)' };
      default:
        return { label: 'Low', bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const getStatusBadge = (st: SupportTicket['status']) => {
    switch (st) {
      case 'open':
        return { label: 'Open (Awaiting Admin)', bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)', icon: <Clock size={12} /> };
      case 'in_progress':
        return { label: 'In Progress (Admin Investigating)', bg: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', icon: <Sparkles size={12} /> };
      case 'resolved':
        return { label: 'Resolved', bg: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)', icon: <CheckCircle2 size={12} /> };
      default:
        return { label: 'Closed', bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)', icon: <CheckCircle2 size={12} /> };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(4, 9, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={() => setIsSupportModalOpen(false)}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '88vh',
          maxHeight: '850px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(10, 18, 32, 0.98)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(99, 102, 241, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-cyan) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
              }}
            >
              <LifeBuoy size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  Platform Helpdesk & Dispute Support
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'var(--accent-emerald)',
                    fontWeight: 700,
                  }}
                >
                  Admin Mediation Live
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Direct support assistance for {currentUser?.role === 'freelancer' ? 'Freelancers' : 'Clients'} with escrow, payment verification & contract queries.
              </p>
            </div>
          </div>

          <button
            className="btn-ghost"
            onClick={() => setIsSupportModalOpen(false)}
            style={{ padding: '8px', borderRadius: '50%' }}
            title="Close Helpdesk"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Main Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* LEFT SIDEBAR: Navigation / Ticket List */}
          <div
            style={{
              width: '340px',
              borderRight: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(7, 13, 24, 0.5)',
            }}
          >
            {/* Action Bar */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '8px' }}>
              <button
                className={`btn-primary ${activeTab === 'my-tickets' ? '' : 'btn-secondary'}`}
                style={{
                  flex: 1,
                  fontSize: '0.82rem',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
                onClick={() => {
                  setActiveTab('my-tickets');
                }}
              >
                <MessageSquare size={15} />
                <span>My Tickets ({myTickets.length})</span>
              </button>

              <button
                className={`btn-primary ${activeTab === 'new-ticket' ? '' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.82rem',
                  padding: '9px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => {
                  setActiveTab('new-ticket');
                  setActiveSupportTicketId(null);
                }}
                title="Create New Query"
              >
                <PlusCircle size={15} />
                <span>New Query</span>
              </button>
            </div>

            {/* Filter Pills */}
            {activeTab === 'my-tickets' && (
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                }}
              >
                {(['all', 'open', 'in_progress', 'resolved'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      borderRadius: 'var(--radius-full)',
                      border: statusFilter === st ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      background: statusFilter === st ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                      color: statusFilter === st ? 'var(--text-primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      textTransform: 'capitalize',
                    }}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}

            {/* Ticket List View */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {activeTab === 'new-ticket' ? (
                <div style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
                  <Sparkles size={28} style={{ color: 'var(--accent-cyan)', margin: '0 auto 12px' }} />
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    Create Support Ticket
                  </strong>
                  Fill in your doubt details on the right panel to alert Admin governance mediators.
                </div>
              ) : filteredTickets.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} style={{ color: 'var(--accent-emerald)', margin: '0 auto 12px' }} />
                  <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.9rem' }}>
                    No Support Tickets Found
                  </strong>
                  <p style={{ fontSize: '0.78rem', margin: '6px 0 16px' }}>
                    Have a doubt about UPI payments, escrow verification, or milestones?
                  </p>
                  <button
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                    onClick={() => setActiveTab('new-ticket')}
                  >
                    + Ask Support
                  </button>
                </div>
              ) : (
                filteredTickets.map((tck) => {
                  const isSelected = activeTicket?.id === tck.id;
                  const catInfo = getCategoryLabel(tck.category);
                  const pBadge = getPriorityBadge(tck.priority);
                  const stBadge = getStatusBadge(tck.status);

                  return (
                    <div
                      key={tck.id}
                      onClick={() => {
                        setActiveSupportTicketId(tck.id);
                        setActiveTab('my-tickets');
                      }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected
                          ? '1px solid var(--accent-primary)'
                          : '1px solid rgba(255, 255, 255, 0.04)',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                          {tck.ticketNumber}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                            background: pBadge.bg,
                            color: pBadge.color,
                            border: `1px solid ${pBadge.border}`,
                            fontWeight: 700,
                          }}
                        >
                          {pBadge.label}
                        </span>
                      </div>

                      <strong
                        style={{
                          fontSize: '0.86rem',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.3,
                          marginBottom: '8px',
                        }}
                      >
                        {tck.subject}
                      </strong>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: catInfo.color }}>
                          {catInfo.icon}
                          {catInfo.label}
                        </span>

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: stBadge.color,
                            fontWeight: 600,
                          }}
                        >
                          {stBadge.icon}
                          {tck.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Form (New Ticket) or Chat Thread (Active Ticket) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(10, 18, 32, 0.95)' }}>
            {activeTab === 'new-ticket' ? (
              /* NEW TICKET FORM */
              <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Submit Query to Admin Support
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Our master administrators mediate escrow queries, verify freelancer proofs, and resolve project doubts.
                  </p>
                </div>

                <form onSubmit={handleCreateTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Category Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Query Category <span style={{ color: 'var(--accent-rose)' }}>*</span>
                    </label>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '10px',
                      }}
                    >
                      {[
                        { id: 'payment_escrow', label: 'Payment & Escrow', desc: 'UPI transfer, proof, payout status', icon: <CreditCard size={18} /> },
                        { id: 'contract_milestone', label: 'Milestone & Handover', desc: 'Deliverables review or dispute', icon: <FileCheck2 size={18} /> },
                        { id: 'verification', label: 'Trust & Verification', desc: 'Badge audit, KYC, portfolio doubt', icon: <UserCheck size={18} /> },
                        { id: 'account_security', label: 'Account & Security', desc: 'Login, permissions, profile', icon: <Lock size={18} /> },
                        { id: 'technical', label: 'Technical Issue', desc: 'Platform bugs or file upload', icon: <Bot size={18} /> },
                        { id: 'general', label: 'General Doubt', desc: 'Other questions or policies', icon: <HelpCircle size={18} /> },
                      ].map((catItem) => {
                        const isSelected = category === catItem.id;
                        return (
                          <div
                            key={catItem.id}
                            onClick={() => setCategory(catItem.id as TicketCategory)}
                            style={{
                              padding: '12px 14px',
                              borderRadius: 'var(--radius-md)',
                              background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                              border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', marginBottom: '4px' }}>
                              {catItem.icon}
                              <strong style={{ fontSize: '0.85rem' }}>{catItem.label}</strong>
                            </div>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                              {catItem.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority & Linked Items */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Priority Level
                      </label>
                      <select
                        className="input-field"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TicketPriority)}
                        style={{ width: '100%' }}
                      >
                        <option value="low">Low - General Question</option>
                        <option value="medium">Medium - Standard Request</option>
                        <option value="high">High - Payment / Milestone Block</option>
                        <option value="urgent">Urgent - Critical Escrow Dispute</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Linked Escrow Contract (Optional)
                      </label>
                      <select
                        className="input-field"
                        value={selectedContractId}
                        onChange={(e) => setSelectedContractId(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="">-- No specific contract --</option>
                        {userContracts.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.gigTitle} (${c.amount}) - {c.status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Subject Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Subject / Short Summary <span style={{ color: 'var(--accent-rose)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Milestone 2 payment proof submitted, need admin release confirmation"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Description Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Detailed Query / Doubt <span style={{ color: 'var(--accent-rose)' }}>*</span>
                    </label>
                    <textarea
                      className="input-field"
                      rows={4}
                      placeholder="Provide full details, transaction references (UTR/UPI ID), milestone numbers, or any specific questions..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>

                  {/* Attachment Upload */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      Attach Screenshot or Transaction Proof (Optional)
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleFileUpload(e, false)}
                    />

                    {attachmentPreview ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={attachmentPreview}
                          alt="Attachment preview"
                          style={{
                            maxWidth: '240px',
                            maxHeight: '140px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-medium)',
                            objectFit: 'cover',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setAttachmentPreview(null)}
                          style={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            background: 'var(--accent-rose)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}
                      >
                        <ImageIcon size={16} />
                        <span>Upload Screenshot / Receipt</span>
                      </button>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setActiveTab('my-tickets')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSubmitting}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
                    >
                      <Send size={16} />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : activeTicket ? (
              /* ACTIVE TICKET LIVE THREAD */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Active Ticket Header */}
                <div
                  style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        {activeTicket.ticketNumber}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: getCategoryLabel(activeTicket.category).color + '20',
                          color: getCategoryLabel(activeTicket.category).color,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {getCategoryLabel(activeTicket.category).icon}
                        {getCategoryLabel(activeTicket.category).label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          ...getStatusBadge(activeTicket.status),
                          fontWeight: 700,
                        }}
                      >
                        {activeTicket.status.toUpperCase()}
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {activeTicket.subject}
                    </h4>
                    {activeTicket.contractTitle && (
                      <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Linked Contract: <strong style={{ color: 'var(--text-secondary)' }}>{activeTicket.contractTitle}</strong>
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {activeTicket.status !== 'resolved' && (
                      <button
                        className="btn-secondary"
                        onClick={handleMarkResolved}
                        style={{
                          fontSize: '0.78rem',
                          padding: '6px 12px',
                          color: 'var(--accent-emerald)',
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Feed */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(activeTicket.messages || []).map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const isAdmin = msg.senderRole === 'admin' || msg.senderId === 'admin-master-node';
                    const isBot = msg.senderRole === 'support_agent' || msg.senderId === 'system-support-bot';

                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          flexDirection: isMe ? 'row-reverse' : 'row',
                        }}
                      >
                        <img
                          src={
                            msg.senderAvatar ||
                            (isAdmin
                              ? 'https://api.dicebear.com/7.x/bottts/svg?seed=admin-governance-shield'
                              : isBot
                              ? 'https://api.dicebear.com/7.x/bottts/svg?seed=support-ai-bot'
                              : 'https://api.dicebear.com/7.x/bottts/svg?seed=user')
                          }
                          alt={msg.senderName}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: isAdmin
                              ? '2px solid var(--accent-amber)'
                              : isBot
                              ? '2px solid var(--accent-cyan)'
                              : '2px solid var(--border-medium)',
                          }}
                        />

                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '4px',
                              flexDirection: isMe ? 'row-reverse' : 'row',
                            }}
                          >
                            <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                              {isMe ? 'You' : msg.senderName}
                            </strong>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-full)',
                                background: isAdmin
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : isBot
                                  ? 'rgba(6, 182, 212, 0.2)'
                                  : 'rgba(99, 102, 241, 0.2)',
                                color: isAdmin
                                  ? 'var(--accent-amber)'
                                  : isBot
                                  ? 'var(--accent-cyan)'
                                  : 'var(--accent-primary)',
                                fontWeight: 700,
                              }}
                            >
                              {isAdmin ? 'ADMIN MEDIATOR' : isBot ? 'SUPPORT BOT' : msg.senderRole?.toUpperCase() || 'USER'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div
                            style={{
                              padding: '12px 16px',
                              borderRadius: 'var(--radius-md)',
                              background: isMe
                                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(6, 182, 212, 0.2) 100%)'
                                : isAdmin
                                ? 'rgba(245, 158, 11, 0.08)'
                                : 'rgba(255, 255, 255, 0.04)',
                              border: isMe
                                ? '1px solid rgba(99, 102, 241, 0.4)'
                                : isAdmin
                                ? '1px solid rgba(245, 158, 11, 0.3)'
                                : '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                              fontSize: '0.86rem',
                              lineHeight: 1.5,
                              whiteSpace: 'pre-wrap',
                            }}
                          >
                            {msg.content}

                            {/* Attachments inside message */}
                            {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                              <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {msg.attachments.map((attUrl, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setLightboxImage(attUrl)}
                                    style={{
                                      cursor: 'pointer',
                                      position: 'relative',
                                      borderRadius: 'var(--radius-sm)',
                                      overflow: 'hidden',
                                      border: '1px solid var(--border-medium)',
                                    }}
                                    title="Click to view full image"
                                  >
                                    <img
                                      src={attUrl}
                                      alt={`Attachment ${idx + 1}`}
                                      style={{ width: 140, height: 90, objectFit: 'cover', display: 'block' }}
                                    />
                                    <div
                                      style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: 'rgba(0,0,0,0.6)',
                                        color: '#fff',
                                        fontSize: '0.65rem',
                                        padding: '2px 4px',
                                        textAlign: 'center',
                                      }}
                                    >
                                      🔍 Expand
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input Bar */}
                <form
                  onSubmit={handleSendReply}
                  style={{
                    padding: '16px 20px',
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'rgba(5, 10, 18, 0.98)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {replyAttachment && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                      <img src={replyAttachment} alt="Reply preview" style={{ width: 36, height: 36, borderRadius: '4px', objectFit: 'cover' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Screenshot attached</span>
                      <button type="button" onClick={() => setReplyAttachment(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', marginLeft: 'auto' }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="file"
                      ref={replyFileInputRef}
                      style={{ display: 'none' }}
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleFileUpload(e, true)}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => replyFileInputRef.current?.click()}
                      style={{ padding: '10px', color: 'var(--accent-cyan)' }}
                      title="Attach Screenshot"
                    >
                      <Paperclip size={18} />
                    </button>

                    <input
                      type="text"
                      className="input-field"
                      placeholder="Type your message, ask a doubt, or clarify details with Admin..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      style={{ flex: 1 }}
                    />

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSendingReply || (!replyText.trim() && !replyAttachment)}
                      style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Send size={15} />
                      <span>Reply</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* EMPTY SELECTION STATE */
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', padding: '24px' }}>
                <LifeBuoy size={48} style={{ color: 'var(--accent-primary)', marginBottom: '16px' }} />
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>Select or Create a Support Ticket</h4>
                <p style={{ maxWidth: '360px', textAlign: 'center', fontSize: '0.85rem' }}>
                  Choose an existing inquiry from the sidebar or click "New Query" to ask for administrative assistance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Screenshots */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 20000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Expanded view"
            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}
          />
          <button
            onClick={() => setLightboxImage(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              color: '#fff',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
