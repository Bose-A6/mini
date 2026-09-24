import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Briefcase,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  ShieldCheck,
  Send,
  UploadCloud,
  Search,
  Sparkles,
  Users,
  Code,
  Palette,
  Server,
  Smartphone,
  Cpu,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { GigDetailModal } from '../Marketplace/GigDetailModal';

export const FreelancerDashboard: React.FC = () => {
  const {
    currentUser,
    gigs,
    bids,
    contracts,
    categories,
    submitDeliverable,
    setActiveView,
    setSelectedGigId,
    selectedGigId,
    setSelectedContractId,
    setIsAuthModalOpen,
    setAuthMode,
    isSyncingGigs,
    refreshGigs,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'available-gigs' | 'contracts' | 'proposals' | 'earnings'>('available-gigs');

  // Search & Filter for Available Gigs tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxBudgetFilter, setMaxBudgetFilter] = useState<number>(15000);
  const [sortBy, setSortBy] = useState<'newest' | 'budget_high' | 'proposals'>('newest');

  // Deliverable modal state
  const [activeDeliverableContractId, setActiveDeliverableContractId] = useState<string | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [deliverableTitle, setDeliverableTitle] = useState<string>('');
  const [deliverableDesc, setDeliverableDesc] = useState<string>('');
  const [liveUrl, setLiveUrl] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');

  // Freelancer's items
  const myBids = (bids || []).filter((b) => (currentUser && b.freelancerId === currentUser.id) || !currentUser);
  const myContracts = (contracts || []).filter((c) => (currentUser && c.freelancerId === currentUser.id) || !currentUser);

  const openClientGigs = useMemo(() => {
    const targetCat = categories.find((c) => c.id === selectedCategory);
    return (gigs || [])
      .filter((gig) => {
        const gigStatus = gig.status || 'open';
        const matchesStatus = gigStatus === 'open';
        const matchesCategory =
          selectedCategory === 'all' ||
          gig.categoryId === selectedCategory ||
          (targetCat && (gig.categoryId === targetCat.slug || gig.categoryName?.toLowerCase().includes(targetCat.name.toLowerCase())));
        const matchesSearch =
          searchQuery === '' ||
          gig.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gig.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (gig.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const bMin = Number(gig.budgetMin ?? (gig as any).budget_min ?? 0);
        const matchesBudget = maxBudgetFilter >= 15000 || bMin <= maxBudgetFilter;

        return matchesCategory && matchesSearch && matchesBudget && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || (a as any).created_at || 0).getTime();
        const dateB = new Date(b.createdAt || (b as any).created_at || 0).getTime();
        if (sortBy === 'newest') {
          return dateB - dateA;
        }
        if (sortBy === 'budget_high') {
          const maxA = Number(a.budgetMax ?? (a as any).budget_max ?? 0);
          const maxB = Number(b.budgetMax ?? (b as any).budget_max ?? 0);
          return maxB - maxA;
        }
        if (sortBy === 'proposals') {
          return (a.proposalsCount || 0) - (b.proposalsCount || 0);
        }
        return 0;
      });
  }, [gigs, selectedCategory, categories, searchQuery, maxBudgetFilter, sortBy]);

  const totalInEscrow = myContracts
    .filter((c) => c.status === 'in_progress' || c.status === 'delivered')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  const totalEarned = currentUser?.totalEarned ?? 0;

  const handleSubmitDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeliverableContractId || !selectedMilestoneId || !deliverableTitle.trim() || !deliverableDesc.trim()) {
      addToast('warning', 'Missing Fields', 'Please select milestone and provide deliverable notes.');
      return;
    }

    submitDeliverable(
      activeDeliverableContractId,
      selectedMilestoneId,
      deliverableTitle,
      deliverableDesc,
      fileUrl ? [fileUrl] : [],
      liveUrl || undefined
    );

    setActiveDeliverableContractId(null);
    setDeliverableTitle('');
    setDeliverableDesc('');
  };

  const openDeliverableModal = (contractId: string, milestoneId: string) => {
    setActiveDeliverableContractId(contractId);
    setSelectedMilestoneId(milestoneId);
    setDeliverableTitle('Sprint Deliverable Submission');
    setDeliverableDesc('Completed milestone deliverables ready for client verification.');
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'ai-ml':
        return <Sparkles size={16} />;
      case 'fullstack':
        return <Code size={16} />;
      case 'ui-ux':
        return <Palette size={16} />;
      case 'cloud-devops':
        return <Server size={16} />;
      case 'mobile-apps':
        return <Smartphone size={16} />;
      case 'web3':
        return <Cpu size={16} />;
      default:
        return <Briefcase size={16} />;
    }
  };

  return (
    <div className="app-container">
      {/* Header Profile Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src={currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=freelancer'}
            alt="Freelancer"
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-emerald)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="persona-badge badge-freelancer">Freelancer Engineering Suite</span>
              {currentUser?.isVerified && (
                <span className="featured-pill">
                  <ShieldCheck size={12} /> Gold Verified Pro
                </span>
              )}
            </div>
            <h2>{currentUser?.fullName || 'Freelancer Workspace'}</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {currentUser?.professionalTitle || 'Real-time Freelancer Hub'} • {currentUser?.rating ?? 5.0} ★ ({currentUser?.completedProjects ?? 0} projects completed)
            </p>
          </div>
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
              Sign In to Save Progress
            </button>
          )}
          <button
            className="btn-secondary"
            onClick={() => refreshGigs()}
            title="Fetch Latest Client Postings"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={isSyncingGigs ? 'spin-icon' : ''} />
            <span>{isSyncingGigs ? 'Syncing...' : 'Live Sync'}</span>
          </button>
          <button className="btn-secondary" onClick={() => setActiveView('verification')}>
            <ShieldCheck size={16} /> Trust & Verification Center
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setActiveTab('available-gigs');
              setTimeout(() => {
                document.getElementById('freelancer-gigs-feed')?.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
          >
            <Sparkles size={16} /> Explore Available Gigs ({gigs.filter((g) => (g.status || 'open') === 'open').length})
          </button>
        </div>
      </div>

      {/* Role Guideline Banner */}
      <div
        style={{
          padding: '14px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={18} color="var(--accent-emerald)" />
          <span style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
            <strong>Freelancer Workspace:</strong> Browse open client projects below, submit competitive proposals with milestone breakdowns, and build escrow contracts upon acceptance.
          </span>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.2)',
            color: 'var(--accent-emerald)',
            fontWeight: 700,
          }}
        >
          {openClientGigs.length} Open Opportunities Live
        </span>
      </div>

      {/* Financial Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Open Client Opportunities
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--accent-primary)' }}>
              {gigs.filter((g) => g.status === 'open').length}
            </strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Live to Apply</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Submitted Proposals
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--accent-amber)' }}>{myBids.length}</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bids Sent</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active Contract Orders
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>{myContracts.length}</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>In Progress</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Locked in Active Escrow
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--accent-cyan)' }}>
              ${totalInEscrow.toLocaleString()}
            </strong>
          </div>
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
          className={`btn-ghost ${activeTab === 'available-gigs' ? 'active' : ''}`}
          onClick={() => setActiveTab('available-gigs')}
          style={{
            borderBottom: activeTab === 'available-gigs' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'available-gigs' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 700,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={16} color="var(--accent-emerald)" /> Available Client Projects ({openClientGigs.length})
        </button>

        <button
          className={`btn-ghost ${activeTab === 'proposals' ? 'active' : ''}`}
          onClick={() => setActiveTab('proposals')}
          style={{
            borderBottom: activeTab === 'proposals' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'proposals' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <Send size={16} /> My Submitted Proposals ({myBids.length})
        </button>

        <button
          className={`btn-ghost ${activeTab === 'contracts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contracts')}
          style={{
            borderBottom: activeTab === 'contracts' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'contracts' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <FileCheck2 size={16} /> Active Contracts & Deliverables ({myContracts.length})
        </button>

        <button
          className={`btn-ghost ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
          style={{
            borderBottom: activeTab === 'earnings' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'earnings' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <TrendingUp size={16} /> Financial Balance
        </button>
      </div>

      {/* TAB 1: Available Client Projects & Gigs Feed */}
      {activeTab === 'available-gigs' && (
        <div id="freelancer-gigs-feed" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Category Filter Bar */}
          <div className="categories-bar" style={{ marginBottom: '12px' }}>
            <button
              className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <TrendingUp size={16} />
              <span>All Sectors</span>
              <span className="category-count">{gigs.filter((g) => g.status === 'open').length}</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {getCategoryIcon(cat.slug)}
                <span>{cat.name}</span>
                <span className="category-count">{cat.gigCount}</span>
              </button>
            ))}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="filter-toolbar">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search open client projects by keyword, tech stack (e.g. Next.js, Python, Supabase, Figma)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <span>Max Budget:</span>
                <strong style={{ color: 'var(--accent-emerald)', minWidth: '60px' }}>
                  {maxBudgetFilter >= 15000 ? 'Any Budget' : `$${maxBudgetFilter.toLocaleString()}`}
                </strong>
                <input
                  type="range"
                  min={500}
                  max={15000}
                  step={500}
                  value={maxBudgetFilter}
                  onChange={(e) => setMaxBudgetFilter(Number(e.target.value))}
                  style={{ width: '120px', accentColor: 'var(--accent-emerald)' }}
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{ padding: '10px 14px', fontSize: '0.85rem' }}
              >
                <option value="newest">Sort: Newest Projects First</option>
                <option value="budget_high">Sort: Highest Budget</option>
                <option value="proposals">Sort: Lowest Competition</option>
              </select>

              <button
                className="btn-secondary"
                onClick={() => refreshGigs()}
                title="Fetch Latest Client Projects"
                style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} className={isSyncingGigs ? 'spin-icon' : ''} />
                <span>{isSyncingGigs ? 'Syncing...' : 'Refresh Feed'}</span>
              </button>
            </div>
          </div>

          {/* Gigs List Grid */}
          {openClientGigs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>No matching client projects found</h3>
              <p style={{ maxWidth: '420px', margin: '8px auto 20px' }}>
                Try adjusting your search keywords or budget filter to discover more client opportunities.
              </p>
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setMaxBudgetFilter(15000);
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="gigs-grid">
              {openClientGigs.map((gig) => {
                const hasApplied = myBids.some((b) => b.gigId === gig.id);
                const isNew = new Date(gig.createdAt).getTime() > Date.now() - 2 * 86400000;

                return (
                  <div key={gig.id} className="glass-panel gig-card">
                    <div>
                      <div className="gig-card-header">
                        <div className="gig-client-info">
                          <img src={gig.clientAvatar} alt={gig.clientName} className="client-avatar-sm" />
                          <div className="client-name-meta">
                            <strong>
                              {gig.clientName}
                              {gig.clientVerified && (
                                <CheckCircle2 size={13} color="var(--accent-emerald)" style={{ display: 'inline', marginLeft: 4 }} />
                              )}
                            </strong>
                            <span>{gig.clientCompany || 'Enterprise Client'}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isNew && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-full)',
                                background: 'rgba(6, 182, 212, 0.2)',
                                color: 'var(--accent-cyan)',
                                fontWeight: 800,
                              }}
                            >
                              ⚡ New Posting
                            </span>
                          )}
                          {hasApplied && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '3px 8px',
                                borderRadius: 'var(--radius-full)',
                                background: 'rgba(99, 102, 241, 0.2)',
                                color: 'var(--accent-primary)',
                                fontWeight: 700,
                              }}
                            >
                              ✓ Applied
                            </span>
                          )}
                          {gig.isFeatured && (
                            <span className="featured-pill">
                              <Sparkles size={11} /> Featured
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          {gig.categoryName}
                        </span>
                      </div>

                      <h3 className="gig-title" title={gig.title}>
                        {gig.title}
                      </h3>

                      <p className="gig-desc">{gig.description}</p>

                      <div className="gig-tags">
                        {(gig.tags || []).slice(0, 4).map((tag) => (
                          <span key={tag} className="tag-badge">
                            {tag}
                          </span>
                        ))}
                        {(gig.tags || []).length > 4 && (
                          <span className="tag-badge">+{(gig.tags || []).length - 4}</span>
                        )}
                      </div>
                    </div>

                    <div className="gig-footer">
                      <div className="gig-budget">
                        <span className="budget-amount" style={{ color: 'var(--accent-emerald)' }}>
                          ${gig.budgetMin.toLocaleString()} - ${gig.budgetMax.toLocaleString()}
                        </span>
                        <span className="budget-type">
                          <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
                          {gig.proposalsCount || 0} proposals • {new Date(gig.deadline).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        className="btn-primary"
                        style={{ padding: '9px 18px', fontSize: '0.85rem' }}
                        onClick={() => setSelectedGigId(gig.id)}
                      >
                        <span>{hasApplied ? 'View Proposal' : '⚡ Send Request / Proposal'}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Submitted Proposals */}
      {activeTab === 'proposals' && (
        <div>
          {myBids.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Send size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>No proposals submitted yet</h3>
              <p style={{ maxWidth: '400px', margin: '8px auto 20px' }}>
                Browse the available client projects above and submit your first proposal to win contracts.
              </p>
              <button className="btn-primary" onClick={() => setActiveTab('available-gigs')}>
                <Sparkles size={16} /> Browse Client Projects
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
              {myBids.map((bid) => {
                const targetGig = (gigs || []).find((g) => g.id === bid.gigId);
                return (
                  <div key={bid.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span className="persona-badge badge-client">
                          {targetGig?.categoryName || 'General'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            background: bid.status === 'accepted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: bid.status === 'accepted' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                          }}
                        >
                          STATUS: {bid.status.toUpperCase()}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--text-primary)' }}>
                        {targetGig?.title || 'Custom Project Scope'}
                      </h4>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                        "{bid.coverMessage.slice(0, 160)}..."
                      </p>

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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>YOUR BID:</span>
                        <strong style={{ fontSize: '1.3rem', color: 'var(--accent-emerald)', display: 'block' }}>
                          ${bid.proposedPrice.toLocaleString()}
                        </strong>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                          {bid.deliveryDays} Days Delivery
                        </span>
                        {targetGig && (
                          <button
                            className="btn-ghost"
                            style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}
                            onClick={() => setSelectedGigId(targetGig.id)}
                          >
                            View Scope & Modal →
                          </button>
                        )}
                      </div>
                    </div>

                    {bid.status === 'accepted' && (
                      <button
                        className="btn-primary"
                        style={{
                          width: '100%',
                          marginTop: '14px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                        }}
                        onClick={() => {
                          const targetContract = (contracts || []).find((c) => c.gigId === bid.gigId || c.id.includes(bid.id));
                          if (targetContract) {
                            setSelectedContractId(targetContract.id);
                          }
                          setActiveView('contracts');
                        }}
                      >
                        <MessageSquare size={16} />
                        <span>Proposal Accepted! Open Contract & Chat with Client</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Active Contracts & Deliverable Studio */}
      {activeTab === 'contracts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {myContracts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <FileCheck2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>No active contracts yet</h3>
              <p style={{ maxWidth: '420px', margin: '8px auto 20px' }}>
                Browse open client opportunities and submit proposals to win projects and begin escrow contracts.
              </p>
              <button className="btn-primary" onClick={() => setActiveTab('available-gigs')}>
                <Sparkles size={16} /> Browse Open Client Gigs
              </button>
            </div>
          ) : (
            myContracts.map((contract) => (
              <div key={contract.id} className="glass-panel" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="persona-badge badge-client">CLIENT: {contract.clientName}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Started {new Date(contract.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{contract.gigTitle}</h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL ESCROW FUNDED</span>
                    <strong style={{ fontSize: '1.4rem', color: 'var(--accent-emerald)' }}>
                      ${contract.amount.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Milestones Stepper */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Project Milestones & Deliverables
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(contract.milestones || []).map((m, idx) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          borderRadius: 'var(--radius-md)',
                          background: m.status === 'approved' ? 'rgba(16, 185, 129, 0.06)' : m.status === 'submitted' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: m.status === 'approved' ? '1px solid rgba(16, 185, 129, 0.3)' : m.status === 'submitted' ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid var(--border-subtle)',
                          flexWrap: 'wrap',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: m.status === 'approved' ? 'var(--accent-emerald)' : m.status === 'submitted' ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                            }}
                          >
                            {m.status === 'approved' ? <CheckCircle2 size={16} /> : idx + 1}
                          </span>
                          <div>
                            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>
                              {m.title}
                            </strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Status: {m.status.toUpperCase()} • Due {m.deadline || 'Soon'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <strong style={{ color: 'var(--accent-emerald)', fontSize: '1.1rem' }}>
                            ${m.amount.toLocaleString()}
                          </strong>

                          {m.status === 'in_progress' && (
                            <button
                              className="btn-primary"
                              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                              onClick={() => openDeliverableModal(contract.id, m.id)}
                            >
                              <UploadCloud size={15} /> Submit Deliverable
                            </button>
                          )}

                          {m.status === 'submitted' && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                              Under Client Review ⏳
                            </span>
                          )}

                          {m.status === 'approved' && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                              Payment Unlocked ✅
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => {
                      setSelectedContractId(contract.id);
                      setActiveView('contracts');
                    }}
                  >
                    <MessageSquare size={16} />
                    <span>Open Live Contract & Chat</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: Financials & Earnings */}
      {activeTab === 'earnings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Earnings & Financial Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AVAILABLE WITHDRAWABLE BALANCE</span>
                <h2 style={{ color: 'var(--accent-emerald)', marginTop: '4px' }}>${totalEarned.toLocaleString()}.00</h2>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>LOCKED IN ESCROW</span>
                <h2 style={{ color: 'var(--accent-cyan)', marginTop: '4px' }}>${totalInEscrow.toLocaleString()}.00</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Released automatically upon client milestone sign-off.
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PLATFORM PROTECTION FEE</span>
                <h2 style={{ color: 'var(--accent-primary)', marginTop: '4px' }}>5.0%</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Includes 100% dispute protection & escrow smart contract mediation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deliverable Submission Modal */}
      {activeDeliverableContractId && (
        <div className="modal-overlay" onClick={() => setActiveDeliverableContractId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Submit Milestone Deliverable</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Attach your staging preview link, bundle assets, and release notes. The client will be notified immediately.
            </p>

            <form onSubmit={handleSubmitDeliverable}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    DELIVERABLE TITLE
                  </label>
                  <input
                    type="text"
                    value={deliverableTitle}
                    onChange={(e) => setDeliverableTitle(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    LIVE PREVIEW / STAGING URL (OPTIONAL)
                  </label>
                  <input
                    type="url"
                    value={liveUrl}
                    placeholder="https://..."
                    onChange={(e) => setLiveUrl(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    SOURCE CODE / ASSETS ARCHIVE URL (OPTIONAL)
                  </label>
                  <input
                    type="url"
                    value={fileUrl}
                    placeholder="https://..."
                    onChange={(e) => setFileUrl(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    SUBMISSION NOTES & CHANGELOG
                  </label>
                  <textarea
                    rows={5}
                    value={deliverableDesc}
                    onChange={(e) => setDeliverableDesc(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="btn-secondary" onClick={() => setActiveDeliverableContractId(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    <UploadCloud size={16} /> Submit Deliverable for Approval
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail View */}
      {selectedGigId && <GigDetailModal />}
    </div>
  );
};
