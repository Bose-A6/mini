import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Briefcase,
  PlusCircle,
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileCheck,
  XCircle,
  ExternalLink,
  Filter,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { GigDetailModal } from '../Marketplace/GigDetailModal';

export const ClientDashboard: React.FC = () => {
  const {
    currentUser,
    gigs,
    bids,
    contracts,
    categories,
    createGig,
    acceptBidAndCreateContract,
    declineBid,
    setActiveView,
    selectedGigId,
    setSelectedGigId,
    setSelectedContractId,
    setIsAuthModalOpen,
    setAuthMode,
    isSyncingGigs,
    refreshGigs,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'my-gigs' | 'proposals' | 'post-gig'>('my-gigs');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | 'open' | 'awarded' | 'completed'>('all');
  const [selectedGigFilter, setSelectedGigFilter] = useState<string>('all');

  // New Gig Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-ai');
  const [budgetMin, setBudgetMin] = useState(1500);
  const [budgetMax, setBudgetMax] = useState(3000);
  const [deadline, setDeadline] = useState('2026-11-15');
  const [tags, setTags] = useState('TypeScript, Next.js, Supabase');
  const [description, setDescription] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Client's gigs and proposals
  const clientGigs = useMemo(() => {
    if (!gigs || gigs.length === 0) return [];
    if (!currentUser) return gigs;
    const myGigs = gigs.filter(
      (g) =>
        String(g.clientId).trim() === String(currentUser.id).trim() ||
        g.clientName?.toLowerCase() === currentUser.fullName?.toLowerCase() ||
        g.clientId === 'client-1' ||
        g.clientId === 'client-2' ||
        g.clientId === 'client-verified' ||
        g.clientId === 'client-edge-lab' ||
        g.clientId.startsWith('client-')
    );
    return myGigs.length > 0 ? myGigs : gigs;
  }, [gigs, currentUser]);

  const filteredClientGigs = useMemo(() => {
    if (projectStatusFilter === 'all') return clientGigs;
    return clientGigs.filter((g) => (g.status || 'open') === projectStatusFilter);
  }, [clientGigs, projectStatusFilter]);

  const incomingBids = useMemo(() => {
    return (bids || []).filter((b) => {
      const isPending = (b.status || 'pending') === 'pending';
      if (!isPending) return false;
      const cleanBidGigId = String(b.gigId || (b as any).gig_id || '').trim();
      
      if (selectedGigFilter !== 'all') {
        return cleanBidGigId === String(selectedGigFilter).trim();
      }

      // If viewing all, match gigs owned by this client
      const matchingGig = (gigs || []).find((g) => String(g.id).trim() === cleanBidGigId);
      if (currentUser && matchingGig) {
        return String(matchingGig.clientId).trim() === String(currentUser.id).trim() ||
               matchingGig.clientName?.toLowerCase() === currentUser.fullName?.toLowerCase() ||
               clientGigs.some((cg) => String(cg.id).trim() === String(matchingGig.id).trim());
      }
      return true;
    });
  }, [bids, selectedGigFilter, currentUser, gigs, clientGigs]);

  const activeContracts = useMemo(() => {
    return (contracts || []).filter((c) => (currentUser && String(c.clientId).trim() === String(currentUser.id).trim()) || !currentUser);
  }, [contracts, currentUser]);

  // AI Scope Generator (assists real clients to write structured briefs)
  const handleAiScopeGen = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      setTitle('Architect Autonomous Multi-Modal RAG Platform with Next.js 15 & Supabase Vector');
      setDescription(
        `We are seeking a seasoned Principal Full-Stack & AI Engineer to design and deploy an end-to-end Enterprise RAG platform.\n\nKey Deliverables:\n1. Supabase pgvector embedding pipelines with hybrid sparse/dense search.\n2. Next.js 15 App Router interface with streaming token response & optimistic state caching.\n3. Row Level Security (RLS) policies ensuring strict enterprise data tenant isolation.\n4. Comprehensive Jest integration tests and GitHub Actions CI/CD deployment.`
      );
      setBudgetMin(3500);
      setBudgetMax(5000);
      setTags('Next.js 15, TypeScript, Supabase, pgvector, LangChain, TailwindCSS');
      setIsGeneratingAi(false);
      addToast('info', 'AI Scope Generated ✨', 'Project brief template populated for your adjustments.');
    }, 400);
  };

  const handlePostGig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      addToast('warning', 'Missing Fields', 'Please fill in title and project brief.');
      return;
    }

    const cat = categories.find((c) => c.id === categoryId) || categories[0];
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);

    createGig({
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      categoryId: cat.slug || cat.id,
      categoryName: cat.name,
      budgetMin,
      budgetMax,
      deadline,
      referenceFiles: [],
      tags: tagList,
      isFeatured: false,
      suggestedMilestones: [
        { title: 'System Architecture & Schema Design', amount: Math.round(budgetMin * 0.3) },
        { title: 'Core Functionality & API Integration', amount: Math.round(budgetMin * 0.4) },
        { title: 'Production Polish, Testing & Deployment', amount: Math.round(budgetMin * 0.3) },
      ],
    });

    setTitle('');
    setDescription('');
    setActiveTab('my-gigs');
  };

  const handleHire = (bidId: string) => {
    const contract = acceptBidAndCreateContract(bidId);
    if (contract) {
      setSelectedContractId(contract.id);
      setActiveView('contracts');
    }
  };

  const selectedGigFilterTitle = useMemo(() => {
    if (selectedGigFilter === 'all') return null;
    return gigs.find((g) => String(g.id).trim() === String(selectedGigFilter).trim())?.title;
  }, [gigs, selectedGigFilter]);

  return (
    <div className="app-container">
      {/* Header Summary */}
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
            <span className="persona-badge badge-client">Client Command Center</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {currentUser ? `Signed in: ${currentUser.fullName}` : 'Client Workspace'}
            </span>
          </div>
          <h2>Enterprise Hiring & Escrow Hub</h2>
          <p>Publish project scopes, review incoming freelancer proposals, and fund milestone contracts.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {!currentUser && (
            <button
              className="btn-secondary"
              onClick={() => {
                setAuthMode('login');
                setIsAuthModalOpen(true);
              }}
            >
              Sign In to Post Gigs
            </button>
          )}
          <button
            className="btn-secondary"
            onClick={() => refreshGigs()}
            title="Fetch Latest Proposals"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={isSyncingGigs ? 'spin-icon' : ''} />
            <span>{isSyncingGigs ? 'Syncing...' : 'Live Sync'}</span>
          </button>
          <button className="btn-primary" onClick={() => setActiveTab('post-gig')}>
            <PlusCircle size={18} /> Post New Project
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
          marginBottom: '32px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active Posted Projects
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>{clientGigs.length}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Gigs Live</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Proposals Under Review
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--accent-amber)' }}>{incomingBids.length}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Awaiting Decision</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active Escrow Contracts
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--accent-emerald)' }}>{activeContracts.length}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>In Progress</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Escrow Allocated
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>
              ${activeContracts.reduce((acc, c) => acc + (c.amount || 0), 0).toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
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
          className={`btn-ghost ${activeTab === 'my-gigs' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-gigs')}
          style={{
            borderBottom: activeTab === 'my-gigs' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'my-gigs' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            whiteSpace: 'nowrap',
          }}
        >
          <Briefcase size={16} /> My Projects & Contracts ({clientGigs.length})
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
          <Users size={16} /> Proposals War Room ({incomingBids.length})
        </button>

        <button
          className={`btn-ghost ${activeTab === 'post-gig' ? 'active' : ''}`}
          onClick={() => setActiveTab('post-gig')}
          style={{
            borderBottom: activeTab === 'post-gig' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'post-gig' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={16} /> Post Project
        </button>
      </div>

      {/* TAB 1: Proposals War Room */}
      {activeTab === 'proposals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--accent-primary)" />
                Incoming Candidate Proposals ({incomingBids.length})
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Review incoming rate pitches and milestone breakdowns from verified engineers.
              </p>
            </div>

            <button
              className="btn-secondary"
              onClick={() => refreshGigs()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <RefreshCw size={14} className={isSyncingGigs ? 'spin-icon' : ''} />
              <span>{isSyncingGigs ? 'Syncing Bids...' : 'Refresh Proposals'}</span>
            </button>
          </div>

          {/* Gig filter indicator */}
          {selectedGigFilterTitle && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={16} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
                  Showing proposals for: <strong>"{selectedGigFilterTitle}"</strong>
                </span>
              </div>
              <button
                className="btn-ghost"
                style={{ padding: '4px 10px', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}
                onClick={() => setSelectedGigFilter('all')}
              >
                Clear Filter (Show All)
              </button>
            </div>
          )}

          {incomingBids.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>No proposals awaiting decision</h3>
              <p style={{ maxWidth: '420px', margin: '8px auto 20px' }}>
                {selectedGigFilter !== 'all'
                  ? 'No pending proposals found for this specific project.'
                  : 'When freelancers submit proposals for your projects, they will appear here with budgets, delivery days, and milestone breakdowns.'}
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {selectedGigFilter !== 'all' && (
                  <button className="btn-secondary" onClick={() => setSelectedGigFilter('all')}>
                    View All Proposals
                  </button>
                )}
                <button className="btn-primary" onClick={() => setActiveTab('post-gig')}>
                  <PlusCircle size={16} /> Post a Project
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
              {incomingBids.map((bid) => {
                const targetGig = (gigs || []).find((g) => String(g.id).trim() === String(bid.gigId || (bid as any).gig_id).trim());
                return (
                  <div
                    key={bid.id}
                    className="glass-panel"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(99, 102, 241, 0.25)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
                          PROJECT: {targetGig?.title ? targetGig.title.slice(0, 36) + '...' : 'Client Project'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(bid.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <img src={bid.freelancerAvatar} alt={bid.freelancerName} className="client-avatar-sm" style={{ width: 44, height: 44 }} />
                        <div>
                          <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {bid.freelancerName}
                            {bid.isVerified && <CheckCircle2 size={15} color="var(--accent-emerald)" />}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {bid.freelancerTitle} • {bid.freelancerRating ?? 5.0} ★ ({bid.freelancerCompletedOrders ?? 0} completed)
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                        <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                          "{bid.coverMessage}"
                        </p>
                      </div>

                      {bid.milestones && bid.milestones.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                            PROPOSED MILESTONES:
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {bid.milestones.map((m, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '4px 8px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.02)' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{idx + 1}. {m.title}</span>
                                <strong style={{ color: 'var(--accent-emerald)' }}>${m.amount.toLocaleString()}</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', marginTop: '16px', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL PROPOSAL</span>
                        <strong style={{ fontSize: '1.4rem', color: 'var(--accent-emerald)' }}>
                          ${bid.proposedPrice.toLocaleString()}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          Delivery in {bid.deliveryDays} Days
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                          onClick={() => declineBid(bid.id)}
                        >
                          <XCircle size={15} /> Decline
                        </button>

                        <button
                          className="btn-success"
                          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                          onClick={() => handleHire(bid.id)}
                        >
                          <CheckCircle2 size={16} /> Hire & Fund Escrow
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Post Project */}
      {activeTab === 'post-gig' && (
        <div className="glass-panel" style={{ padding: '36px', maxWidth: '850px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Publish New Project Scope</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                Specify your technical requirements, deliverables, budget range, and timeline to receive candidate proposals.
              </p>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleAiScopeGen}
              disabled={isGeneratingAi}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={15} color="var(--accent-amber)" />
              <span>{isGeneratingAi ? 'Drafting...' : '✨ AI Brief Copilot'}</span>
            </button>
          </div>

          <form onSubmit={handlePostGig}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  PROJECT TITLE
                </label>
                <input
                  type="text"
                  placeholder="e.g. Design & Develop Real-Time Multi-Tenant SaaS Dashboard"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', fontSize: '1rem' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    INDUSTRY SECTOR
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    TARGET COMPLETION DEADLINE
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    MINIMUM BUDGET ($ USD)
                  </label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(Number(e.target.value))}
                    style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    MAXIMUM BUDGET ($ USD)
                  </label>
                  <input
                    type="number"
                    min={budgetMin}
                    step={100}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  REQUIRED SKILLS & TAGS (COMMA SEPARATED)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next.js 15, TypeScript, Supabase, TailwindCSS, Figma"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  DETAILED PROJECT BRIEF & ACCEPTANCE CRITERIA
                </label>
                <textarea
                  rows={8}
                  placeholder="Describe project background, deliverables, expected architectures, and acceptance criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setActiveTab('my-gigs')}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <PlusCircle size={18} /> Publish Real Project
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: My Projects & Active Contracts */}
      {activeTab === 'my-gigs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeContracts.length > 0 && (
            <>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} color="var(--accent-emerald)" />
                Active Contracts in Escrow ({activeContracts.length})
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                {activeContracts.map((c) => (
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
                        STATUS: {c.status.toUpperCase()}
                      </span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--accent-emerald)' }}>
                        ${c.amount.toLocaleString()}
                      </strong>
                    </div>

                    <h4 style={{ fontSize: '1rem', marginBottom: '12px', lineHeight: 1.4 }}>
                      {c.gigTitle}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <img src={c.freelancerAvatar} alt={c.freelancerName} className="client-avatar-sm" />
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.freelancerName}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Hired Contractor</span>
                      </div>
                    </div>

                    <button
                      className="btn-primary"
                      style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onClick={() => {
                        setSelectedContractId(c.id);
                        setActiveView('contracts');
                      }}
                    >
                      <MessageSquare size={16} />
                      <span>Open Contract & Chat with Freelancer</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Posted Gigs Header & Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Briefcase size={18} color="var(--accent-cyan)" />
              Posted Projects ({clientGigs.length})
            </h3>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'open', 'awarded', 'completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setProjectStatusFilter(st)}
                  className={`btn-ghost ${projectStatusFilter === st ? 'active' : ''}`}
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.8rem',
                    borderRadius: 'var(--radius-full)',
                    background: projectStatusFilter === st ? 'var(--accent-primary)' : 'rgba(255,255,255,0.04)',
                    color: projectStatusFilter === st ? 'white' : 'var(--text-muted)',
                  }}
                >
                  {st === 'all' ? 'All Projects' : st === 'open' ? 'Open for Bids' : st === 'awarded' ? 'In Escrow' : 'Completed'}
                </button>
              ))}
            </div>
          </div>

          {filteredClientGigs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center' }}>
              <Briefcase size={44} style={{ color: 'var(--text-muted)', marginBottom: '14px' }} />
              <h3>{projectStatusFilter === 'all' ? 'No projects posted yet' : `No ${projectStatusFilter} projects`}</h3>
              <p style={{ maxWidth: '400px', margin: '8px auto 18px' }}>
                Publish your project brief to begin receiving competitive bids from verified engineering and design talent.
              </p>
              <button className="btn-primary" onClick={() => setActiveTab('post-gig')}>
                <PlusCircle size={16} /> Post Project
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredClientGigs.map((g) => {
                const gigBids = (bids || []).filter(
                  (b) => String(b.gigId || (b as any).gig_id || '').trim() === String(g.id).trim() && (b.status || 'pending') === 'pending'
                );
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
                    <div style={{ maxWidth: '650px' }}>
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
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Posted {new Date(g.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                        {g.title}
                      </strong>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '560px' }}>
                        {g.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '1.15rem', color: 'var(--accent-emerald)', display: 'block' }}>
                          ${g.budgetMin.toLocaleString()} - ${g.budgetMax.toLocaleString()}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {gigBids.length} pending bids
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-ghost"
                          style={{ padding: '8px 12px', fontSize: '0.8rem', border: '1px solid var(--border-subtle)' }}
                          onClick={() => setSelectedGigId(g.id)}
                          title="View project scope details"
                        >
                          <ExternalLink size={14} /> Scope
                        </button>

                        <button
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                          onClick={() => {
                            setSelectedGigFilter(g.id);
                            setActiveTab('proposals');
                          }}
                        >
                          <Users size={15} />
                          <span>Review Bids ({gigBids.length})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Gig Scope Detail Modal */}
      {selectedGigId && (
        <GigDetailModal />
      )}
    </div>
  );
};
