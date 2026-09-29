import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  DollarSign,
  Activity,
  Award,
  RefreshCw,
  Briefcase,
  Users,
  Lock,
  MessageSquare,
  Sparkles,
  Trash2,
  LifeBuoy,
  Send,
  Paperclip,
  CreditCard,
  UserCheck,
  Bot,
  HelpCircle,
  X,
} from 'lucide-react';
import type { Gig, SupportTicket, TicketCategory, TicketPriority, TicketStatus } from '../../types';
import { GigDetailModal } from '../Marketplace/GigDetailModal';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    verifications,
    contracts,
    gigs,
    bids,
    tickets,
    adminStats,
    reviewVerification,
    adminUpdateGig,
    adminUpdateContract,
    sendTicketMessage,
    adminUpdateTicket,
    refreshGigs,
    isSyncingGigs,
    selectedGigId,
    setSelectedGigId,
    setSelectedContractId,
    setActiveView,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'queue' | 'gigs' | 'proposals' | 'analytics' | 'users' | 'tickets'>('queue');
  const [reviewComment, setReviewComment] = useState('');
  const [selectedVerifId, setSelectedVerifId] = useState<string | null>(null);

  // Search & Filter state for Gigs tab
  const [gigSearch, setGigSearch] = useState('');
  const [gigStatusFilter, setGigStatusFilter] = useState<'all' | 'open' | 'awarded' | 'completed'>('all');
  const [contractFilter, setContractFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Search state for Users tab
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'client' | 'freelancer' | 'admin'>('all');

  // Support Helpdesk State in Admin Portal
  const [selectedAdminTicketId, setSelectedAdminTicketId] = useState<string | null>(null);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketRoleFilter, setTicketRoleFilter] = useState<'all' | 'client' | 'freelancer'>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState<string>('all');
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminReplyAttachment, setAdminReplyAttachment] = useState<string | null>(null);
  const [isSendingAdminReply, setIsSendingAdminReply] = useState(false);
  const [adminNotesDraft, setAdminNotesDraft] = useState('');
  const [ticketLightboxImage, setTicketLightboxImage] = useState<string | null>(null);
  const adminReplyFileInputRef = useRef<HTMLInputElement | null>(null);
  const adminMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-refresh when entering admin dashboard
  useEffect(() => {
    refreshGigs();
  }, [refreshGigs]);

  const pendingVerifs = (verifications || []).filter((v) => v.status === 'pending' || v.status === 'under_review');
  const approvedVerifs = (verifications || []).filter((v) => v.status === 'approved');

  const handleDecision = (id: string, status: 'approved' | 'rejected' | 'under_review') => {
    reviewVerification(id, status, reviewComment || (status === 'approved' ? 'Identity verified & credentials approved by Administrator.' : 'Verification requirements not met.'));
    setReviewComment('');
    setSelectedVerifId(null);
  };

  const filteredGigs = useMemo(() => {
    return (gigs || []).filter((g) => {
      const isGigCompleted =
        g.status === 'completed' ||
        (contracts || []).some((c) => String(c.gigId).trim() === String(g.id).trim() && c.status === 'completed');
      const computedStatus = isGigCompleted ? 'completed' : (g.status || 'open');
      const matchesStatus = gigStatusFilter === 'all' || computedStatus === gigStatusFilter;
      const matchesSearch =
        gigSearch === '' ||
        g.title.toLowerCase().includes(gigSearch.toLowerCase()) ||
        g.clientName.toLowerCase().includes(gigSearch.toLowerCase()) ||
        (g.tags || []).some((t) => t.toLowerCase().includes(gigSearch.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [gigs, gigStatusFilter, gigSearch, contracts]);

  const filteredContracts = useMemo(() => {
    return (contracts || []).filter((c) => {
      if (contractFilter === 'all') return true;
      if (contractFilter === 'completed') return c.status === 'completed';
      return c.status !== 'completed';
    });
  }, [contracts, contractFilter]);

  // Compute unique platform users
  const platformUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; fullName: string; role: string; email: string; isVerified: boolean; rating: number; count: number }>();

    // From gigs
    for (const g of gigs || []) {
      if (g.clientId) {
        userMap.set(g.clientId, {
          id: g.clientId,
          fullName: g.clientName || 'Enterprise Client',
          role: 'client',
          email: `${g.clientId}@client.io`,
          isVerified: g.clientVerified ?? true,
          rating: g.clientRating ?? 5.0,
          count: (userMap.get(g.clientId)?.count || 0) + 1,
        });
      }
    }

    // From bids
    for (const b of bids || []) {
      if (b.freelancerId) {
        userMap.set(b.freelancerId, {
          id: b.freelancerId,
          fullName: b.freelancerName || 'Specialist Engineer',
          role: 'freelancer',
          email: `${b.freelancerId}@freelancestack.dev`,
          isVerified: b.isVerified ?? true,
          rating: b.freelancerRating ?? 5.0,
          count: (userMap.get(b.freelancerId)?.count || 0) + 1,
        });
      }
    }

    // From verifications
    for (const v of verifications || []) {
      if (v.userId && !userMap.has(v.userId)) {
        userMap.set(v.userId, {
          id: v.userId,
          fullName: v.userName || 'Applicant',
          role: 'freelancer',
          email: v.userEmail || `${v.userId}@applicant.dev`,
          isVerified: v.status === 'approved',
          rating: 5.0,
          count: 1,
        });
      }
    }

    // Admin
    userMap.set('admin-master-node', {
      id: 'admin-master-node',
      fullName: 'Master Administrator',
      role: 'admin',
      email: 'admin@freelancestack.io',
      isVerified: true,
      rating: 5.0,
      count: 0,
    });

    let list = Array.from(userMap.values());
    if (userRoleFilter !== 'all') {
      list = list.filter((u) => u.role === userRoleFilter);
    }
    if (userSearch) {
      list = list.filter((u) =>
        u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
      );
    }
    return list;
  }, [gigs, bids, verifications, userRoleFilter, userSearch]);

  // Support Helpdesk Computed Properties
  const openTicketsCount = (tickets || []).filter((t) => t.status === 'open').length;

  const filteredAdminTickets = useMemo(() => {
    return (tickets || []).filter((t) => {
      const matchesRole = ticketRoleFilter === 'all' || t.userRole === ticketRoleFilter;
      const matchesStatus = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
      const matchesPriority = ticketPriorityFilter === 'all' || t.priority === ticketPriorityFilter;
      const matchesCategory = ticketCategoryFilter === 'all' || t.category === ticketCategoryFilter;
      const matchesSearch =
        ticketSearch === '' ||
        (t.ticketNumber && t.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase())) ||
        (t.subject && t.subject.toLowerCase().includes(ticketSearch.toLowerCase())) ||
        (t.userName && t.userName.toLowerCase().includes(ticketSearch.toLowerCase())) ||
        (t.userEmail && t.userEmail.toLowerCase().includes(ticketSearch.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(ticketSearch.toLowerCase()));
      return matchesRole && matchesStatus && matchesPriority && matchesCategory && matchesSearch;
    });
  }, [tickets, ticketRoleFilter, ticketStatusFilter, ticketPriorityFilter, ticketCategoryFilter, ticketSearch]);

  const selectedAdminTicket = useMemo(() => {
    if (selectedAdminTicketId) {
      const match = (tickets || []).find((t) => String(t.id).trim() === String(selectedAdminTicketId).trim());
      if (match) return match;
    }
    return filteredAdminTickets.length > 0 ? filteredAdminTickets[0] : null;
  }, [tickets, selectedAdminTicketId, filteredAdminTickets]);

  useEffect(() => {
    if (selectedAdminTicket) {
      setAdminNotesDraft(selectedAdminTicket.adminNotes || '');
    }
  }, [selectedAdminTicket?.id]);

  useEffect(() => {
    if (selectedAdminTicket) {
      adminMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedAdminTicket?.messages?.length]);

  const handleAdminFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('warning', 'Image Only', 'Please upload a PNG or JPEG screenshot image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAdminReplyAttachment(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminTicket || (!adminReplyText.trim() && !adminReplyAttachment)) return;

    setIsSendingAdminReply(true);
    const attachments = adminReplyAttachment ? [adminReplyAttachment] : [];
    await sendTicketMessage(selectedAdminTicket.id, adminReplyText.trim() || 'Attached administrative report.', attachments);

    setAdminReplyText('');
    setAdminReplyAttachment(null);
    setIsSendingAdminReply(false);
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedAdminTicket) return;
    await adminUpdateTicket(selectedAdminTicket.id, { adminNotes: adminNotesDraft });
    addToast('success', 'Admin Notes Saved', 'Internal memorandum updated.');
  };

  const getAdminCategoryLabel = (cat: TicketCategory) => {
    switch (cat) {
      case 'payment_escrow':
        return { label: 'Payment & Escrow', icon: <CreditCard size={14} />, color: 'var(--accent-emerald)' };
      case 'contract_milestone':
        return { label: 'Milestone & Handover', icon: <FileText size={14} />, color: 'var(--accent-cyan)' };
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

  const getAdminPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'urgent':
        return { label: 'Urgent', bg: 'rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)', border: 'rgba(244, 63, 94, 0.4)' };
      case 'high':
        return { label: 'High', bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)', border: 'rgba(245, 158, 11, 0.4)' };
      case 'medium':
        return { label: 'Medium', bg: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', border: 'rgba(6, 182, 212, 0.4)' };
      default:
        return { label: 'Low', bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  const getAdminStatusBadge = (st: SupportTicket['status']) => {
    switch (st) {
      case 'open':
        return { label: 'Open (Awaiting Review)', bg: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)', border: 'rgba(245, 158, 11, 0.4)' };
      case 'in_progress':
        return { label: 'In Progress', bg: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', border: 'rgba(6, 182, 212, 0.4)' };
      case 'resolved':
        return { label: 'Resolved', bg: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)', border: 'rgba(16, 185, 129, 0.4)' };
      default:
        return { label: 'Closed', bg: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <div className="app-container">
      {/* Admin Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="persona-badge badge-admin">Platform Administration</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {currentUser ? `Admin: ${currentUser.fullName}` : 'Admin Access'}
            </span>
          </div>
          <h2>Platform Administration & Safety</h2>
          <p>Review identity verifications, manage active projects, monitor escrow transactions, and support users.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => refreshGigs()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Fetch Fresh Records from Backend"
          >
            <RefreshCw size={15} className={isSyncingGigs ? 'spin-icon' : ''} />
            <span>{isSyncingGigs ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--accent-emerald)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <Activity size={14} /> System Operational
          </span>
        </div>
      </div>

      {/* Global Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Platform GMV
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>
              ${adminStats.totalGMV.toLocaleString()}
            </strong>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ${adminStats.escrowLocked.toLocaleString()} locked in escrow
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            5% Net Fee Revenue
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--accent-emerald)' }}>
              ${adminStats.platformFees.toLocaleString()}
            </strong>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
            100% collected upon sign-off
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Verification Queue
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--accent-amber)' }}>
              {pendingVerifs.length}
            </strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Awaiting Review</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
            {approvedVerifs.length} Verified Pros
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Projects & Proposals
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--accent-cyan)' }}>
              {adminStats.totalGigs}
            </strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              ({adminStats.openGigs} Open)
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {adminStats.totalBids} candidate proposals
          </span>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '20px',
            cursor: 'pointer',
            border: activeTab === 'tickets' ? '1px solid var(--accent-primary)' : openTicketsCount > 0 ? '1px solid rgba(244, 63, 94, 0.4)' : undefined,
          }}
          onClick={() => setActiveTab('tickets')}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Support Helpdesk
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: openTicketsCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
              {openTicketsCount}
            </strong>
            <span style={{ fontSize: '0.8rem', color: openTicketsCount > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
              {openTicketsCount > 0 ? 'Needs Attention' : 'All Clear'}
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
            {tickets.length} total inquiries ({adminStats.clientTickets} Client / {adminStats.freelancerTickets} Freelancer)
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '28px',
          overflowX: 'auto',
        }}
      >
        <button
          className={`btn-ghost ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
          style={{
            borderBottom: activeTab === 'queue' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'queue' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            whiteSpace: 'nowrap',
          }}
        >
          <ShieldCheck size={16} /> Verification Queue ({pendingVerifs.length})
        </button>

        <button
          className={`btn-ghost ${activeTab === 'gigs' ? 'active' : ''}`}
          onClick={() => setActiveTab('gigs')}
          style={{
            borderBottom: activeTab === 'gigs' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'gigs' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            whiteSpace: 'nowrap',
          }}
        >
          <Briefcase size={16} /> Platform Projects ({gigs.length})
        </button>

        <button
          className={`btn-ghost ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
          style={{
            borderBottom: activeTab === 'proposals' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'proposals' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            whiteSpace: 'nowrap',
          }}
        >
          <Users size={16} /> Proposals & Contracts ({contracts.length})
        </button>

        <button
          className={`btn-ghost ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
          style={{
            borderBottom: activeTab === 'analytics' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'analytics' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            whiteSpace: 'nowrap',
          }}
        >
          <DollarSign size={16} /> Treasury & Escrow Analytics
        </button>

        <button
          className={`btn-ghost ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          style={{
            borderBottom: activeTab === 'users' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'users' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            whiteSpace: 'nowrap',
          }}
        >
          <Users size={16} /> User Management ({platformUsers.length})
        </button>

        <button
          className={`btn-ghost ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
          style={{
            borderBottom: activeTab === 'tickets' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'tickets' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <LifeBuoy size={16} /> Support & Dispute Helpdesk ({tickets.length})
          {openTicketsCount > 0 && (
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(244, 63, 94, 0.25)',
                color: 'var(--accent-rose)',
                fontWeight: 800,
                border: '1px solid rgba(244, 63, 94, 0.4)',
              }}
            >
              {openTicketsCount} Open
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Verification Queue */}
      {activeTab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {pendingVerifs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <CheckCircle2 size={48} style={{ color: 'var(--accent-emerald)', marginBottom: '16px' }} />
              <h3>Verification Queue is Empty</h3>
              <p style={{ maxWidth: '420px', margin: '8px auto' }}>
                All pending candidate KYC identity checks and portfolio submissions have been audited.
              </p>
            </div>
          ) : (
            pendingVerifs.map((verif) => (
              <div key={verif.id} className="glass-panel" style={{ padding: '28px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img
                      src={verif.selfieUrl}
                      alt={verif.userName}
                      style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{verif.userName}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {verif.professionalTitle} • {verif.yearsExperience} Years Exp • {verif.userEmail}
                      </p>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--accent-amber)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    STATUS: {verif.status}
                  </span>
                </div>

                {/* Pitch Statement */}
                <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    PROFESSIONAL PITCH STATEMENT:
                  </span>
                  <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                    "{verif.pitchStatement}"
                  </p>
                </div>

                {/* Skills */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    VERIFIED SKILL TAGS:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(verif.skillTags || []).map((skill) => (
                      <span key={skill} className="tag-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Proof Documents & Links */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ID Document:</span>
                    <a href={verif.idDocumentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <FileText size={14} /> View ID Document
                    </a>
                  </div>

                  {verif.portfolioFiles && verif.portfolioFiles.length > 0 && (
                    <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Portfolio / Showcase:</span>
                      <a href={verif.portfolioFiles[0]} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <ExternalLink size={14} /> Open Live Showcase
                      </a>
                    </div>
                  )}

                  {verif.certificates && verif.certificates.length > 0 && (
                    <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Certificate:</span>
                      <a href={verif.certificates[0]} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Award size={14} /> View Certificate
                      </a>
                    </div>
                  )}
                </div>

                {/* Optional Admin Review Comment */}
                {selectedVerifId === verif.id && (
                  <div style={{ marginBottom: '16px', padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: 600, marginBottom: '6px' }}>
                      REASON FOR REJECTION (WILL BE SENT TO CANDIDATE):
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="e.g. Please provide valid passport scan and active GitHub showcase link..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        style={{ flex: 1, fontSize: '0.85rem' }}
                      />
                      <button
                        className="btn-danger"
                        style={{ padding: '6px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        onClick={() => handleDecision(verif.id, 'rejected')}
                      >
                        Confirm Rejection
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                        onClick={() => {
                          setSelectedVerifId(null);
                          setReviewComment('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Decision Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Submitted {new Date(verif.submittedAt).toLocaleDateString()}
                  </span>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                      onClick={() => handleDecision(verif.id, 'under_review')}
                      title="Set status to Under Review"
                    >
                      <Activity size={15} color="var(--accent-amber)" /> Under Review
                    </button>

                    <button
                      className="btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--accent-rose)' }}
                      onClick={() => {
                        if (selectedVerifId !== verif.id) {
                          setSelectedVerifId(verif.id);
                        } else {
                          handleDecision(verif.id, 'rejected');
                        }
                      }}
                    >
                      <XCircle size={15} color="var(--accent-rose)" /> Reject
                    </button>

                    <button
                      className="btn-success"
                      style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                      onClick={() => handleDecision(verif.id, 'approved')}
                    >
                      <CheckCircle2 size={16} /> Approve & Grant Marketplace Access
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Approved Pros List */}
          {approvedVerifs.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--accent-emerald)" />
                Audited & Approved Verified Professionals ({approvedVerifs.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
                {approvedVerifs.map((v) => (
                  <div key={v.id} className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={v.selfieUrl} alt={v.userName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {v.userName} <CheckCircle2 size={14} color="var(--accent-emerald)" />
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.professionalTitle} • {v.userEmail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Platform Gigs */}
      {activeTab === 'gigs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Search projects by title, client, or tags..."
                value={gigSearch}
                onChange={(e) => setGigSearch(e.target.value)}
                style={{ width: '100%', maxWidth: '400px', fontSize: '0.85rem' }}
              />
              <select
                value={gigStatusFilter}
                onChange={(e) => setGigStatusFilter(e.target.value as any)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="awarded">Awarded</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredGigs.length} of {gigs.length} projects
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredGigs.map((g: Gig) => {
              const matchingBids = bids.filter((b) => String(b.gigId || (b as any).gig_id).trim() === String(g.id).trim());
              return (
                <div
                  key={g.id}
                  className="glass-panel"
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                    <div style={{ maxWidth: '600px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                        {g.categoryName}
                      </span>
                      {(() => {
                        const isGigCompleted =
                          g.status === 'completed' ||
                          (contracts || []).some((c) => String(c.gigId).trim() === String(g.id).trim() && c.status === 'completed');
                        const effectiveStatus = isGigCompleted ? 'completed' : (g.status || 'open');
                        return (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background:
                                effectiveStatus === 'completed'
                                  ? 'rgba(16, 185, 129, 0.2)'
                                  : effectiveStatus === 'open'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : effectiveStatus === 'awarded'
                                  ? 'rgba(99, 102, 241, 0.15)'
                                  : 'rgba(148, 163, 184, 0.15)',
                              color:
                                effectiveStatus === 'completed'
                                  ? 'var(--accent-emerald)'
                                  : effectiveStatus === 'open'
                                  ? 'var(--accent-emerald)'
                                  : effectiveStatus === 'awarded'
                                  ? 'var(--accent-primary)'
                                  : 'var(--text-muted)',
                              border:
                                effectiveStatus === 'completed'
                                  ? '1px solid rgba(16, 185, 129, 0.4)'
                                  : 'none',
                              fontWeight: 700,
                            }}
                          >
                            {effectiveStatus === 'completed' ? 'COMPLETED ✅' : effectiveStatus.toUpperCase()}
                          </span>
                        );
                      })()}
                      {g.isFeatured && (
                        <span className="featured-pill">
                          <Sparkles size={11} /> Featured
                        </span>
                      )}
                    </div>

                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                      {g.title}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Client: {g.clientName} ({g.clientCompany || 'Company'}) • Posted {new Date(g.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '1.15rem', color: 'var(--accent-emerald)', display: 'block' }}>
                        ${g.budgetMin.toLocaleString()} - ${g.budgetMax.toLocaleString()}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {matchingBids.length} proposals received
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-ghost"
                        style={{ padding: '8px 12px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}
                        onClick={() => setSelectedGigId(g.id)}
                      >
                        <ExternalLink size={14} /> Scope
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                        onClick={() => adminUpdateGig(g.id, { isFeatured: !g.isFeatured })}
                      >
                        {g.isFeatured ? 'Unfeature' : '⭐ Feature'}
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--accent-rose)' }}
                        onClick={() => adminUpdateGig(g.id, { action: 'delete' })}
                        title="Delete project"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Proposals & Escrow Contracts Oversight */}
      {activeTab === 'proposals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Contracts Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} color="var(--accent-emerald)" />
                Escrow Contracts ({contracts.length})
                <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                  ({contracts.filter((c) => c.status !== 'completed').length} Active, {contracts.filter((c) => c.status === 'completed').length} Completed)
                </span>
              </h3>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['all', 'in_progress', 'completed'] as const).map((filterVal) => (
                  <button
                    key={filterVal}
                    onClick={() => setContractFilter(filterVal)}
                    className={`btn-ghost ${contractFilter === filterVal ? 'active' : ''}`}
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.8rem',
                      borderRadius: 'var(--radius-full)',
                      background: contractFilter === filterVal ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.04)',
                      color: contractFilter === filterVal ? 'white' : 'var(--text-muted)',
                    }}
                  >
                    {filterVal === 'all'
                      ? `All (${contracts.length})`
                      : filterVal === 'in_progress'
                      ? `Active (${contracts.filter((c) => c.status !== 'completed').length})`
                      : `Completed (${contracts.filter((c) => c.status === 'completed').length})`}
                  </button>
                ))}
              </div>
            </div>

            {filteredContracts.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Lock size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h4>No {contractFilter === 'completed' ? 'Completed' : contractFilter === 'in_progress' ? 'Active' : ''} Contracts Found</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {contractFilter === 'completed'
                    ? 'No contracts have completed all milestone reviews yet.'
                    : 'When clients accept freelancer proposals, smart escrow contracts appear here with mediation controls.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '18px' }}>
                {filteredContracts.map((c) => (
                  <div key={c.id} className="glass-panel" style={{ padding: '24px', border: c.status === 'completed' ? '1px solid rgba(16, 185, 129, 0.35)' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          background:
                            c.status === 'completed'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : c.status === 'delivered'
                              ? 'rgba(6, 182, 212, 0.2)'
                              : 'rgba(99, 102, 241, 0.2)',
                          color:
                            c.status === 'completed'
                              ? 'var(--accent-emerald)'
                              : c.status === 'delivered'
                              ? 'var(--accent-cyan)'
                              : '#c7d2fe',
                          border: c.status === 'completed' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                        }}
                      >
                        {c.status === 'completed' ? 'COMPLETED & SETTLED ✅' : c.status.toUpperCase()}
                      </span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--accent-emerald)' }}>
                        ${c.amount.toLocaleString()}
                      </strong>
                    </div>

                    <h4 style={{ fontSize: '1rem', marginBottom: '12px', lineHeight: 1.4 }}>
                      {c.gigTitle}
                    </h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      <span>Client: <strong>{c.clientName}</strong></span>
                      <span>Contractor: <strong>{c.freelancerName}</strong></span>
                    </div>

                    {c.status === 'completed' && (
                      <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', marginBottom: '14px', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                        100% Escrow Disbursed • All Milestones Verified
                      </div>
                    )}

                    {/* Admin Mediation Controls */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                      <button
                        className="btn-primary"
                        style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={() => {
                          setSelectedContractId(c.id);
                          setActiveView('contracts');
                        }}
                      >
                        <MessageSquare size={14} /> Open Workspace
                      </button>

                      {c.status !== 'completed' && (
                        <button
                          className="btn-success"
                          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                          onClick={() => adminUpdateContract(c.id, 'release_escrow', 'Admin released milestone escrow to freelancer.')}
                          title="Release escrow payment"
                        >
                          Release Escrow
                        </button>
                      )}

                      {c.status !== 'completed' && (
                        <button
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--accent-rose)' }}
                          onClick={() => adminUpdateContract(c.id, 'refund_client', 'Admin refunded escrow funds back to client.')}
                          title="Refund escrow to client"
                        >
                          Refund Client
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Proposals Table */}
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--accent-cyan)" />
              Platform Candidate Proposals ({bids.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bids.map((b) => {
                const targetGig = gigs.find((g) => String(g.id).trim() === String(b.gigId || (b as any).gig_id).trim());
                return (
                  <div
                    key={b.id}
                    className="glass-panel"
                    style={{
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={b.freelancerAvatar} alt={b.freelancerName} className="client-avatar-sm" style={{ width: 38, height: 38 }} />
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {b.freelancerName}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                          Bid on: "{targetGig?.title || 'Project'}" • {b.deliveryDays} Days delivery
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          background:
                            b.status === 'accepted'
                              ? 'rgba(16, 185, 129, 0.2)'
                              : b.status === 'rejected'
                              ? 'rgba(244, 63, 94, 0.2)'
                              : 'rgba(245, 158, 11, 0.2)',
                          color:
                            b.status === 'accepted'
                              ? 'var(--accent-emerald)'
                              : b.status === 'rejected'
                              ? 'var(--accent-rose)'
                              : 'var(--accent-amber)',
                        }}
                      >
                        {b.status.toUpperCase()}
                      </span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>
                        ${b.proposedPrice.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Financial Analytics */}
      {activeTab === 'analytics' && (
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Marketplace Volume & Treasury Health</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Escrow deposits are managed in dual-signatory multi-signature vaults with automated release upon client milestone approval.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PLATFORM TAKE RATE</span>
              <h2 style={{ color: 'var(--accent-primary)', marginTop: '6px' }}>5.0% Fixed</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Competitive take rate guaranteeing maximum retainment for top talent.
              </p>
            </div>

            <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DISBURSED ESCROW TO BUILDERS</span>
              <h2 style={{ color: 'var(--accent-emerald)', marginTop: '6px' }}>${adminStats.escrowReleased.toLocaleString()}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Total milestone payments successfully unlocked.
              </p>
            </div>

            <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CURRENTLY VAULT-LOCKED</span>
              <h2 style={{ color: 'var(--accent-cyan)', marginTop: '6px' }}>${adminStats.escrowLocked.toLocaleString()}</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Active escrow deposits in progress.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: User Governance Registry */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
              <input
                type="text"
                placeholder="Search registered members by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: '100%', maxWidth: '400px', fontSize: '0.85rem' }}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">All Roles</option>
                <option value="client">Clients</option>
                <option value="freelancer">Freelancers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {platformUsers.length} platform members
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {platformUsers.map((u: any) => (
              <div key={u.id} className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background:
                        u.role === 'admin'
                          ? 'rgba(245, 158, 11, 0.2)'
                          : u.role === 'client'
                          ? 'rgba(6, 182, 212, 0.2)'
                          : 'rgba(16, 185, 129, 0.2)',
                      color:
                        u.role === 'admin'
                          ? 'var(--accent-amber)'
                          : u.role === 'client'
                          ? 'var(--accent-cyan)'
                          : 'var(--accent-emerald)',
                    }}
                  >
                    {u.role.toUpperCase()}
                  </span>

                  {u.isVerified && (
                    <span className="featured-pill">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  )}
                </div>

                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                  {u.fullName}
                </strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
                  {u.email}
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <span>Rating: <strong>{u.rating} ★</strong></span>
                  <span>Activity: <strong>{u.count} {u.role === 'client' ? 'Gigs' : 'Bids'}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Customer & Freelancer Support Helpdesk */}
      {activeTab === 'tickets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Helpdesk Metrics Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            <div className="glass-panel" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL QUERIES</span>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', margin: '4px 0 0' }}>{tickets.length}</h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>All time submitted</span>
            </div>

            <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>AWAITING ACTION (OPEN)</span>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-rose)', margin: '4px 0 0' }}>
                {(tickets || []).filter((t) => t.status === 'open').length}
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-rose)' }}>Requires Admin reply</span>
            </div>

            <div className="glass-panel" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>IN PROGRESS</span>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)', margin: '4px 0 0' }}>
                {(tickets || []).filter((t) => t.status === 'in_progress').length}
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>Under active mediation</span>
            </div>

            <div className="glass-panel" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>RESOLVED</span>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-emerald)', margin: '4px 0 0' }}>
                {(tickets || []).filter((t) => t.status === 'resolved' || t.status === 'closed').length}
              </h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)' }}>Successfully closed</span>
            </div>

            <div className="glass-panel" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>BY STAKEHOLDER</span>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--accent-cyan)' }}>
                  <strong>{(tickets || []).filter((t) => t.userRole === 'client').length}</strong> Clients
                </span>
                <span>•</span>
                <span style={{ color: 'var(--accent-emerald)' }}>
                  <strong>{(tickets || []).filter((t) => t.userRole === 'freelancer').length}</strong> Freelancers
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '260px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search ticket #, subject, client/freelancer name, or content..."
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                style={{ flex: 1, minWidth: '220px', fontSize: '0.85rem' }}
              />

              <select
                value={ticketRoleFilter}
                onChange={(e) => setTicketRoleFilter(e.target.value as any)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">All Stakeholders</option>
                <option value="client">Client Inquiries</option>
                <option value="freelancer">Freelancer Inquiries</option>
              </select>

              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value as any)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open (Needs Action)</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={ticketPriorityFilter}
                onChange={(e) => setTicketPriorityFilter(e.target.value as any)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={ticketCategoryFilter}
                onChange={(e) => setTicketCategoryFilter(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              >
                <option value="all">All Categories</option>
                <option value="payment_escrow">Payment & Escrow</option>
                <option value="contract_milestone">Milestone & Handover</option>
                <option value="verification">Trust & Verification</option>
                <option value="account_security">Account & Security</option>
                <option value="technical">Technical</option>
                <option value="general">General</option>
              </select>
            </div>

            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Showing {filteredAdminTickets.length} of {tickets.length} tickets
            </span>
          </div>

          {/* Master-Detail Split Workspace */}
          <div
            className="glass-panel"
            style={{
              display: 'flex',
              minHeight: '620px',
              maxHeight: '750px',
              padding: 0,
              overflow: 'hidden',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {/* Left Column: Tickets Queue */}
            <div
              style={{
                width: '380px',
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(7, 13, 24, 0.6)',
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Support Ticket Stream</span>
                <span style={{ color: 'var(--accent-cyan)' }}>{filteredAdminTickets.length}</span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {filteredAdminTickets.length === 0 ? (
                  <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={36} style={{ color: 'var(--accent-emerald)', margin: '0 auto 12px' }} />
                    <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.9rem' }}>
                      No Matching Tickets
                    </strong>
                    <p style={{ fontSize: '0.78rem', margin: '4px 0' }}>
                      Adjust your filters or search query to find inquiries.
                    </p>
                  </div>
                ) : (
                  filteredAdminTickets.map((tck) => {
                    const isSelected = selectedAdminTicket?.id === tck.id;
                    const catInfo = getAdminCategoryLabel(tck.category);
                    const pBadge = getAdminPriorityBadge(tck.priority);
                    const stBadge = getAdminStatusBadge(tck.status);

                    return (
                      <div
                        key={tck.id}
                        onClick={() => setSelectedAdminTicketId(tck.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)'
                            : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected
                            ? '1px solid var(--accent-primary)'
                            : '1px solid rgba(255, 255, 255, 0.04)',
                          marginBottom: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                              {tck.ticketNumber}
                            </span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-full)',
                                background: tck.userRole === 'client' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                color: tck.userRole === 'client' ? 'var(--accent-cyan)' : 'var(--accent-emerald)',
                                fontWeight: 800,
                              }}
                            >
                              {tck.userRole.toUpperCase()}
                            </span>
                          </div>

                          <span
                            style={{
                              fontSize: '0.65rem',
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <img
                            src={tck.userAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                            alt={tck.userName}
                            style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {tck.userName}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            {new Date(tck.updatedAt || tck.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <strong
                          style={{
                            fontSize: '0.85rem',
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
                              fontWeight: 700,
                            }}
                          >
                            {stBadge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Ticket Detail, Governance Actions & Live Chat */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(10, 18, 32, 0.95)' }}>
              {selectedAdminTicket ? (
                <>
                  {/* Ticket Header & Governance Actions */}
                  <div
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                            {selectedAdminTicket.ticketNumber}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: selectedAdminTicket.userRole === 'client' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: selectedAdminTicket.userRole === 'client' ? 'var(--accent-cyan)' : 'var(--accent-emerald)',
                              fontWeight: 800,
                            }}
                          >
                            {selectedAdminTicket.userRole.toUpperCase()} INQUIRY
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: getAdminCategoryLabel(selectedAdminTicket.category).color + '20',
                              color: getAdminCategoryLabel(selectedAdminTicket.category).color,
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {getAdminCategoryLabel(selectedAdminTicket.category).icon}
                            {getAdminCategoryLabel(selectedAdminTicket.category).label}
                          </span>
                        </div>

                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                          {selectedAdminTicket.subject}
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          <span>
                            Requester: <strong style={{ color: 'var(--text-secondary)' }}>{selectedAdminTicket.userName}</strong> ({selectedAdminTicket.userEmail})
                          </span>
                          {selectedAdminTicket.contractId && (
                            <button
                              onClick={() => {
                                setSelectedContractId(selectedAdminTicket.contractId || null);
                                setActiveView('contracts');
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent-cyan)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: 0,
                                fontSize: '0.78rem',
                              }}
                              title="Inspect contract workspace"
                            >
                              <ExternalLink size={12} /> Inspect Contract #{selectedAdminTicket.contractId.slice(-6)}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Admin Quick Controls */}
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                            Status
                          </label>
                          <select
                            value={selectedAdminTicket.status}
                            onChange={(e) => adminUpdateTicket(selectedAdminTicket.id, { status: e.target.value as TicketStatus })}
                            style={{
                              fontSize: '0.78rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: getAdminStatusBadge(selectedAdminTicket.status).color,
                              border: '1px solid var(--border-medium)',
                            }}
                          >
                            <option value="open">Open (Needs Attention)</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                            Priority
                          </label>
                          <select
                            value={selectedAdminTicket.priority}
                            onChange={(e) => adminUpdateTicket(selectedAdminTicket.id, { priority: e.target.value as TicketPriority })}
                            style={{
                              fontSize: '0.78rem',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: getAdminPriorityBadge(selectedAdminTicket.priority).color,
                              border: '1px solid var(--border-medium)',
                            }}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Admin Internal Memo Section */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Internal Admin Notes (e.g. Verified bank UTR proof against escrow balance)..."
                        value={adminNotesDraft}
                        onChange={(e) => setAdminNotesDraft(e.target.value)}
                        style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px', background: 'rgba(0,0,0,0.2)' }}
                      />
                      <button
                        onClick={handleSaveAdminNotes}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      >
                        Save Note
                      </button>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {(selectedAdminTicket.messages || []).map((msg) => {
                      const isAdmin = msg.senderRole === 'admin' || msg.senderId === 'admin-master-node' || msg.senderId === currentUser?.id;
                      const isBot = msg.senderRole === 'support_agent' || msg.senderId === 'system-support-bot';

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            gap: '12px',
                            alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            flexDirection: isAdmin ? 'row-reverse' : 'row',
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
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: isAdmin ? '2px solid var(--accent-amber)' : '2px solid var(--accent-cyan)',
                            }}
                          />

                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '4px',
                                flexDirection: isAdmin ? 'row-reverse' : 'row',
                              }}
                            >
                              <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                {isAdmin ? 'Platform Governance Admin' : msg.senderName}
                              </strong>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--radius-full)',
                                  background: isAdmin ? 'rgba(245, 158, 11, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                                  color: isAdmin ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                                  fontWeight: 700,
                                }}
                              >
                                {isAdmin ? 'ADMIN CONSOLE' : isBot ? 'SUPPORT BOT' : msg.senderRole?.toUpperCase() || 'USER'}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div
                              style={{
                                padding: '10px 14px',
                                borderRadius: 'var(--radius-md)',
                                background: isAdmin
                                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)'
                                  : 'rgba(255, 255, 255, 0.04)',
                                border: isAdmin
                                  ? '1px solid rgba(245, 158, 11, 0.3)'
                                  : '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem',
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {msg.content}

                              {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {msg.attachments.map((attUrl, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => setTicketLightboxImage(attUrl)}
                                      style={{ cursor: 'pointer', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-medium)' }}
                                      title="Click to view full screenshot"
                                    >
                                      <img src={attUrl} alt="Screenshot" style={{ width: 120, height: 80, objectFit: 'cover', display: 'block' }} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={adminMessagesEndRef} />
                  </div>

                  {/* Preset Response Quick Chips */}
                  <div
                    style={{
                      padding: '8px 16px',
                      borderTop: '1px solid var(--border-subtle)',
                      background: 'rgba(10, 18, 32, 0.8)',
                      display: 'flex',
                      gap: '8px',
                      overflowX: 'auto',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center', whiteSpace: 'nowrap' }}>
                      Quick Templates:
                    </span>
                    {[
                      '✅ Payment proof verified. Escrow milestone release is authorized.',
                      '📋 Please upload a clear screenshot of your bank transaction reference/UTR code.',
                      '⭐ Your Verified Pro credentials & portfolio have been audited and approved.',
                      '🛡️ Escrow dispute has been investigated. Platform mediation decision recorded.',
                    ].map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAdminReplyText(tpl)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tpl.slice(0, 32)}...
                      </button>
                    ))}
                  </div>

                  {/* Admin Reply Form */}
                  <form
                    onSubmit={handleSendAdminReply}
                    style={{
                      padding: '14px 20px',
                      borderTop: '1px solid var(--border-subtle)',
                      background: 'rgba(5, 10, 18, 0.98)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {adminReplyAttachment && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                        <img src={adminReplyAttachment} alt="Attachment" style={{ width: 32, height: 32, borderRadius: '4px', objectFit: 'cover' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>Audit image attached</span>
                        <button type="button" onClick={() => setAdminReplyAttachment(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', marginLeft: 'auto' }}>
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="file"
                        ref={adminReplyFileInputRef}
                        style={{ display: 'none' }}
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleAdminFileUpload}
                      />
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => adminReplyFileInputRef.current?.click()}
                        style={{ padding: '8px 10px', color: 'var(--accent-amber)' }}
                        title="Attach Screenshot / Audit File"
                      >
                        <Paperclip size={18} />
                      </button>

                      <input
                        type="text"
                        className="input-field"
                        placeholder="Respond officially as Platform Governance Administrator..."
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        style={{ flex: 1 }}
                      />

                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSendingAdminReply || (!adminReplyText.trim() && !adminReplyAttachment)}
                        style={{
                          padding: '8px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'linear-gradient(135deg, var(--accent-amber) 0%, var(--accent-primary) 100%)',
                          color: '#000',
                          fontWeight: 700,
                        }}
                      >
                        <Send size={15} />
                        <span>Send Response</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', padding: '24px' }}>
                  <LifeBuoy size={48} style={{ color: 'var(--accent-amber)', marginBottom: '16px' }} />
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>Select an Inquiry to Review</h4>
                  <p style={{ maxWidth: '360px', textAlign: 'center', fontSize: '0.85rem' }}>
                    Choose any support inquiry from the left queue to respond, inspect payment proofs, or resolve doubts.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Admin Helpdesk Screenshots */}
      {ticketLightboxImage && (
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
          onClick={() => setTicketLightboxImage(null)}
        >
          <img
            src={ticketLightboxImage}
            alt="Expanded view"
            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}
          />
          <button
            onClick={() => setTicketLightboxImage(null)}
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

      {/* Scope Detail Modal */}
      {selectedGigId && <GigDetailModal />}
    </div>
  );
};

