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
  LifeBuoy,
  ShieldCheck,
} from 'lucide-react';
import { GigDetailModal } from '../Marketplace/GigDetailModal';
import { mockPersonas } from '../../data/mockData';

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
    openSupportModal,
    openInvoiceModal,
    openDirectContractModal,
    getRepeatCollaboratorsForClient,
    getCollaborationBetween,
    setIsAuthModalOpen,
    setAuthMode,
    isSyncingGigs,
    refreshGigs,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'my-gigs' | 'proposals' | 'trusted-partners' | 'post-gig'>('my-gigs');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'all' | 'open' | 'awarded' | 'completed'>('all');
  const [selectedGigFilter, setSelectedGigFilter] = useState<string>('all');

  // New Gig Form State
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-ai');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [budgetMin, setBudgetMin] = useState(1500);
  const [budgetMax, setBudgetMax] = useState(3000);
  const [deadline, setDeadline] = useState('2026-11-15');
  const [tags, setTags] = useState('TypeScript, Next.js, Supabase');
  const [description, setDescription] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Client's gigs and proposals - strictly belonging to this authenticated client
  const clientGigs = useMemo(() => {
    if (!gigs || gigs.length === 0 || !currentUser) return [];
    return gigs.filter((g) => String(g.clientId).trim() === String(currentUser.id).trim());
  }, [gigs, currentUser]);

  const filteredClientGigs = useMemo(() => {
    if (projectStatusFilter === 'all') return clientGigs;
    return clientGigs.filter((g) => {
      const isGigCompleted =
        g.status === 'completed' ||
        (contracts || []).some((c) => String(c.gigId).trim() === String(g.id).trim() && c.status === 'completed');
      const effectiveStatus = isGigCompleted ? 'completed' : (g.status || 'open');
      return effectiveStatus === projectStatusFilter;
    });
  }, [clientGigs, projectStatusFilter, contracts]);

  const incomingBids = useMemo(() => {
    if (!currentUser || clientGigs.length === 0) return [];
    return (bids || []).filter((b) => {
      const isPending = (b.status || 'pending') === 'pending';
      if (!isPending) return false;
      const cleanBidGigId = String(b.gigId || (b as any).gig_id || '').trim();
      
      if (selectedGigFilter !== 'all') {
        return cleanBidGigId === String(selectedGigFilter).trim();
      }

      // Match ONLY proposals submitted on this client's posted projects
      return clientGigs.some((cg) => String(cg.id).trim() === cleanBidGigId);
    });
  }, [bids, selectedGigFilter, currentUser, clientGigs]);

  const allClientContracts = useMemo(() => {
    if (!currentUser) return [];
    return (contracts || []).filter((c) => String(c.clientId).trim() === String(currentUser.id).trim());
  }, [contracts, currentUser]);

  const activeContracts = useMemo(() => {
    return allClientContracts.filter((c) => c.status !== 'completed');
  }, [allClientContracts]);

  const completedContracts = useMemo(() => {
    return allClientContracts.filter((c) => c.status === 'completed');
  }, [allClientContracts]);

  const repeatCollaborators = useMemo(() => {
    if (!currentUser) return [];
    return getRepeatCollaboratorsForClient(currentUser.id);
  }, [getRepeatCollaboratorsForClient, currentUser]);

  // Category-aware brief assistant (assists real clients to write structured briefs across Accounting, Finance, Legal, Marketing, Tech, or Custom/Other fields)
  const handleAiScopeGen = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      const cat = categories.find((c) => c.id === categoryId);
      const slug = cat?.slug || categoryId;

      if (categoryId === 'cat-other' || slug === 'cat-other' || slug === 'other') {
        const customDomain = customCategoryName.trim() || 'Custom Specialized Project';
        setTitle(`${customDomain}: Strategic Scope & Comprehensive Milestone Execution`);
        setDescription(
          `We are looking for an experienced specialist in ${customDomain} to lead and deliver our project requirements.\n\nKey Deliverables:\n1. Initial requirements audit, alignment, and discovery blueprint.\n2. Core execution phase with iterative milestones and milestone review checkpoints.\n3. Final delivery package, QA verification, and comprehensive handover documentation.`
        );
        setBudgetMin(2000);
        setBudgetMax(3500);
        setTags(`${customDomain}, Professional Services, Milestone Escrow, Quality Assurance`);
      } else if (slug === 'accounting-bookkeeping' || slug === 'cat-accounting') {
        setTitle('Full Multi-Entity General Ledger Reconciliation & Year-End Tax Preparation');
        setDescription(
          `We are seeking a licensed CPA or senior bookkeeper to perform a comprehensive financial audit and chart-of-accounts cleanup for our operating entities in QuickBooks Online.\n\nKey Deliverables:\n1. Chart of Accounts audit, expense re-classification, and cleanup.\n2. Multi-entity bank and Stripe merchant feeds reconciliation.\n3. Preparation of GAAP-compliant balance sheets and P&L statements.\n4. Organized tax depreciation schedules for annual filing.`
        );
        setBudgetMin(2400);
        setBudgetMax(3800);
        setTags('QuickBooks Online, GAAP Accounting, Ledger Reconciliation, Tax Strategy, Excel');
      } else if (slug === 'finance-cfo' || slug === 'cat-finance') {
        setTitle('5-Year SaaS Dynamic Financial Model & Series A Investor Pitch Deck Financials');
        setDescription(
          `Seeking an experienced FP&A Specialist or Fractional CFO to build an investor-grade 3-statement dynamic financial model for institutional venture capital presentations.\n\nKey Deliverables:\n1. Historical cohort churn/retention analysis and unit economics (CAC, LTV, Magic Number).\n2. 3-statement integrated dynamic forecasting model with multiple sensitivity scenarios.\n3. Cap table dilution waterfall modeling and automated valuation charts.`
        );
        setBudgetMin(3200);
        setBudgetMax(5000);
        setTags('Financial Modeling, FP&A, DCF Valuation, Cap Table, SaaS Metrics, Investor Deck');
      } else if (slug === 'legal-compliance' || slug === 'cat-legal') {
        setTitle('Draft Enterprise Master Services Agreement (MSA), SOW Suite & GDPR Privacy Package');
        setDescription(
          `Seeking a corporate technology attorney to draft a robust suite of commercial contracts for our enterprise software offerings.\n\nKey Deliverables:\n1. Standard Enterprise Master Services Agreement (MSA) with limitation of liability.\n2. Modular Statement of Work (SOW) template and Service Level Agreement (SLA).\n3. GDPR and CCPA Data Processing Addendum (DPA) with standard contractual clauses.`
        );
        setBudgetMin(2000);
        setBudgetMax(3500);
        setTags('Commercial Law, Contract Drafting, Enterprise MSA, SLA, GDPR, Compliance');
      } else if (slug === 'growth-marketing' || slug === 'cat-marketing') {
        setTitle('B2B SaaS Growth Marketing Strategy, Paid LinkedIn Ads & SEO Keyword Pipeline');
        setDescription(
          `We need a senior B2B growth marketing strategist to design and implement a scalable customer acquisition pipeline.\n\nKey Deliverables:\n1. Ideal Customer Profile (ICP) definition and multi-channel acquisition roadmap.\n2. High-converting LinkedIn and Google Search campaign structure with landing page copy.\n3. GA4 custom event tracking, conversion optimization, and programmatic SEO plan.`
        );
        setBudgetMin(2800);
        setBudgetMax(4200);
        setTags('Growth Marketing, SEO, Paid Ads, LinkedIn Ads, B2B Funnels, Google Analytics 4');
      } else if (slug === 'writing-content' || slug === 'cat-writing') {
        setTitle('Technical Whitepaper & Developer API Documentation Suite');
        setDescription(
          `Seeking a seasoned Technical Writer to produce an authoritative architectural whitepaper and developer documentation suite.\n\nKey Deliverables:\n1. 15-page comprehensive architectural whitepaper with clear system diagrams.\n2. OpenAPI developer documentation guide and code snippet tutorials.\n3. Thought-leadership technical blog posts explaining key infrastructure innovations.`
        );
        setBudgetMin(1800);
        setBudgetMax(3000);
        setTags('Technical Writing, Whitepapers, API Docs, Markdown, OpenAPI, Developer Relations');
      } else if (slug === 'operations-management' || slug === 'cat-bizops') {
        setTitle('HubSpot CRM Revenue Operations Architecture & Automated Sales Lead Pipeline');
        setDescription(
          `We need a RevOps consultant to restructure our HubSpot CRM, configure lead scoring rules, automate multi-channel deal assignment, and build revenue tracking dashboards.\n\nKey Deliverables:\n1. HubSpot CRM custom property architecture and sales lifecycle stages cleanup.\n2. Automated lead scoring, Slack notification webhooks, and Stripe billing sync.\n3. Executive ARR/MRR dashboard reports and team standard operating procedure (SOP).`
        );
        setBudgetMin(2200);
        setBudgetMax(3600);
        setTags('HubSpot CRM, RevOps, Automation, Zapier, Notion, KPI Dashboards');
      } else if (slug === 'ui-ux' || slug === 'cat-uiux') {
        setTitle('Neo-Fintech Design System & Figma Token Suite for Enterprise Dashboard');
        setDescription(
          `Create a complete, comprehensive Figma design system featuring glassmorphism micro-interactions, dark & light themes, accessibility compliance (WCAG AAA), 60+ modular components, and ready-to-export Tailwind CSS token mappings.`
        );
        setBudgetMin(2200);
        setBudgetMax(3400);
        setTags('Figma, Design Systems, WCAG, TailwindCSS, Micro-Interactions');
      } else {
        setTitle('Architect Autonomous Multi-Modal RAG Platform with Next.js 15 & Supabase Vector');
        setDescription(
          `We are seeking a seasoned Principal Full-Stack & AI Engineer to design and deploy an end-to-end Enterprise RAG platform.\n\nKey Deliverables:\n1. Supabase pgvector embedding pipelines with hybrid sparse/dense search.\n2. Next.js 15 App Router interface with streaming token response & optimistic state caching.\n3. Row Level Security (RLS) policies ensuring strict enterprise data tenant isolation.\n4. Comprehensive Jest integration tests and GitHub Actions CI/CD deployment.`
        );
        setBudgetMin(3500);
        setBudgetMax(5000);
        setTags('Next.js 15, TypeScript, Supabase, pgvector, LangChain, TailwindCSS');
      }

      setIsGeneratingAi(false);
      const categoryLabel = categoryId === 'cat-other' ? (customCategoryName || 'Custom Work') : (cat?.name || 'Project');
      addToast('info', 'Brief Template Loaded ✨', `${categoryLabel} brief draft populated for your adjustments.`);
    }, 300);
  };

  const handlePostGig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      addToast('warning', 'Missing Fields', 'Please fill in title and project brief.');
      return;
    }

    let effectiveCategoryName = '';
    let effectiveCategoryId = '';

    if (categoryId === 'cat-other') {
      if (!customCategoryName.trim()) {
        addToast('warning', 'Missing Industry Sector', 'Please enter your custom industry or work field.');
        return;
      }
      effectiveCategoryName = customCategoryName.trim();
      effectiveCategoryId = customCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    } else {
      const cat = categories.find((c) => c.id === categoryId) || categories[0];
      effectiveCategoryName = cat.name;
      effectiveCategoryId = cat.slug || cat.id;
    }

    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const slug = effectiveCategoryId;

    let defaultMilestoneTitles = [
      'Initial Discovery & Requirements Assessment',
      'Core Milestone Execution & Draft Deliverable',
      'Final Polish, Review & Handover Package',
    ];

    if (slug.includes('accounting') || slug.includes('finance')) {
      defaultMilestoneTitles = [
        'Initial Ledger Audit & Data Ingestion',
        'Core Financial Reconciliation & Model Build',
        'Final GAAP Statements & Executive Deliverables',
      ];
    } else if (slug.includes('legal')) {
      defaultMilestoneTitles = [
        'Initial Legal Audit & Contract Framework',
        'Drafting Master Agreements & SOW Suite',
        'Compliance Review, Revisions & Final Sign-Off',
      ];
    } else if (slug.includes('marketing')) {
      defaultMilestoneTitles = [
        'Market Research & Acquisition Strategy',
        'Campaign Launch & Creative Asset Build',
        'Conversion Optimization & Analytics Handover',
      ];
    }

    createGig({
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      categoryId: effectiveCategoryId,
      categoryName: effectiveCategoryName,
      budgetMin,
      budgetMax,
      deadline,
      referenceFiles: [],
      tags: tagList,
      isFeatured: false,
      suggestedMilestones: [
        { title: defaultMilestoneTitles[0], amount: Math.round(budgetMin * 0.3) },
        { title: defaultMilestoneTitles[1], amount: Math.round(budgetMin * 0.4) },
        { title: defaultMilestoneTitles[2], amount: Math.round(budgetMin * 0.3) },
      ],
    });

    setTitle('');
    setDescription('');
    setCustomCategoryName('');
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
            <span className="persona-badge badge-client">Client Workspace</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {currentUser ? `Signed in as ${currentUser.fullName}` : 'Client Workspace'}
            </span>
          </div>
          <h2>Hiring & Project Management</h2>
          <p>Manage your open projects, review candidate proposals, and oversee escrow milestones.</p>
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
            <span>{isSyncingGigs ? 'Syncing...' : 'Refresh'}</span>
          </button>
          <button
            className="btn-secondary"
            onClick={() => openSupportModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              color: 'var(--accent-cyan)',
            }}
            title="Ask Admin Support & Clarify Doubts"
          >
            <LifeBuoy size={16} />
            <span>Support & Help</span>
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
            Posted Projects Overview
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>{clientGigs.length}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Total Projects</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {clientGigs.filter((g) => (g.status || 'open') === 'open').length} Open • {completedContracts.length} Completed
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Proposals Under Review
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--accent-amber)' }}>{incomingBids.length}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Awaiting Decision</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Candidate pitches from verified engineers
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Escrow Contracts
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--accent-emerald)' }}>{activeContracts.length}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>In Progress</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px', display: 'block' }}>
            {completedContracts.length} Completed & Settled ✅
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Escrow Capital Overview
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <strong style={{ fontSize: '1.8rem', color: 'var(--text-primary)' }}>
              ${activeContracts.reduce((acc, c) => acc + (c.amount || 0), 0).toLocaleString()}
            </strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>Locked</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px', display: 'block' }}>
            ${completedContracts.reduce((acc, c) => acc + (c.amount || 0), 0).toLocaleString()} Disbursed
          </span>
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
          <Users size={16} /> Candidate Proposals ({incomingBids.length})
        </button>

        <button
          className={`btn-ghost ${activeTab === 'trusted-partners' ? 'active' : ''}`}
          onClick={() => setActiveTab('trusted-partners')}
          style={{
            borderBottom: activeTab === 'trusted-partners' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
            borderRadius: 0,
            color: activeTab === 'trusted-partners' ? 'var(--accent-emerald)' : 'var(--text-muted)',
            fontWeight: 600,
            padding: '12px 18px',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Sparkles size={16} color="var(--accent-emerald)" />
          <span>🌟 Trusted Partners ({repeatCollaborators.length})</span>
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
          <PlusCircle size={16} /> Post Project
        </button>
      </div>

      {/* TAB 1: Candidate Proposals */}
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
                const repeatCollab = getCollaborationBetween(currentUser?.id, bid.freelancerId, targetGig?.categoryName);

                return (
                  <div
                    key={bid.id}
                    className="glass-panel"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: repeatCollab ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(99, 102, 241, 0.25)',
                      boxShadow: repeatCollab ? '0 0 25px rgba(16, 185, 129, 0.15)' : undefined,
                    }}
                  >
                    <div>
                      {/* Repeat Partner Banner */}
                      {repeatCollab && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(99, 102, 241, 0.2))',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            marginBottom: '12px',
                            fontSize: '0.78rem',
                            color: 'var(--accent-emerald)',
                            fontWeight: 700,
                          }}
                        >
                          <Sparkles size={13} />
                          <span>🌟 Trusted Repeat Partner • Completed {repeatCollab.completedContractsCount} previous project(s) in {repeatCollab.domain}</span>
                        </div>
                      )}

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
                            {repeatCollab && (
                              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.25)', color: 'var(--accent-emerald)' }}>
                                Repeat Collaborator
                              </span>
                            )}
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

      {/* TAB: Trusted Repeat Partners Network */}
      {activeTab === 'trusted-partners' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--accent-emerald)" />
                Trusted Repeat Partners ({repeatCollaborators.length})
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Directly re-hire vetted engineers & designers you have previously completed projects with. Bypass public bidding and fund milestones immediately.
              </p>
            </div>
          </div>

          {repeatCollaborators.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>No repeat partners yet</h3>
              <p style={{ maxWidth: '440px', margin: '8px auto 20px', color: 'var(--text-secondary)' }}>
                When you hire freelancers and complete contracts with milestone sign-offs, they will be indexed here with their technical domains for instant 1-click re-hire contracts.
              </p>
              <button className="btn-primary" onClick={() => setActiveTab('proposals')}>
                <Users size={16} /> Review Current Proposals
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {repeatCollaborators.map((partner) => (
                <div
                  key={partner.partnerId}
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    background: 'linear-gradient(145deg, rgba(13, 22, 38, 0.85), rgba(16, 185, 129, 0.05))',
                    borderRadius: '16px',
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                      <img
                        src={partner.partnerAvatar}
                        alt={partner.partnerName}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--accent-emerald)',
                        }}
                      />
                      <div>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {partner.partnerName}
                          <CheckCircle2 size={16} color="var(--accent-emerald)" />
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                          {partner.partnerTitle || 'Verified Specialist'}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            display: 'inline-block',
                            padding: '1px 8px',
                            borderRadius: '4px',
                            background: 'rgba(6, 182, 212, 0.2)',
                            color: 'var(--accent-cyan)',
                            fontWeight: 700,
                            marginTop: '4px',
                          }}
                        >
                          {partner.domain}
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px',
                        padding: '10px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        textAlign: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>CONTRACTS</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{partner.completedContractsCount}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL SETTLED</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--accent-emerald)' }}>${partner.totalAmount.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>RATING</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--accent-amber)' }}>★ {partner.averageRating ?? 5.0}</strong>
                      </div>
                    </div>

                    {/* Past Contract Titles */}
                    {partner.contractTitles && partner.contractTitles.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                          PREVIOUS PROJECTS COMPLETED:
                        </span>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {partner.contractTitles.slice(0, 2).map((t, idx) => (
                            <li key={idx} style={{ marginBottom: '2px' }}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      className="btn-primary"
                      style={{
                        flex: 1,
                        fontSize: '0.85rem',
                        padding: '9px 12px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                      onClick={() => openDirectContractModal(partner)}
                    >
                      <Sparkles size={15} /> Instant Re-Hire
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* All Verified Specialists for Direct Assignment */}
          <div style={{ marginTop: '36px', paddingTop: '28px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="var(--accent-cyan)" />
                Direct Work Assignment • Verified Specialist Talent
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Assign milestone contracts directly to any vetted engineer or designer. Escrow is safely vaulted and work starts upon mutual acceptance.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
              {mockPersonas
                .filter((p) => p.role === 'freelancer')
                .map((freelancer) => {
                  const repeatCollab = getCollaborationBetween(currentUser?.id, freelancer.id);

                  return (
                    <div
                      key={freelancer.id}
                      className="glass-panel"
                      style={{
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderRadius: '14px',
                        border: repeatCollab ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                        background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8), rgba(99, 102, 241, 0.04))',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <img
                            src={freelancer.avatarUrl}
                            alt={freelancer.fullName}
                            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-indigo)' }}
                          />
                          <div>
                            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {freelancer.fullName}
                              {freelancer.isVerified && <CheckCircle2 size={15} color="var(--accent-emerald)" />}
                            </strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                              {freelancer.professionalTitle}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                                ★ {freelancer.rating}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                ({freelancer.completedProjects} projects)
                              </span>
                              {repeatCollab && (
                                <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.25)', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                                  Repeat Partner
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 12px' }}>
                          {freelancer.bio.slice(0, 110)}...
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                          {(freelancer.skills || []).slice(0, 4).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        className="btn-primary"
                        style={{
                          width: '100%',
                          fontSize: '0.84rem',
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                        onClick={() => openDirectContractModal(freelancer)}
                      >
                        <Sparkles size={14} /> Assign Work & Direct Escrow
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
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

              <div style={{ display: 'grid', gridTemplateColumns: categoryId === 'cat-other' ? '1fr' : '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    INDUSTRY SECTOR / DOMAIN *
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
                    {!categories.some((c) => c.id === 'cat-other') && (
                      <option value="cat-other">✨ Other / Custom Industry...</option>
                    )}
                  </select>
                </div>

                {categoryId === 'cat-other' && (
                  <div style={{ animation: 'fadeIn 0.25s ease' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--accent-amber)', marginBottom: '6px', fontWeight: 600 }}>
                      ENTER YOUR CUSTOM INDUSTRY / WORK FIELD *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Architectural 3D Rendering, Video Production, Translation, Medical Writing..."
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      style={{
                        width: '100%',
                        borderColor: 'rgba(245, 158, 11, 0.5)',
                        background: 'rgba(245, 158, 11, 0.05)',
                        color: 'var(--text-primary)',
                      }}
                      required={categoryId === 'cat-other'}
                    />
                  </div>
                )}

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Active Contracts Section */}
          {activeContracts.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
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
                            c.status === 'delivered'
                              ? 'rgba(6, 182, 212, 0.2)'
                              : 'rgba(99, 102, 241, 0.2)',
                          color:
                            c.status === 'delivered'
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
            </div>
          )}

          {/* Completed & Settled Contracts Section */}
          {completedContracts.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--accent-emerald)' }}>
                <CheckCircle2 size={18} color="var(--accent-emerald)" />
                Completed & Settled Contracts ({completedContracts.length})
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                {completedContracts.map((c) => (
                  <div key={c.id} className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: 'var(--accent-emerald)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        COMPLETED & SETTLED ✅
                      </span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--accent-emerald)' }}>
                        ${c.amount.toLocaleString()}
                      </strong>
                    </div>

                    <h4 style={{ fontSize: '1rem', marginBottom: '12px', lineHeight: 1.4 }}>
                      {c.gigTitle}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <img src={c.freelancerAvatar} alt={c.freelancerName} className="client-avatar-sm" />
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.freelancerName}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Contractor (Completed)</span>
                      </div>
                    </div>

                    <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.08)', marginBottom: '16px', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                      100% Escrow Disbursed • All Milestones Verified
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn-secondary"
                        style={{ flex: 1, padding: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem' }}
                        onClick={() => {
                          setSelectedContractId(c.id);
                          setActiveView('contracts');
                        }}
                      >
                        <MessageSquare size={15} />
                        <span>Workspace</span>
                        <ArrowRight size={13} />
                      </button>

                      <button
                        className="btn-secondary"
                        style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.82rem', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#c7d2fe' }}
                        onClick={() => openInvoiceModal(c.id)}
                        title="Download / Print Official Tax Invoice & Settlement Receipt"
                      >
                        <FileCheck size={15} color="var(--accent-cyan)" />
                        <span>Invoice</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                const isGigCompleted =
                  g.status === 'completed' ||
                  (contracts || []).some((c) => String(c.gigId).trim() === String(g.id).trim() && c.status === 'completed');
                const effectiveStatus = isGigCompleted ? 'completed' : (g.status || 'open');
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
                            border: effectiveStatus === 'completed' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                            fontWeight: 700,
                          }}
                        >
                          {effectiveStatus === 'completed' ? 'COMPLETED ✅' : effectiveStatus.toUpperCase()}
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
