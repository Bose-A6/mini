import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import type { Gig } from '../../types';
import { GigDetailModal } from '../Marketplace/GigDetailModal';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    verifications,
    contracts,
    gigs,
    bids,
    adminStats,
    reviewVerification,
    adminUpdateGig,
    adminUpdateContract,
    refreshGigs,
    isSyncingGigs,
    selectedGigId,
    setSelectedGigId,
    setSelectedContractId,
    setActiveView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'queue' | 'gigs' | 'proposals' | 'analytics' | 'users'>('queue');
  const [reviewComment, setReviewComment] = useState('');
  const [selectedVerifId, setSelectedVerifId] = useState<string | null>(null);

  // Search & Filter state for Gigs tab
  const [gigSearch, setGigSearch] = useState('');
  const [gigStatusFilter, setGigStatusFilter] = useState<'all' | 'open' | 'awarded' | 'completed'>('all');

  // Search state for Users tab
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'client' | 'freelancer' | 'admin'>('all');

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
      const matchesStatus = gigStatusFilter === 'all' || (g.status || 'open') === gigStatusFilter;
      const matchesSearch =
        gigSearch === '' ||
        g.title.toLowerCase().includes(gigSearch.toLowerCase()) ||
        g.clientName.toLowerCase().includes(gigSearch.toLowerCase()) ||
        (g.tags || []).some((t) => t.toLowerCase().includes(gigSearch.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [gigs, gigStatusFilter, gigSearch]);

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
            <span className="persona-badge badge-admin">Platform Governance</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {currentUser ? `Master Console: ${currentUser.fullName}` : 'Admin Node Access'}
            </span>
          </div>
          <h2>Master Platform Governance & Audit Hub</h2>
          <p>Real-time verification queue, project scope oversight, escrow treasury mediation, and user registry.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn-secondary"
            onClick={() => refreshGigs()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Fetch Fresh Records from Backend"
          >
            <RefreshCw size={15} className={isSyncingGigs ? 'spin-icon' : ''} />
            <span>{isSyncingGigs ? 'Syncing Backend...' : 'Live Refresh'}</span>
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
            <Activity size={14} /> Real-Time Node Active
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Awaiting Audit</span>
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
          <ShieldCheck size={16} /> Freelancer Verification Queue ({pendingVerifs.length})
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
          <Users size={16} /> Proposals & Escrow Contracts ({contracts.length})
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
          <DollarSign size={16} /> Escrow Treasury Analytics
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
          <Users size={16} /> User Governance Registry ({platformUsers.length})
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
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      ADMIN AUDIT COMMENT / REASON:
                    </label>
                    <input
                      type="text"
                      placeholder="Add an optional comment regarding your audit decision..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      style={{ width: '100%', fontSize: '0.85rem' }}
                    />
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
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
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
                      <CheckCircle2 size={16} /> Approve & Grant Gold Badge
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
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background:
                            g.status === 'open'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : g.status === 'awarded'
                              ? 'rgba(99, 102, 241, 0.15)'
                              : 'rgba(148, 163, 184, 0.15)',
                          color:
                            g.status === 'open'
                              ? 'var(--accent-emerald)'
                              : g.status === 'awarded'
                              ? 'var(--accent-primary)'
                              : 'var(--text-muted)',
                          fontWeight: 700,
                        }}
                      >
                        {g.status.toUpperCase()}
                      </span>
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
            <h3 style={{ fontSize: '1.2rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} color="var(--accent-emerald)" />
              Active Escrow Contracts ({contracts.length})
            </h3>

            {contracts.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Lock size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h4>No Escrow Contracts Initialized</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  When clients accept freelancer proposals, smart escrow contracts appear here with mediation controls.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '18px' }}>
                {contracts.map((c) => (
                  <div key={c.id} className="glass-panel" style={{ padding: '24px' }}>
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
                        }}
                      >
                        {c.status.toUpperCase()}
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

      {/* Scope Detail Modal */}
      {selectedGigId && <GigDetailModal />}
    </div>
  );
};
