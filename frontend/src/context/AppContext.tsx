import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Persona,
  Category,
  Gig,
  Bid,
  OrderContract,
  ChatMessage,
  VerificationSubmission,
  NotificationItem,
  ToastMessage,
  AccountRole,
  Milestone,
} from '../types';
import { supabase } from '../lib/supabase';
import { mockGigs, mockBids, mockCategories, mockVerifications } from '../data/mockData';

export type AppView = 'gigs' | 'client' | 'freelancer' | 'contracts' | 'admin' | 'verification' | 'auth' | 'login' | 'signup';

export const standardCategories: Category[] = mockCategories;

export interface AdminStats {
  totalGMV: number;
  escrowLocked: number;
  escrowReleased: number;
  platformFees: number;
  totalGigs: number;
  openGigs: number;
  awardedGigs: number;
  completedGigs: number;
  totalBids: number;
  pendingBids: number;
  acceptedBids: number;
  totalContracts: number;
  pendingVerifications: number;
  verifiedPros: number;
  totalMessages: number;
}

interface AppContextType {
  currentUser: Persona | null;
  setCurrentUser: (user: Persona | null) => void;
  categories: Category[];
  gigs: Gig[];
  bids: Bid[];
  contracts: OrderContract[];
  messages: ChatMessage[];
  verifications: VerificationSubmission[];
  notifications: NotificationItem[];
  toasts: ToastMessage[];
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  selectedGigId: string | null;
  setSelectedGigId: (id: string | null) => void;
  selectedContractId: string | null;
  setSelectedContractId: (id: string | null) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  isSyncingGigs: boolean;
  refreshGigs: () => Promise<void>;
  adminStats: AdminStats;
  
  // Real Auth Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, fullName: string, role: AccountRole) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (passcode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Marketplace & Workspace Actions
  createGig: (gigData: Omit<Gig, 'id' | 'clientId' | 'clientName' | 'clientAvatar' | 'clientRating' | 'clientSpent' | 'clientVerified' | 'proposalsCount' | 'createdAt' | 'status'>) => Gig;
  submitBid: (gigId: string, proposedPrice: number, deliveryDays: number, coverMessage: string, milestones?: { title: string; amount: number }[]) => Bid;
  acceptBidAndCreateContract: (bidId: string) => OrderContract | null;
  declineBid: (bidId: string) => void;
  submitDeliverable: (contractId: string, milestoneId: string, title: string, description: string, files: string[], liveUrl?: string) => void;
  approveMilestoneAndReleaseEscrow: (contractId: string, milestoneId: string) => void;
  markWorkHandoverComplete: (contractId: string, handoverNotes: string) => void;
  completeContract: (contractId: string, rating?: number, reviewText?: string) => void;
  requestRevision: (contractId: string, milestoneId: string, reason: string) => void;
  submitVerification: (data: Omit<VerificationSubmission, 'id' | 'userId' | 'userName' | 'userEmail' | 'status' | 'submittedAt'>) => VerificationSubmission;
  reviewVerification: (verificationId: string, status: 'approved' | 'rejected' | 'under_review', adminComment: string) => void;
  adminUpdateGig: (gigId: string, data: Partial<Gig> & { action?: string }) => Promise<void>;
  adminUpdateContract: (contractId: string, action: 'release_escrow' | 'refund_client' | 'mark_disputed', resolutionNotes?: string) => Promise<void>;
  sendMessage: (orderId: string, content: string, attachments?: string[]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;
  triggerCelebration: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'fs_real_user',
  GIGS: 'fs_real_gigs',
  BIDS: 'fs_real_bids',
  CONTRACTS: 'fs_real_contracts',
  MESSAGES: 'fs_real_messages',
  VERIFICATIONS: 'fs_real_verifications',
  NOTIFICATIONS: 'fs_real_notifications',
};

const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (Array.isArray(fallback) && Array.isArray(parsed) && parsed.length === 0 && (fallback as any[]).length > 0) {
      return fallback;
    }
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed;
  } catch {
    return fallback;
  }
};

