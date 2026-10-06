import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Sparkles,
  CheckCircle2,
  Users,
  Briefcase,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Code,
  Palette,
  Server,
  Smartphone,
  Cpu,
  PlusCircle,
  UserCheck,
  RefreshCw,
  Calculator,
  Scale,
  Megaphone,
  PenTool,
} from 'lucide-react';

export const GigExplorer: React.FC = () => {
  const { gigs, categories, setSelectedGigId, setActiveView, currentUser, isSyncingGigs, refreshGigs } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'budget_high' | 'proposals'>('newest');
  const [maxBudgetFilter, setMaxBudgetFilter] = useState<number>(15000);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'accounting-bookkeeping':
      case 'cat-accounting':
        return <Calculator size={18} />;
      case 'finance-cfo':
      case 'cat-finance':
        return <TrendingUp size={18} />;
      case 'legal-compliance':
      case 'cat-legal':
        return <Scale size={18} />;
      case 'growth-marketing':
      case 'cat-marketing':
        return <Megaphone size={18} />;
      case 'writing-content':
      case 'cat-writing':
        return <PenTool size={18} />;
      case 'operations-management':
      case 'cat-bizops':
        return <Briefcase size={18} />;
      case 'ai-ml':
      case 'cat-ai':
        return <Sparkles size={18} />;
      case 'fullstack':
      case 'cat-fullstack':
        return <Code size={18} />;
      case 'ui-ux':
      case 'cat-uiux':
        return <Palette size={18} />;
      case 'cloud-devops':
      case 'cat-devops':
        return <Server size={18} />;
      case 'mobile-apps':
      case 'cat-mobile':
        return <Smartphone size={18} />;
      case 'web3':
      case 'cat-web3':
        return <Cpu size={18} />;
      default:
        return <Briefcase size={18} />;
    }
  };

  const filteredGigs = useMemo(() => {
    const targetCat = categories.find((c) => c.id === selectedCategory);
    const uniqueMap = new Map<string, typeof gigs[0]>();

    (gigs || []).forEach((gig) => {
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

      if (matchesCategory && matchesSearch && matchesBudget && matchesStatus) {
        const cleanTitle = String(gig.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanClientId = String(gig.clientId || '').trim().toLowerCase();
        const key = cleanTitle ? `${cleanTitle}__${cleanClientId}` : String(gig.id).trim();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, gig);
        }
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => {
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

  const isClient = currentUser?.role === 'client';
  const isFreelancer = currentUser?.role === 'freelancer';

  return (
    <div className="app-container">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-glow-blob" />
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>Verified Talent & Escrow Protection</span>
          </div>

          <h1 className="hero-title">
            {isFreelancer ? (
              <>
                Browse Verified Client Scopes & <span className="hero-highlight">Send Winning Proposals</span>.
              </>
            ) : (
              <>
                Where World-Class Builders & <span className="hero-highlight">High-Growth Startups</span> Connect.
              </>
            )}
          </h1>

          <p className="hero-description">
            {isFreelancer
              ? 'Discover verified client project requirements in AI, Full-Stack Architecture, UI/UX Systems, and Cloud DevOps with automated smart milestone escrow.'
              : 'Publish project scopes, review incoming freelancer proposals, and fund milestone escrows with automated release protection.'}
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {isClient ? (
              <>
                <button className="btn-primary" onClick={() => setActiveView('client')}>
                  <PlusCircle size={18} /> Post a Project
                </button>
                <button className="btn-secondary" onClick={() => setActiveView('client')}>
                  <Briefcase size={18} /> Client Workspace
                </button>
              </>
            ) : isFreelancer ? (
              <>
                <button
                  className="btn-primary"
                  onClick={() => {
                    const el = document.getElementById('marketplace-search');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Sparkles size={18} /> Explore Client Projects
                </button>
                <button className="btn-secondary" onClick={() => setActiveView('freelancer')}>
                  <UserCheck size={18} /> Freelancer Studio
                </button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={() => setActiveView('verification')}>
                  <ShieldCheck size={18} /> Get Verified
                </button>
              </>
            )}
          </div>

          {/* Hero Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">{gigs.filter((g) => g.status === 'open').length}</span>
              <span className="stat-label">Live Open Gigs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">100%</span>
              <span className="stat-label">Escrow Protected</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">5.0%</span>
              <span className="stat-label">Platform Take Rate</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">Supabase</span>
              <span className="stat-label">Real-Time Backend</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="categories-bar">
        <button
          className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          <TrendingUp size={18} />
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
      <div className="filter-toolbar" id="marketplace-search">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by keywords, tech stack, or outcome (e.g. Next.js, LangGraph, Figma)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span>Max Budget:</span>
            <strong style={{ color: 'var(--accent-emerald)', minWidth: '75px' }}>
              {maxBudgetFilter >= 15000 ? '$15k+ (Any)' : `$${maxBudgetFilter.toLocaleString()}`}
            </strong>
            <input
              type="range"
              min={500}
              max={15000}
              step={500}
              value={maxBudgetFilter}
              onChange={(e) => setMaxBudgetFilter(Number(e.target.value))}
              style={{ width: '120px', accentColor: 'var(--accent-primary)' }}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: '10px 14px', fontSize: '0.85rem' }}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="budget_high">Sort: Highest Budget</option>
            <option value="proposals">Sort: Lowest Proposals</option>
          </select>

          <button
            className="btn-secondary"
            onClick={() => refreshGigs()}
            title="Fetch Latest Client Postings"
            style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isSyncingGigs ? 'spin-icon' : ''} />
            <span>{isSyncingGigs ? 'Syncing...' : 'Live Sync'}</span>
          </button>
        </div>
      </div>

      {/* Gigs Grid */}
      {filteredGigs.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No matching open gigs found</h3>
          <p style={{ maxWidth: '420px', margin: '8px 0 20px' }}>
            {isClient
              ? 'Published client requests will appear here in real-time. Post a project scope to receive bids.'
              : 'Try adjusting your search criteria or budget range to see more projects.'}
          </p>
          {isClient ? (
            <button className="btn-primary" onClick={() => setActiveView('client')}>
              <PlusCircle size={16} /> Post a Project
            </button>
          ) : (
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
          )}
        </div>
      ) : (
        <div className="gigs-grid">
          {filteredGigs.map((gig) => (
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

                  {gig.isFeatured && (
                    <span className="featured-pill">
                      <Sparkles size={11} /> Featured
                    </span>
                  )}
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
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  onClick={() => setSelectedGigId(gig.id)}
                >
                  <span>{isFreelancer ? '⚡ Send Request / Proposal' : 'View Scope & Proposals'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