export const normalizeGig = (raw: any): Gig => {
  const categoryId = raw.categoryId || raw.category_id || raw.categories?.slug || 'fullstack';
  const categoryName = raw.categoryName || raw.categories?.name || 'Full-Stack Architecture';
  return {
    id: String(raw.id || `gig-${Date.now()}`),
    clientId: String(raw.clientId || raw.client_id || 'client-unknown'),
    clientName: raw.clientName || raw.profiles?.full_name || 'Enterprise Client',
    clientAvatar: raw.clientAvatar || raw.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    clientCompany: raw.clientCompany || 'Enterprise Project',
    clientRating: Number(raw.clientRating ?? 5.0),
    clientSpent: Number(raw.clientSpent ?? 0),
    clientVerified: Boolean(raw.clientVerified ?? raw.profiles?.is_verified ?? true),
    title: raw.title || 'Untitled Project',
    slug: raw.slug || (raw.title ? raw.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'project'),
    description: raw.description || '',
    categoryId,
    categoryName,
    budgetMin: Number(raw.budgetMin ?? raw.budget_min ?? 1000),
    budgetMax: Number(raw.budgetMax ?? raw.budget_max ?? 5000),
    deadline: raw.deadline ? new Date(raw.deadline).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString(),
    status: (raw.status || 'open') as any,
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : ['Full-Stack', 'Production'],
    referenceFiles: raw.referenceFiles || raw.reference_files || [],
    suggestedMilestones: raw.suggestedMilestones || [
      { title: 'Milestone 1: Architectural Foundation', amount: Math.round(Number(raw.budgetMin ?? raw.budget_min ?? 1000) * 0.4) },
      { title: 'Milestone 2: Core Feature Implementation', amount: Math.round(Number(raw.budgetMin ?? raw.budget_min ?? 1000) * 0.6) },
    ],
    proposalsCount: Number(raw.proposalsCount ?? raw.bids?.length ?? 0),
    isFeatured: Boolean(raw.isFeatured ?? raw.is_featured ?? false),
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
};

export const normalizeBid = (raw: any): Bid => {
  return {
    id: String(raw.id || `bid-${Date.now()}`),
    gigId: String(raw.gigId || raw.gig_id || ''),
    freelancerId: String(raw.freelancerId || raw.freelancer_id || 'freelancer-unknown'),
    freelancerName: raw.freelancerName || raw.profiles?.full_name || 'Verified Freelancer',
    freelancerTitle: raw.freelancerTitle || raw.profiles?.professional_title || 'Specialist Engineer',
    freelancerAvatar: raw.freelancerAvatar || raw.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    freelancerRating: Number(raw.freelancerRating ?? 5.0),
    freelancerCompletedOrders: Number(raw.freelancerCompletedOrders ?? 0),
    freelancerBadge: raw.freelancerBadge || (raw.isVerified ? 'Verified Pro' : 'Verified Pro'),
    isVerified: Boolean(raw.isVerified ?? raw.profiles?.is_verified ?? true),
    status: (raw.status || 'pending') as any,
    proposedPrice: Number(raw.proposedPrice ?? raw.proposed_price ?? 1000),
    deliveryDays: Number(raw.deliveryDays ?? raw.delivery_days ?? 7),
    coverMessage: raw.coverMessage || raw.cover_message || '',
    milestones: Array.isArray(raw.milestones) ? raw.milestones : [],
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
};

export const normalizeContract = (raw: any): OrderContract => {
  const isCompleted = raw.status === 'completed';
  const rawMilestones = Array.isArray(raw.milestones) ? raw.milestones : [];
  const normalizedMilestones: Milestone[] = rawMilestones.map((m: any, idx: number) => ({
    id: String(m.id || `m-${raw.id || Date.now()}-${idx}`),
    title: String(m.title || `Milestone ${idx + 1}`),
    amount: Number(m.amount || 0),
    status: isCompleted ? ('approved' as const) : (m.status || (idx === 0 ? 'in_progress' : 'pending')) as any,
    deadline: m.deadline,
    deliverableNote: m.deliverableNote || m.deliverable_note,
    deliverableFiles: m.deliverableFiles || m.deliverable_files || [],
    submittedAt: m.submittedAt || m.submitted_at,
    approvedAt: m.approvedAt || m.approved_at || (isCompleted ? new Date().toISOString() : undefined),
  }));

  return {
    id: String(raw.id || `contract-${Date.now()}`),
    gigId: String(raw.gigId || raw.gig_id || ''),
    gigTitle: raw.gigTitle || raw.gig_title || 'Project Contract',
    clientId: String(raw.clientId || raw.client_id || 'client-unknown'),
    clientName: raw.clientName || raw.client_name || 'Enterprise Client',
    clientAvatar: raw.clientAvatar || raw.client_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    freelancerId: String(raw.freelancerId || raw.freelancer_id || 'freelancer-unknown'),
    freelancerName: raw.freelancerName || raw.freelancer_name || 'Professional Freelancer',
    freelancerAvatar: raw.freelancerAvatar || raw.freelancer_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: (raw.status || 'in_progress') as any,
    amount: Number(raw.amount || 1000),
    escrowFunded: Boolean(raw.escrowFunded ?? raw.escrow_funded ?? true),
    deadline: raw.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    completedAt: raw.completedAt || raw.completed_at,
    deliveredAt: raw.deliveredAt || raw.delivered_at,
    handoverNotes: raw.handoverNotes || raw.handover_notes,
    revisionCount: Number(raw.revisionCount ?? raw.revision_count ?? 0),
    milestones: normalizedMilestones,
    deliverables: Array.isArray(raw.deliverables) ? raw.deliverables : [],
    clientRating: raw.clientRating !== undefined ? Number(raw.clientRating) : undefined,
    clientReview: raw.clientReview,
  };
};

export const normalizeMessage = (raw: any): ChatMessage => {
  return {
    id: String(raw.id || `msg-${Date.now()}`),
    orderId: String(raw.orderId || raw.order_id || ''),
    senderId: String(raw.senderId || raw.sender_id || ''),
    senderName: raw.senderName || raw.sender_name || 'Collaborator',
    senderAvatar: raw.senderAvatar || raw.sender_avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user',
    senderRole: (raw.senderRole || raw.sender_role || 'client') as any,
    content: raw.content || '',
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    isRead: Boolean(raw.isRead ?? raw.is_read ?? false),
  };
};

export const normalizeVerification = (raw: any): VerificationSubmission => {
  return {
    id: String(raw.id || `verif-${Date.now()}`),
    userId: String(raw.userId || raw.user_id || 'user-unknown'),
    userName: raw.userName || raw.user_name || 'Applicant',
    userEmail: raw.userEmail || raw.user_email || 'applicant@example.com',
    professionalTitle: raw.professionalTitle || raw.professional_title || 'Specialist Engineer',
    yearsExperience: String(raw.yearsExperience || raw.years_experience || '3'),
    status: (raw.status || 'pending') as any,
    idDocumentUrl: raw.idDocumentUrl || raw.id_document_url || 'https://documents.freelancestack.dev/verif/doc.pdf',
    selfieUrl: raw.selfieUrl || raw.selfie_url || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    portfolioFiles: Array.isArray(raw.portfolioFiles || raw.portfolio_files) ? (raw.portfolioFiles || raw.portfolio_files) : [],
    certificates: Array.isArray(raw.certificates) ? raw.certificates : [],
    externalLinks: Array.isArray(raw.externalLinks || raw.external_links) ? (raw.externalLinks || raw.external_links) : [],
    skillTags: Array.isArray(raw.skillTags || raw.skill_tags) ? (raw.skillTags || raw.skill_tags) : [],
    pitchStatement: raw.pitchStatement || raw.pitch_statement || '',
    adminComment: raw.adminComment || raw.admin_comment,
    reviewedBy: raw.reviewedBy || raw.reviewed_by,
    reviewedAt: raw.reviewedAt || raw.reviewed_at,
    submittedAt: raw.submittedAt || raw.submitted_at || new Date().toISOString(),
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Current Authenticated User
  const [currentUser, setCurrentUser] = useState<Persona | null>(() => {
    return safeParse<Persona | null>(STORAGE_KEYS.USER, null);
  });

  // Auth Dialog state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isSyncingGigs, setIsSyncingGigs] = useState<boolean>(false);

  // 2. Navigation State with Hash Support
  const getInitialView = (): AppView => {
    try {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['gigs', 'client', 'freelancer', 'contracts', 'admin', 'verification', 'auth', 'login', 'signup'].includes(hash)) {
        return hash as AppView;
      }
    } catch {}
    return currentUser?.role === 'client' ? 'client' : currentUser?.role === 'freelancer' ? 'freelancer' : currentUser?.role === 'admin' ? 'admin' : 'gigs';
  };

  const [activeView, setActiveViewState] = useState<AppView>(getInitialView);

  const setActiveView = useCallback((view: AppView) => {
    setActiveViewState(view);
    try {
      window.location.hash = view;
    } catch {}
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (['gigs', 'client', 'freelancer', 'contracts', 'admin', 'verification', 'auth', 'login', 'signup'].includes(hash)) {
        setActiveViewState(hash as AppView);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  // 3. Projects, Bids, Contracts, Verifications State
  const [gigs, setGigs] = useState<Gig[]>(() => safeParse(STORAGE_KEYS.GIGS, mockGigs));
  const [bids, setBids] = useState<Bid[]>(() => safeParse(STORAGE_KEYS.BIDS, mockBids));
  const [contracts, setContracts] = useState<OrderContract[]>(() => safeParse(STORAGE_KEYS.CONTRACTS, []));
  const [messages, setMessages] = useState<ChatMessage[]>(() => safeParse(STORAGE_KEYS.MESSAGES, []));
  const [verifications, setVerifications] = useState<VerificationSubmission[]>(() => safeParse(STORAGE_KEYS.VERIFICATIONS, mockVerifications));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => safeParse(STORAGE_KEYS.NOTIFICATIONS, []));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Fetch gigs, bids, contracts, messages, and verifications from backend API and sync with state
  const fetchGigsFromBackend = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      
      // 1. Fetch Gigs
      try {
        const gigsRes = await fetch(`${apiUrl}/api/marketplace/gigs`);
        if (gigsRes.ok) {
          const data = await gigsRes.json();
          if (data && Array.isArray(data.gigs)) {
            const backendGigs: Gig[] = data.gigs.map(normalizeGig);
            setGigs((prev) => {
              const gigMap = new Map<string, Gig>();
              // Add prev first
              for (const g of prev || []) {
                gigMap.set(String(g.id).trim(), g);
              }
              // Overwrite with backend gigs
              for (const bg of backendGigs) {
                gigMap.set(String(bg.id).trim(), bg);
              }
              const combined = Array.from(gigMap.values());
              combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              try {
                localStorage.setItem(STORAGE_KEYS.GIGS, JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        }
      } catch {}

      // 2. Fetch Bids / Proposals
      try {
        const bidsRes = await fetch(`${apiUrl}/api/marketplace/bids`);
        if (bidsRes.ok) {
          const bidsData = await bidsRes.json();
          if (bidsData && Array.isArray(bidsData.bids)) {
            const backendBids: Bid[] = bidsData.bids.map(normalizeBid);
            setBids((prev) => {
              const bidMap = new Map<string, Bid>();
              for (const b of prev || []) {
                bidMap.set(String(b.id).trim(), b);
              }
              for (const bb of backendBids) {
                bidMap.set(String(bb.id).trim(), bb);
              }
              const combined = Array.from(bidMap.values());
              combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              try {
                localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        }
      } catch {}

      // 3. Fetch Contracts
      try {
        const contractsRes = await fetch(`${apiUrl}/api/marketplace/contracts`);
        if (contractsRes.ok) {
          const contractsData = await contractsRes.json();
          if (contractsData && Array.isArray(contractsData.contracts)) {
            const backendContracts: OrderContract[] = contractsData.contracts.map(normalizeContract);
            setContracts((prev) => {
              const contractMap = new Map<string, OrderContract>();
              for (const c of prev || []) {
                contractMap.set(String(c.id).trim(), c);
              }
              for (const bc of backendContracts) {
                contractMap.set(String(bc.id).trim(), bc);
              }
              const combined = Array.from(contractMap.values());
              combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              try {
                localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        }
      } catch {}

      // 4. Fetch Chat Messages
      try {
        const messagesRes = await fetch(`${apiUrl}/api/marketplace/messages`);
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          if (messagesData && Array.isArray(messagesData.messages)) {
            const backendMessages: ChatMessage[] = messagesData.messages.map(normalizeMessage);
            setMessages((prev) => {
              const msgMap = new Map<string, ChatMessage>();
              for (const m of prev || []) {
                msgMap.set(String(m.id).trim(), m);
              }
              for (const bm of backendMessages) {
                msgMap.set(String(bm.id).trim(), bm);
              }
              const combined = Array.from(msgMap.values());
              combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              try {
                localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        }
      } catch {}

      // 5. Fetch Verifications
      try {
        const verifsRes = await fetch(`${apiUrl}/api/marketplace/verifications`);
        if (verifsRes.ok) {
          const verifsData = await verifsRes.json();
          if (verifsData && Array.isArray(verifsData.verifications)) {
            const backendVerifs: VerificationSubmission[] = verifsData.verifications.map(normalizeVerification);
            setVerifications((prev) => {
              const verifMap = new Map<string, VerificationSubmission>();
              for (const v of prev || []) {
                verifMap.set(String(v.id).trim(), v);
              }
              for (const bv of backendVerifs) {
                verifMap.set(String(bv.id).trim(), bv);
              }
              const combined = Array.from(verifMap.values());
              combined.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
              try {
                localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(combined));
              } catch {}
              return combined;
            });
          }
        }
      } catch {}

    } catch (err) {
      console.warn('Sync background fetch notice:', err);
    }
  }, []);

  // Background polling & auto-fetch on mount and view changes
  useEffect(() => {
    fetchGigsFromBackend();
    const interval = setInterval(() => {
      fetchGigsFromBackend();
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchGigsFromBackend]);

  useEffect(() => {
    fetchGigsFromBackend();
  }, [activeView, fetchGigsFromBackend]);

  // Explicit manual refresh
  const refreshGigs = useCallback(async () => {
    setIsSyncingGigs(true);
    await fetchGigsFromBackend();
    setTimeout(() => setIsSyncingGigs(false), 400);
  }, [fetchGigsFromBackend]);

  // Compute dynamic category counts flexibly matching id, slug, or name
  const categories = useMemo(() => {
    return standardCategories.map((cat) => ({
      ...cat,
      gigCount: gigs.filter(
        (g) =>
          (g.categoryId === cat.id ||
           g.categoryId === cat.slug ||
           g.categoryName?.toLowerCase().includes(cat.name.toLowerCase()) ||
           cat.name.toLowerCase().includes((g.categoryName || '').toLowerCase())) &&
          (g.status || 'open') === 'open'
      ).length,
    }));
  }, [gigs]);

  // Compute comprehensive live Admin stats
  const adminStats = useMemo<AdminStats>(() => {
    const totalGMV = contracts.reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const escrowLocked = contracts
      .filter((c) => c.status === 'in_progress' || c.status === 'delivered' || c.status === 'revision_requested' || c.status === 'disputed')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const escrowReleased = contracts
      .filter((c) => c.status === 'completed')
      .reduce((acc, c) => acc + Number(c.amount || 0), 0);
    const platformFees = totalGMV * 0.05;

    const totalGigs = gigs.length;
    const openGigs = gigs.filter((g) => (g.status || 'open') === 'open').length;
    const awardedGigs = gigs.filter((g) => g.status === 'awarded' || g.status === 'in_progress').length;
    const completedGigs = gigs.filter((g) => g.status === 'completed').length;

    const totalBids = bids.length;
    const pendingBids = bids.filter((b) => (b.status || 'pending') === 'pending').length;
    const acceptedBids = bids.filter((b) => b.status === 'accepted').length;

    const pendingVerifs = verifications.filter((v) => v.status === 'pending' || v.status === 'under_review').length;
    const approvedVerifs = verifications.filter((v) => v.status === 'approved').length;

    return {
      totalGMV,
      escrowLocked,
      escrowReleased,
      platformFees,
      totalGigs,
      openGigs,
      awardedGigs,
      completedGigs,
      totalBids,
      pendingBids,
      acceptedBids,
      totalContracts: contracts.length,
      pendingVerifications: pendingVerifs,
      verifiedPros: approvedVerifs,
      totalMessages: messages.length,
    };
  }, [contracts, gigs, bids, verifications, messages]);

  // Sync state to local storage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GIGS, JSON.stringify(gigs));
    } catch {}
  }, [gigs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(bids));
    } catch {}
  }, [bids]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));
    } catch {}
  }, [contracts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(verifications));
    } catch {}
  }, [verifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Real-time Cross-tab and Cross-Window Synchronization Listener
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEYS.GIGS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setGigs(parsed);
        } else if (e.key === STORAGE_KEYS.BIDS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setBids(parsed);
        } else if (e.key === STORAGE_KEYS.CONTRACTS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setContracts(parsed);
        } else if (e.key === STORAGE_KEYS.NOTIFICATIONS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setNotifications(parsed);
        } else if (e.key === STORAGE_KEYS.MESSAGES) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setMessages(parsed);
        } else if (e.key === STORAGE_KEYS.VERIFICATIONS) {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setVerifications(parsed);
        }
      } catch {}
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Toast Helper
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string, duration = 4500) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  // Confetti helper for real milestones
  const triggerCelebration = useCallback(() => {
    try {
      import('canvas-confetti')
        .then((mod) => {
          const confettiFn = mod.default || mod;
          if (typeof confettiFn === 'function') {
            confettiFn({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#6366f1', '#10b981', '#38bdf8', '#f59e0b', '#ec4899'],
            });
          }
        })
        .catch(() => {});
    } catch {}
  }, []);

  // Strict Supabase & Backend Login Action
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();

      if (!cleanEmail || !cleanPass) {
        return { success: false, error: 'Email and password are required.' };
      }

      // 1. Try Backend authentication endpoint
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      try {
        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
        });
        const payload = await res.json().catch(() => ({}));

        if (res.ok && payload.user) {
          try {
            await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPass });
          } catch {}

          const role = (payload.user.role as AccountRole) || 'client';
          const user: Persona = {
            id: payload.user.id,
            email: payload.user.email || cleanEmail,
            fullName: payload.user.fullName || cleanEmail.split('@')[0],
            role,
            roles: payload.user.roles || [role],
            professionalTitle: role === 'freelancer' ? 'Verified Specialist' : role === 'admin' ? 'Platform Administrator' : 'Client Founder',
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${payload.user.id}`,
            rating: 5.0,
            reviewsCount: 0,
            completedProjects: 0,
            totalEarned: 0,
            totalSpent: 0,
            isVerified: role === 'admin',
            bio: '',
            skills: [],
          };

          setCurrentUser(user);
          setIsAuthModalOpen(false);
          setActiveViewState(role as AppView);
          addToast('success', 'Logged In', `Welcome back, ${user.fullName}`);
          return { success: true };
        } else if (res.status === 401 && payload.message) {
          return { success: false, error: payload.message };
        }
      } catch {}

      // 2. Direct Supabase client login fallback
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (error || !data?.user) {
        return {
          success: false,
          error: error?.message || 'Invalid email or password. Please check your credentials.',
        };
      }

      const role = (data.user.user_metadata?.role as AccountRole) || 'client';
      const fullName = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];
      const user: Persona = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        fullName,
        role,
        roles: [role],
        professionalTitle: role === 'freelancer' ? 'Verified Specialist' : role === 'admin' ? 'Platform Administrator' : 'Client Founder',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`,
        rating: 5.0,
        reviewsCount: 0,
        completedProjects: 0,
        totalEarned: 0,
        totalSpent: 0,
        isVerified: role === 'admin',
        bio: '',
        skills: [],
      };

      setCurrentUser(user);
      setIsAuthModalOpen(false);
      setActiveViewState(role as AppView);
      addToast('success', 'Logged In', `Welcome back, ${user.fullName}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed. Please verify your connection.' };
    }
  }, [addToast]);

  // Strict Supabase & Backend Signup Action
  const signup = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    role: AccountRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = password.trim();
      const cleanName = fullName.trim() || cleanEmail.split('@')[0];

      if (!cleanEmail || !cleanPass) {
        return { success: false, error: 'Email and password are required.' };
      }

      if (cleanPass.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters.' };
      }

      // 1. Try Backend signup endpoint
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      try {
        const res = await fetch(`${apiUrl}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPass, fullName: cleanName, role }),
        });
        const payload = await res.json().catch(() => ({}));

        if (res.ok && payload.user) {
          try {
            await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPass });
          } catch {}

          const user: Persona = {
            id: payload.user.id,
            email: cleanEmail,
            fullName: cleanName,
            role,
            roles: payload.user.roles || [role],
            professionalTitle: role === 'freelancer' ? 'Freelance Specialist' : role === 'admin' ? 'Platform Administrator' : 'Enterprise Client',
            avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${payload.user.id}`,
            rating: 5.0,
            reviewsCount: 0,
            completedProjects: 0,
            totalEarned: 0,
            totalSpent: 0,
            isVerified: role === 'admin',
            bio: '',
            skills: [],
          };

          setCurrentUser(user);
          setIsAuthModalOpen(false);
          setActiveViewState(role as AppView);
          addToast('success', 'Account Created!', `Welcome to FreelanceStack, ${cleanName}`);
          return { success: true };
        } else if (payload.message && payload.message.includes('already exists')) {
          // If already exists, attempt automatic login
          return await login(cleanEmail, cleanPass);
        }
      } catch {}

      // 2. Direct Supabase Auth Signup fallback
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: { full_name: cleanName, role },
        },
      });

      if (error || !data?.user) {
        if (error?.message?.includes('already registered') || error?.message?.includes('already exists')) {
          return await login(cleanEmail, cleanPass);
        }
        return {
          success: false,
          error: error?.message || 'Unable to register account. Please try again.',
        };
      }

      const user: Persona = {
        id: data.user.id,
        email: cleanEmail,
        fullName: cleanName,
        role,
        roles: [role],
        professionalTitle: role === 'freelancer' ? 'Freelance Specialist' : role === 'admin' ? 'Platform Administrator' : 'Enterprise Client',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`,
        rating: 5.0,
        reviewsCount: 0,
        completedProjects: 0,
        totalEarned: 0,
        totalSpent: 0,
        isVerified: role === 'admin',
        bio: '',
        skills: [],
      };

      setCurrentUser(user);
      setIsAuthModalOpen(false);
      setActiveViewState(role as AppView);
      addToast('success', 'Account Created!', `Welcome to FreelanceStack, ${cleanName}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Signup failed. Please try again.' };
    }
  }, [addToast, login]);

  // Master Admin Passcode Login Action
  const adminLogin = useCallback(async (passcode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanPass = passcode.trim();
      if (!cleanPass) {
        return { success: false, error: 'Master admin passcode is required.' };
      }

      if (cleanPass !== 'admin@426') {
        return { success: false, error: 'Invalid Admin Master Passcode. Access denied.' };
      }

      // 1. Try Backend verification
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      try {
        const res = await fetch(`${apiUrl}/api/auth/admin-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: cleanPass }),
        });
        const payload = await res.json().catch(() => ({}));
        if (res.ok && payload.user) {
          const adminUser: Persona = {
            id: payload.user.id || 'admin-master-node',
            email: payload.user.email || 'admin@freelancestack.io',
            fullName: payload.user.fullName || 'Master Administrator',
            role: 'admin',
            roles: ['admin'],
            professionalTitle: 'Master Platform Administrator',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin-governance-shield',
            rating: 5.0,
            reviewsCount: 0,
            completedProjects: 0,
            totalEarned: 0,
            totalSpent: 0,
            isVerified: true,
            bio: 'Chief Platform Security & Escrow Mediation Officer',
            skills: ['Platform Governance', 'Escrow Mediation', 'KYC Audit', 'Smart Contract Control'],
          };
          setCurrentUser(adminUser);
          setIsAuthModalOpen(false);
          setActiveViewState('admin');
          addToast('success', 'Admin Governance Active', 'Master Admin Console unlocked.');
          return { success: true };
        }
      } catch {}

      // 2. Direct verified session activation
      const adminUser: Persona = {
        id: 'admin-master-node',
        email: 'admin@freelancestack.io',
        fullName: 'Master Administrator',
        role: 'admin',
        roles: ['admin'],
        professionalTitle: 'Master Platform Administrator',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin-governance-shield',
        rating: 5.0,
        reviewsCount: 0,
        completedProjects: 0,
        totalEarned: 0,
        totalSpent: 0,
        isVerified: true,
        bio: 'Chief Platform Security & Escrow Mediation Officer',
        skills: ['Platform Governance', 'Escrow Mediation', 'KYC Audit', 'Smart Contract Control'],
      };
      setCurrentUser(adminUser);
      setIsAuthModalOpen(false);
      setActiveViewState('admin');
      addToast('success', 'Admin Governance Active', 'Master Admin Console unlocked.');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Admin authentication error.' };
    }
  }, [addToast]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${apiUrl}/api/auth/logout`, { method: 'POST' });
    } catch {}
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {}
    setActiveViewState('auth');
    addToast('info', 'Signed Out', 'You have been logged out successfully.');
  }, [addToast]);

  // Action: Create Gig (Real-time & Cross-Role Sync)
  const createGig = useCallback((gigData: Omit<Gig, 'id' | 'clientId' | 'clientName' | 'clientAvatar' | 'clientRating' | 'clientSpent' | 'clientVerified' | 'proposalsCount' | 'createdAt' | 'status'>): Gig => {
    const fallbackUser: Persona = currentUser || {
      id: `client-${Date.now()}`,
      email: 'client@example.com',
      fullName: 'Active Client',
      role: 'client',
      roles: ['client'],
      professionalTitle: 'Client Founder',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=client',
      rating: 5.0,
      reviewsCount: 0,
      completedProjects: 0,
      totalEarned: 0,
      totalSpent: 0,
      isVerified: true,
      bio: '',
      skills: [],
    };

    const gigId = `gig-${Date.now()}`;
    const newGig: Gig = {
      ...gigData,
      id: gigId,
      clientId: fallbackUser.id,
      clientName: fallbackUser.fullName,
      clientAvatar: fallbackUser.avatarUrl,
      clientCompany: fallbackUser.company || 'Enterprise Project',
      clientRating: fallbackUser.rating,
      clientSpent: fallbackUser.totalSpent ?? 0,
      clientVerified: fallbackUser.isVerified,
      proposalsCount: 0,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    setGigs((prev) => {
      const filtered = (prev || []).filter((g) => g.id !== gigId);
      const updated = [newGig, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEYS.GIGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Background sync to backend API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/api/marketplace/gigs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newGig.id,
          title: newGig.title,
          description: newGig.description,
          categoryId: newGig.categoryId,
          categoryName: newGig.categoryName,
          tags: newGig.tags,
          budgetMin: newGig.budgetMin,
          budgetMax: newGig.budgetMax,
          deadline: newGig.deadline ? new Date(newGig.deadline).toISOString() : undefined,
          status: 'open',
          clientId: fallbackUser.id,
          clientName: fallbackUser.fullName,
          clientAvatar: fallbackUser.avatarUrl,
          clientCompany: fallbackUser.company || 'Enterprise Project',
          clientVerified: fallbackUser.isVerified,
          suggestedMilestones: newGig.suggestedMilestones,
        }),
      })
        .then((r) => r.json())
        .then(() => {
          fetchGigsFromBackend();
        })
        .catch(() => {});
    } catch {}

    addToast('success', 'Gig Published!', `"${newGig.title}" is live on the marketplace and accepting proposals.`);
    triggerCelebration();
    return newGig;
  }, [currentUser, addToast, triggerCelebration, fetchGigsFromBackend]);

  // Action: Submit Bid (Real-time & Cross-Role Sync)
  const submitBid = useCallback((
    gigId: string,
    proposedPrice: number,
    deliveryDays: number,
    coverMessage: string,
    milestones?: { title: string; amount: number }[]
  ): Bid => {
    const fallbackUser: Persona = currentUser || {
      id: `freelancer-${Date.now()}`,
      email: 'freelancer@example.com',
      fullName: 'Professional Freelancer',
      role: 'freelancer',
      roles: ['freelancer'],
      professionalTitle: 'Verified Specialist',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=freelancer',
      rating: 5.0,
      reviewsCount: 0,
      completedProjects: 0,
      totalEarned: 0,
      totalSpent: 0,
      isVerified: true,
      bio: '',
      skills: [],
    };

    const cleanGigId = String(gigId).trim();
    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      gigId: cleanGigId,
      freelancerId: fallbackUser.id,
      freelancerName: fallbackUser.fullName,
      freelancerTitle: fallbackUser.professionalTitle,
      freelancerAvatar: fallbackUser.avatarUrl,
      freelancerRating: fallbackUser.rating,
      freelancerCompletedOrders: fallbackUser.completedProjects,
      freelancerBadge: 'Verified Pro',
      isVerified: true,
      status: 'pending',
      proposedPrice,
      deliveryDays,
      coverMessage,
      milestones: milestones || [],
      createdAt: new Date().toISOString(),
    };

    setBids((prev) => {
      const filtered = (prev || []).filter((b) => !(String(b.gigId).trim() === cleanGigId && String(b.freelancerId).trim() === String(fallbackUser.id).trim()));
      const updated = [newBid, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Increment proposal count on target gig
    setGigs((prev) => {
      const updated = (prev || []).map((g) => (String(g.id).trim() === cleanGigId ? { ...g, proposalsCount: (g.proposalsCount || 0) + 1 } : g));
      try {
        localStorage.setItem(STORAGE_KEYS.GIGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Sync proposal to backend API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/api/marketplace/gigs/${cleanGigId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedPrice,
          deliveryDays,
          coverMessage,
          freelancerId: fallbackUser.id,
          freelancerName: fallbackUser.fullName,
          freelancerTitle: fallbackUser.professionalTitle,
          freelancerAvatar: fallbackUser.avatarUrl,
          freelancerRating: fallbackUser.rating,
          isVerified: true,
          milestones: milestones || [],
        }),
      })
        .then((r) => r.json())
        .then(() => {
          fetchGigsFromBackend();
        })
        .catch(() => {});
    } catch {}

    // Notify client
    const targetGig = gigs.find((g) => String(g.id).trim() === cleanGigId);
    if (targetGig) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: targetGig.clientId,
        type: 'bid',
        title: 'New Proposal Received',
        body: `${fallbackUser.fullName} submitted a proposal of $${proposedPrice.toLocaleString()} for "${targetGig.title}".`,
        isRead: false,
        createdAt: new Date().toISOString(),
        targetView: 'client',
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    addToast('success', 'Proposal Submitted!', `Bid of $${proposedPrice.toLocaleString()} sent to client.`);
    triggerCelebration();
    return newBid;
  }, [currentUser, gigs, addToast, triggerCelebration, fetchGigsFromBackend]);

  // Action: Accept Bid & Initialize Escrow Contract (Real-time)
  const acceptBidAndCreateContract = useCallback((bidId: string): OrderContract | null => {
    const cleanBidId = String(bidId || '').trim();
    const bid = (bids || []).find((b) => String(b.id).trim() === cleanBidId);

    if (!bid) {
      console.warn('Bid not found for ID:', bidId);
      addToast('error', 'Bid Error', 'Could not locate the selected proposal.');
      return null;
    }

    const cleanGigId = String(bid.gigId || (bid as any).gig_id || '').trim();
    const existingGig = (gigs || []).find((g) => String(g.id).trim() === cleanGigId);

    const targetGig: Gig = existingGig || {
      id: cleanGigId || `gig-${Date.now()}`,
      clientId: currentUser?.id || 'client-verified',
      clientName: currentUser?.fullName || 'Enterprise Client',
      clientAvatar: currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      clientCompany: currentUser?.company || 'Enterprise Project',
      clientRating: currentUser?.rating || 5.0,
      clientSpent: currentUser?.totalSpent || 5000,
      clientVerified: true,
      title: 'Enterprise Project Scope',
      slug: 'enterprise-project-scope',
      description: 'Milestone escrow delivery contract.',
      categoryId: 'fullstack',
      categoryName: 'Full-Stack Architecture',
      budgetMin: bid.proposedPrice,
      budgetMax: Math.round(bid.proposedPrice * 1.3),
      deadline: new Date(Date.now() + (bid.deliveryDays || 14) * 86400000).toISOString(),
      status: 'awarded',
      tags: ['Production', 'Full-Stack'],
      referenceFiles: [],
      suggestedMilestones: bid.milestones || [],
      proposalsCount: 1,
      isFeatured: false,
      createdAt: new Date().toISOString(),
    };

    // Update bid status
    setBids((prev) =>
      (prev || []).map((b) =>
        String(b.id).trim() === cleanBidId
          ? { ...b, status: 'accepted' }
          : (cleanGigId && String(b.gigId || (b as any).gig_id).trim() === cleanGigId)
          ? { ...b, status: 'rejected' }
          : b
      )
    );

    // Update gig status
    setGigs((prev) =>
      (prev || []).map((g) => (String(g.id).trim() === String(targetGig.id).trim() ? { ...g, status: 'awarded' } : g))
    );

    // Form contract milestones
    const contractMilestones: Milestone[] =
      bid.milestones && bid.milestones.length > 0
        ? bid.milestones.map((m, idx) => ({
            id: `m-${Date.now()}-${idx}`,
            title: m.title,
            amount: m.amount,
            status: idx === 0 ? 'in_progress' : 'pending',
            deadline: new Date(Date.now() + (idx + 1) * 7 * 86400000).toISOString().split('T')[0],
          }))
        : [
            {
              id: `m-${Date.now()}-0`,
              title: 'Complete Project Deliverables & Handover',
              amount: bid.proposedPrice,
              status: 'in_progress',
              deadline: new Date(Date.now() + (bid.deliveryDays || 14) * 86400000).toISOString().split('T')[0],
            },
          ];

    const newContract: OrderContract = {
      id: `contract-${Date.now()}`,
      gigId: targetGig.id,
      gigTitle: targetGig.title,
      clientId: targetGig.clientId || currentUser?.id || 'client-active',
      clientName: targetGig.clientName || currentUser?.fullName || 'Enterprise Client',
      clientAvatar: targetGig.clientAvatar || currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      freelancerId: bid.freelancerId,
      freelancerName: bid.freelancerName,
      freelancerAvatar: bid.freelancerAvatar,
      status: 'in_progress',
      amount: bid.proposedPrice,
      escrowFunded: true,
      deadline: new Date(Date.now() + (bid.deliveryDays || 14) * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      revisionCount: 0,
      milestones: contractMilestones,
      deliverables: [],
    };

    setContracts((prev) => {
      const updated = [newContract, ...(prev || []).filter((c) => c.id !== newContract.id)];
      try {
        localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setSelectedContractId(newContract.id);

    // Initial message in real chat
    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      orderId: newContract.id,
      senderId: newContract.clientId,
      senderName: newContract.clientName,
      senderAvatar: newContract.clientAvatar,
      senderRole: 'client',
      content: `Hello ${bid.freelancerName}! I've accepted your proposal and funded the $${bid.proposedPrice.toLocaleString()} escrow. Looking forward to collaborating!`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => {
      const updated = [...(prev || []), welcomeMsg];
      try {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Sync contract creation to backend API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/api/marketplace/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newContract.id,
          bidId: bid.id,
          gigId: targetGig.id,
          gigTitle: targetGig.title,
          clientId: newContract.clientId,
          clientName: newContract.clientName,
          clientAvatar: newContract.clientAvatar,
          freelancerId: bid.freelancerId,
          freelancerName: bid.freelancerName,
          freelancerAvatar: bid.freelancerAvatar,
          amount: bid.proposedPrice,
          milestones: contractMilestones,
        }),
      })
        .then((r) => r.json())
        .then(() => {
          fetchGigsFromBackend();
        })
        .catch(() => {});
    } catch {}

    addToast('success', 'Contract Initialized & Escrow Funded!', `Hired ${bid.freelancerName} for $${bid.proposedPrice.toLocaleString()}`);
    triggerCelebration();
    return newContract;
  }, [bids, gigs, currentUser, addToast, triggerCelebration, fetchGigsFromBackend]);

  // Action: Submit Milestone Deliverable
  const submitDeliverable = useCallback((
    contractId: string,
    milestoneId: string,
    title: string,
    description: string,
    files: string[],
    liveUrl?: string
  ) => {
    const newDeliverable = {
      id: `del-${Date.now()}`,
      milestoneId,
      title,
      description,
      files,
      liveUrl,
      submittedAt: new Date().toISOString(),
    };

    let updatedMilestones: Milestone[] = [];
    let updatedDeliverables: any[] = [];

    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        updatedMilestones = (c.milestones || []).map((m) =>
          m.id === milestoneId
            ? {
                ...m,
                status: 'submitted' as const,
                deliverableNote: description,
                deliverableFiles: files,
                submittedAt: new Date().toISOString(),
              }
            : m
        );
        updatedDeliverables = [newDeliverable, ...(c.deliverables || [])];
        return {
          ...c,
          status: 'delivered',
          milestones: updatedMilestones,
          deliverables: updatedDeliverables,
        };
      })
    );

    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      const senderName = currentUser?.fullName || contract.freelancerName;
      const senderId = currentUser?.id || contract.freelancerId;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        orderId: contractId,
        senderId,
        senderName,
        senderAvatar: currentUser?.avatarUrl || contract.freelancerAvatar,
        senderRole: 'freelancer',
        content: `📦 **Deliverable Submitted**: "${title}"\n${description}${liveUrl ? `\n🔗 Staging / Preview: ${liveUrl}` : ''}`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setMessages((prev) => [...prev, msg]);

      // Sync message & contract status to backend
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        fetch(`${apiUrl}/api/marketplace/orders/${contractId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        }).catch(() => {});

        fetch(`${apiUrl}/api/marketplace/contracts/${contractId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'delivered',
            milestones: updatedMilestones,
            deliverables: updatedDeliverables,
          }),
        }).catch(() => {});
      } catch {}

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: contract.clientId,
        type: 'milestone',
        title: 'Milestone Deliverable Submitted',
        body: `${senderName} submitted work for "${title}".`,
        isRead: false,
        createdAt: new Date().toISOString(),
        targetView: 'contracts',
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    addToast('success', 'Deliverable Submitted!', 'Client notified to review your submission.');
    triggerCelebration();
  }, [contracts, currentUser, addToast, triggerCelebration]);

  // Action: Approve Milestone & Release Escrow
  const approveMilestoneAndReleaseEscrow = useCallback((contractId: string, milestoneId: string) => {
    let approvedAmount = 0;
    let finalMilestones: Milestone[] = [];
    let nextContractStatus: 'in_progress' | 'completed' = 'in_progress';
    let completedAt: string | undefined = undefined;

    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;

        const updatedMilestones = (c.milestones || []).map((m) => {
          if (m.id === milestoneId) {
            approvedAmount = m.amount;
            return {
              ...m,
              status: 'approved' as const,
              approvedAt: new Date().toISOString(),
            };
          }
          return m;
        });

        const remainingPending = updatedMilestones.filter((m) => m.status === 'pending');
        if (remainingPending.length > 0) {
          const firstPending = remainingPending[0];
          finalMilestones = updatedMilestones.map((m) =>
            m.id === firstPending.id ? { ...m, status: 'in_progress' as const } : m
          );
          nextContractStatus = 'in_progress';
          return {
            ...c,
            status: 'in_progress' as const,
            milestones: finalMilestones,
          };
        } else {
          const isAllDone = updatedMilestones.every((m) => m.status === 'approved');
          finalMilestones = updatedMilestones;
          nextContractStatus = isAllDone ? ('completed' as const) : ('in_progress' as const);
          completedAt = isAllDone ? new Date().toISOString() : undefined;
          return {
            ...c,
            status: nextContractStatus,
            milestones: finalMilestones,
            completedAt,
          };
        }
      })
    );

    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      // Update freelancer earnings & client spending in user state
      setCurrentUser((prev) => {
        if (!prev) return prev;
        if (prev.id === contract.freelancerId) {
          return {
            ...prev,
            totalEarned: (prev.totalEarned || 0) + approvedAmount,
          };
        }
        if (prev.id === contract.clientId) {
          return {
            ...prev,
            totalSpent: (prev.totalSpent || 0) + approvedAmount,
          };
        }
        return prev;
      });

      const senderName = currentUser?.fullName || contract.clientName;
      const senderId = currentUser?.id || contract.clientId;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        orderId: contractId,
        senderId,
        senderName,
        senderAvatar: currentUser?.avatarUrl || contract.clientAvatar,
        senderRole: 'client',
        content: `🎉 **Milestone Approved!** Escrow of $${approvedAmount.toLocaleString()} has been unlocked and released to the freelancer.`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setMessages((prev) => [...prev, msg]);

      // Sync message & contract to backend
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        fetch(`${apiUrl}/api/marketplace/orders/${contractId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        }).catch(() => {});

        fetch(`${apiUrl}/api/marketplace/contracts/${contractId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: nextContractStatus,
            milestones: finalMilestones,
            completedAt,
          }),
        }).catch(() => {});
      } catch {}

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: contract.freelancerId,
        type: 'milestone',
        title: 'Escrow Payment Released! 💰',
        body: `${senderName} approved your milestone. $${approvedAmount.toLocaleString()} has been credited.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        targetView: 'contracts',
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    addToast('success', 'Escrow Released!', `$${approvedAmount.toLocaleString()} successfully paid to freelancer.`);
    triggerCelebration();
  }, [contracts, currentUser, addToast, triggerCelebration]);

  // Action: Request Revision
  const requestRevision = useCallback((contractId: string, milestoneId: string, reason: string) => {
    let updatedMilestones: Milestone[] = [];

    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        updatedMilestones = (c.milestones || []).map((m) =>
          m.id === milestoneId ? { ...m, status: 'in_progress' as const } : m
        );
        return {
          ...c,
          status: 'revision_requested',
          revisionCount: (c.revisionCount || 0) + 1,
          milestones: updatedMilestones,
        };
      })
    );

    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      const senderName = currentUser?.fullName || contract.clientName;
      const senderId = currentUser?.id || contract.clientId;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        orderId: contractId,
        senderId,
        senderName,
        senderAvatar: currentUser?.avatarUrl || contract.clientAvatar,
        senderRole: 'client',
        content: `🔄 **Revision Requested**: ${reason}`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setMessages((prev) => [...prev, msg]);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        fetch(`${apiUrl}/api/marketplace/orders/${contractId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        }).catch(() => {});

        fetch(`${apiUrl}/api/marketplace/contracts/${contractId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'revision_requested',
            milestones: updatedMilestones,
            revisionCount: (contract.revisionCount || 0) + 1,
          }),
        }).catch(() => {});
      } catch {}
    }

    addToast('info', 'Revision Requested', 'Feedback shared with freelancer for updates.');
  }, [contracts, currentUser, addToast]);

  // Action: Decline Bid
  const declineBid = useCallback((bidId: string) => {
    setBids((prev) =>
      prev.map((b) => (String(b.id).trim() === String(bidId).trim() ? { ...b, status: 'rejected' as const } : b))
    );
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/api/marketplace/bids/${bidId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      }).catch(() => {});
    } catch {}
    addToast('info', 'Proposal Declined', 'The proposal has been marked as declined.');
  }, [addToast]);

  // Action: Freelancer marks final work handover complete
  const markWorkHandoverComplete = useCallback((contractId: string, handoverNotes: string) => {
    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        return {
          ...c,
          status: 'delivered' as const,
          handoverNotes,
          deliveredAt: new Date().toISOString(),
        };
      })
    );

    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      const senderName = currentUser?.fullName || contract.freelancerName;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        orderId: contractId,
        senderId: currentUser?.id || contract.freelancerId,
        senderName,
        senderAvatar: currentUser?.avatarUrl || contract.freelancerAvatar,
        senderRole: 'freelancer',
        content: `🏁 **Final Project Handover Submitted!**\n"${handoverNotes}"\nReady for client final review & escrow completion sign-off.`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setMessages((prev) => [...prev, msg]);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        fetch(`${apiUrl}/api/marketplace/orders/${contractId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        }).catch(() => {});

        fetch(`${apiUrl}/api/marketplace/contracts/${contractId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'delivered',
            handoverNotes,
            deliveredAt: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch {}

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: contract.clientId,
        type: 'milestone',
        title: 'Final Handover Submitted! 🏁',
        body: `${senderName} submitted final project handover. Review deliverables to complete contract.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        targetView: 'contracts',
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    addToast('success', 'Final Handover Submitted!', 'Client notified to sign off and close the contract.');
    triggerCelebration();
  }, [contracts, currentUser, addToast, triggerCelebration]);

  // Action: Client signs off and completes contract with mutual rating & review
  const completeContract = useCallback((contractId: string, rating = 5, reviewText = 'Outstanding engineering execution and on-time delivery!') => {
    let targetContract: OrderContract | undefined;
    let updatedMilestones: Milestone[] = [];

    setContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        targetContract = c;
        updatedMilestones = (c.milestones || []).map((m) => ({
          ...m,
          status: 'approved' as const,
          approvedAt: m.approvedAt || new Date().toISOString(),
        }));

        return {
          ...c,
          status: 'completed' as const,
          milestones: updatedMilestones,
          completedAt: new Date().toISOString(),
          clientRating: rating,
          clientReview: reviewText,
        };
      })
    );

    if (targetContract) {
      const gigId = targetContract.gigId;
      setGigs((prev) =>
        prev.map((g) => (String(g.id).trim() === String(gigId).trim() ? { ...g, status: 'completed' as const } : g))
      );

      // Increment stats in currentUser
      setCurrentUser((prev) => {
        if (!prev) return prev;
        if (prev.id === targetContract?.freelancerId) {
          return {
            ...prev,
            completedProjects: (prev.completedProjects || 0) + 1,
            totalEarned: (prev.totalEarned || 0) + (targetContract?.amount || 0),
            rating: rating,
          };
        }
        if (prev.id === targetContract?.clientId) {
          return {
            ...prev,
            completedProjects: (prev.completedProjects || 0) + 1,
            totalSpent: (prev.totalSpent || 0) + (targetContract?.amount || 0),
          };
        }
        return prev;
      });

      const senderName = currentUser?.fullName || targetContract.clientName;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        orderId: contractId,
        senderId: currentUser?.id || targetContract.clientId,
        senderName,
        senderAvatar: currentUser?.avatarUrl || targetContract.clientAvatar,
        senderRole: 'client',
        content: `🏆 **Contract Successfully Completed & Closed!**\n⭐ Client Rating: ${rating}/5 Stars\n💬 Review: "${reviewText}"\nAll escrow funds have been 100% disbursed. Thank you for the collaboration!`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setMessages((prev) => [...prev, msg]);

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        fetch(`${apiUrl}/api/marketplace/orders/${contractId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        }).catch(() => {});

        fetch(`${apiUrl}/api/marketplace/contracts/${contractId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
            milestones: updatedMilestones,
            completedAt: new Date().toISOString(),
            clientRating: rating,
            clientReview: reviewText,
          }),
        }).catch(() => {});
      } catch {}

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: targetContract.freelancerId,
        type: 'contract',
        title: 'Contract Successfully Completed! 🏆',
        body: `${senderName} approved final handover and rated you ${rating}★! Escrow is 100% unlocked.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        targetView: 'contracts',
      };
      setNotifications((prev) => [notif, ...prev]);
    }

    addToast('success', 'Contract Completed!', '100% of escrow disbursed and rating submitted.');
    triggerCelebration();
  }, [contracts, currentUser, addToast, triggerCelebration]);

  // Action: Submit Verification (Connected to Backend & Admin Queue)
  const submitVerification = useCallback((data: Omit<VerificationSubmission, 'id' | 'userId' | 'userName' | 'userEmail' | 'status' | 'submittedAt'>): VerificationSubmission => {
    const user = currentUser || {
      id: `freelancer-${Date.now()}`,
      email: 'applicant@example.com',
      fullName: 'Verification Applicant',
      role: 'freelancer',
      roles: ['freelancer'],
      professionalTitle: data.professionalTitle,
      avatarUrl: data.selfieUrl,
      rating: 5.0,
      reviewsCount: 0,
      completedProjects: 0,
      isVerified: false,
      bio: data.pitchStatement,
      skills: data.skillTags,
    };

    const newVerif: VerificationSubmission = {
      ...data,
      id: `verif-${Date.now()}`,
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    setVerifications((prev) => {
      const filtered = (prev || []).filter((v) => v.id !== newVerif.id && v.userId !== newVerif.userId);
      const updated = [newVerif, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Backend sync
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/api/marketplace/verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVerif),
      })
        .then((r) => r.json())
        .then(() => fetchGigsFromBackend())
        .catch(() => {});
    } catch {}

    addToast('success', 'Verification Submitted!', 'Admin team will review your credentials.');
    triggerCelebration();
    return newVerif;
  }, [currentUser, addToast, triggerCelebration, fetchGigsFromBackend]);

  // Action: Review Verification (Admin Decision & Badge Update)
  const reviewVerification = useCallback((verificationId: string, status: 'approved' | 'rejected' | 'under_review', adminComment: string) => {
    let candidateName = '';
    let candidateId = '';

    setVerifications((prev) => {
      const updated = prev.map((v) => {
        if (String(v.id).trim() === String(verificationId).trim()) {
          candidateName = v.userName;
          candidateId = v.userId;
          return {
            ...v,
            status,
            adminComment,
            reviewedBy: currentUser?.id || 'admin',
            reviewedAt: new Date().toISOString(),
          };
        }
        return v;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // If current logged-in user is the candidate, grant/revoke verified badge
    if (candidateId && currentUser?.id === candidateId) {
      setCurrentUser((prev) => (prev ? { ...prev, isVerified: status === 'approved' } : null));
    }

    // Backend API sync
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/api/marketplace/verifications/${verificationId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminComment }),
      })
        .then((r) => r.json())
        .then(() => fetchGigsFromBackend())
        .catch(() => {});
    } catch {}

    addToast(
      status === 'approved' ? 'success' : 'info',
      `Verification ${status.toUpperCase()}`,
      `Candidate ${candidateName || 'specialist'} was updated.`
    );
    if (status === 'approved') {
      triggerCelebration();
    }
  }, [currentUser, addToast, triggerCelebration, fetchGigsFromBackend]);

  // Action: Admin Update Gig
  const adminUpdateGig = useCallback(async (gigId: string, data: Partial<Gig> & { action?: string }) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${apiUrl}/api/marketplace/admin/gigs/${gigId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      await fetchGigsFromBackend();
      addToast('success', 'Project Updated', 'Admin changes applied to project scope.');
    } catch (err: any) {
      addToast('error', 'Admin Action Failed', err?.message || 'Failed to update gig.');
    }
  }, [fetchGigsFromBackend, addToast]);

  // Action: Admin Update Contract / Escrow Dispute
  const adminUpdateContract = useCallback(async (contractId: string, action: 'release_escrow' | 'refund_client' | 'mark_disputed', resolutionNotes?: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      await fetch(`${apiUrl}/api/marketplace/admin/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, resolutionNotes }),
      });
      await fetchGigsFromBackend();
      addToast('success', 'Escrow Action Applied', `Resolution executed: ${action.replace('_', ' ').toUpperCase()}`);
    } catch (err: any) {
      addToast('error', 'Admin Action Failed', err?.message || 'Failed to apply escrow action.');
    }
  }, [fetchGigsFromBackend, addToast]);

  // Action: Send Chat Message
  const sendMessage = useCallback((orderId: string, content: string, attachments: string[] = []) => {
    if (!content.trim() && attachments.length === 0) return;

    const senderName = currentUser?.fullName || (currentUser?.role === 'freelancer' ? 'Professional Freelancer' : 'Enterprise Client');
    const senderId = currentUser?.id || `user-${Date.now()}`;
    const senderRole = currentUser?.role || 'client';
    const senderAvatar = currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user';

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId,
      senderId,
      senderName,
      senderAvatar,
      senderRole,
      content,
      attachments,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => {
      const updated = [...(prev || []), newMsg];
      try {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Sync to backend chat API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      fetch(`${apiUrl}/api/marketplace/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newMsg.id,
          senderId,
          senderName,
          senderAvatar,
          senderRole,
          content,
          attachments,
        }),
      }).catch(() => {});
    } catch {}
  }, [currentUser]);

  // Notification helpers
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      setCurrentUser,
      categories,
      gigs,
      bids,
      contracts,
      messages,
      verifications,
      notifications,
      toasts,
      activeView,
      setActiveView,
      selectedGigId,
      setSelectedGigId,
      selectedContractId,
      setSelectedContractId,
      isAuthModalOpen,
      setIsAuthModalOpen,
      authMode,
      setAuthMode,
      isSyncingGigs,
      refreshGigs,
      adminStats,
      login,
      signup,
      adminLogin,
      logout,
      createGig,
      submitBid,
      acceptBidAndCreateContract,
      declineBid,
      submitDeliverable,
      approveMilestoneAndReleaseEscrow,
      markWorkHandoverComplete,
      completeContract,
      requestRevision,
      submitVerification,
      reviewVerification,
      adminUpdateGig,
      adminUpdateContract,
      sendMessage,
      markNotificationRead,
      markAllNotificationsRead,
      addToast,
      removeToast,
      triggerCelebration,
    }),
    [
      currentUser,
      categories,
      gigs,
      bids,
      contracts,
      messages,
      verifications,
      notifications,
      toasts,
      activeView,
      selectedGigId,
      selectedContractId,
      isAuthModalOpen,
      authMode,
      isSyncingGigs,
      refreshGigs,
      adminStats,
      login,
      signup,
      adminLogin,
      logout,
      createGig,
      submitBid,
      acceptBidAndCreateContract,
      declineBid,
      submitDeliverable,
      approveMilestoneAndReleaseEscrow,
      markWorkHandoverComplete,
      completeContract,
      requestRevision,
      submitVerification,
      reviewVerification,
      adminUpdateGig,
      adminUpdateContract,
      sendMessage,
      markNotificationRead,
      markAllNotificationsRead,
      addToast,
      removeToast,
      triggerCelebration,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
