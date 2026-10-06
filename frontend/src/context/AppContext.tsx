import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  MilestonePaymentDetails,
  MilestonePaymentProof,
  SupportTicket,
  SupportTicketMessage,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  CollaborationHistory,
} from '../types';
import { supabase } from '../lib/supabase';
import { mockGigs, mockBids, mockCategories, mockVerifications } from '../data/mockData';

export type AppView = 'gigs' | 'client' | 'freelancer' | 'contracts' | 'admin' | 'verification' | 'auth' | 'login' | 'signup';

export const standardCategories: Category[] = mockCategories;

export interface FreelancerReviewItem {
  rating: number;
  review: string;
  clientName: string;
  clientAvatar?: string;
  gigTitle: string;
  date: string;
}

export interface FreelancerRatingStats {
  averageRating: number;
  reviewsCount: number;
  hasClientReviews: boolean;
  reviews: FreelancerReviewItem[];
}

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
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  clientTickets: number;
  freelancerTickets: number;
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
  tickets: SupportTicket[];
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
  getFreelancerRating: (freelancerId: string) => FreelancerRatingStats;
  
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
  approveMilestoneAndReleaseEscrow: (contractId: string, milestoneId: string, paymentProof?: MilestonePaymentProof) => void;
  updateFreelancerPaymentDetails: (contractId: string, milestoneId: string | undefined, paymentDetails: MilestonePaymentDetails) => void;
  submitMilestonePaymentProof: (contractId: string, milestoneId: string, proof: MilestonePaymentProof) => void;
  confirmMilestonePayment: (contractId: string, milestoneId: string) => void;
  markWorkHandoverComplete: (contractId: string, handoverNotes: string) => void;
  completeContract: (contractId: string, rating?: number, reviewText?: string) => void;
  requestRevision: (contractId: string, milestoneId: string, reason: string) => void;
  submitVerification: (data: Omit<VerificationSubmission, 'id' | 'userId' | 'userName' | 'userEmail' | 'status' | 'submittedAt'>) => VerificationSubmission;
  reviewVerification: (verificationId: string, status: 'approved' | 'rejected' | 'under_review', adminComment: string) => void;
  adminUpdateGig: (gigId: string, data: Partial<Gig> & { action?: string }) => Promise<void>;
  adminUpdateContract: (contractId: string, action: 'release_escrow' | 'refund_client' | 'mark_disputed', resolutionNotes?: string) => Promise<void>;
  sendMessage: (orderId: string, content: string, attachments?: string[]) => void;

  // Support Desk Actions
  isSupportModalOpen: boolean;
  setIsSupportModalOpen: (open: boolean) => void;
  activeSupportTicketId: string | null;
  setActiveSupportTicketId: (id: string | null) => void;
  openSupportModal: (ticketId?: string) => void;
  createSupportTicket: (data: {
    subject: string;
    category: TicketCategory;
    priority: TicketPriority;
    description: string;
    contractId?: string;
    contractTitle?: string;
    gigId?: string;
    gigTitle?: string;
    attachments?: string[];
  }) => Promise<SupportTicket | null>;
  sendTicketMessage: (ticketId: string, content: string, attachments?: string[]) => Promise<void>;
  adminUpdateTicket: (ticketId: string, data: { status?: TicketStatus; priority?: TicketPriority; adminNotes?: string }) => Promise<void>;

  // Collaboration & Domain Network Actions
  getCollaborationBetween: (clientId?: string, freelancerId?: string, domain?: string) => CollaborationHistory | null;
  getRepeatCollaboratorsForClient: (clientId?: string) => CollaborationHistory[];
  getRepeatClientsForFreelancer: (freelancerId?: string) => CollaborationHistory[];
  createDirectContract: (data: {
    freelancerId: string;
    freelancerName?: string;
    freelancerAvatar?: string;
    title: string;
    categoryName: string;
    amount: number;
    deadline?: string;
    milestones?: { title: string; amount: number }[];
    note?: string;
  }) => Promise<OrderContract | null>;
  acceptContractOffer: (contractId: string) => Promise<void>;
  declineContractOffer: (contractId: string, reason?: string) => Promise<void>;
  cancelContractOffer: (contractId: string) => Promise<void>;

  // Invoice & Receipt Actions
  isInvoiceModalOpen: boolean;
  setIsInvoiceModalOpen: (open: boolean) => void;
  activeInvoiceContractId: string | null;
  setActiveInvoiceContractId: (id: string | null) => void;
  openInvoiceModal: (contractId?: string) => void;

  // Direct Contract Modal Actions
  isDirectContractModalOpen: boolean;
  setIsDirectContractModalOpen: (open: boolean) => void;
  directContractFreelancer: Persona | CollaborationHistory | null;
  setDirectContractFreelancer: (partner: Persona | CollaborationHistory | null) => void;
  openDirectContractModal: (partner: Persona | CollaborationHistory) => void;

  // Notification & System Helpers
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
  TICKETS: 'fs_real_tickets',
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

export const getFreelancerRatingStats = (freelancerId: string, allContracts: OrderContract[]): FreelancerRatingStats => {
  const cleanId = String(freelancerId || '').trim();
  const rated = (allContracts || []).filter(
    (c) =>
      (String(c.freelancerId).trim() === cleanId || (c.freelancerName && cleanId.includes(c.freelancerName.toLowerCase()))) &&
      c.status === 'completed' &&
      typeof c.clientRating === 'number' &&
      c.clientRating > 0
  );

  if (rated.length === 0) {
    return {
      averageRating: 5.0,
      reviewsCount: 0,
      hasClientReviews: false,
      reviews: [],
    };
  }

  const sum = rated.reduce((acc, c) => acc + Number(c.clientRating), 0);
  const averageRating = Math.round((sum / rated.length) * 10) / 10;

  return {
    averageRating,
    reviewsCount: rated.length,
    hasClientReviews: true,
    reviews: rated.map((c) => ({
      rating: Number(c.clientRating) || 5,
      review: c.clientReview || 'Verified project completion with full escrow release.',
      clientName: c.clientName || 'Enterprise Client',
      clientAvatar: c.clientAvatar,
      gigTitle: c.gigTitle,
      date: c.completedAt || c.createdAt,
    })),
  };
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return ''; // Same-origin relative path on Vercel deployment
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl !== undefined && envUrl !== '') {
    return envUrl;
  }
  return 'http://localhost:4000';
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
  const rawAmt = Number(raw.amount || 1000);
  const m1Amt = Math.round(rawAmt * 0.3);
  const m2Amt = Math.round(rawAmt * 0.4);
  const m3Amt = rawAmt - m1Amt - m2Amt;

  const rawMilestones = Array.isArray(raw.milestones) && raw.milestones.length > 0
    ? raw.milestones
    : [
        {
          id: `m-${raw.id || Date.now()}-0`,
          title: 'System Architecture & Schema Design',
          amount: m1Amt,
          status: isCompleted ? 'approved' : ((raw.deliverables && raw.deliverables.length > 0) || raw.status === 'delivered' ? 'submitted' : 'in_progress'),
          deliverableNote: (raw.deliverables && raw.deliverables[0]?.description) || undefined,
          deliverableFiles: (raw.deliverables && raw.deliverables[0]?.files) || [],
          submittedAt: (raw.deliverables && raw.deliverables[0]?.submittedAt) || undefined,
          deadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        },
        {
          id: `m-${raw.id || Date.now()}-1`,
          title: 'Core Functionality & API Integration',
          amount: m2Amt,
          status: isCompleted ? 'approved' : 'pending',
          deadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        },
        {
          id: `m-${raw.id || Date.now()}-2`,
          title: 'Production Polish, Testing & Deployment',
          amount: m3Amt,
          status: isCompleted ? 'approved' : 'pending',
          deadline: raw.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        },
      ];

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
    paymentDetails: m.paymentDetails || m.payment_details || (raw.upiId ? { upiId: raw.upiId, phoneNumber: raw.phoneNumber, qrCodeUrl: raw.qrCodeUrl } : undefined),
    paymentProof: m.paymentProof || m.payment_proof,
    paymentStatus: m.paymentStatus || m.payment_status || (isCompleted ? 'settled' : (m.paymentProof || m.payment_proof) ? 'proof_submitted' : 'unpaid'),
  }));

  const isPendingAcceptance = raw.status === 'pending_acceptance';
  const allMilestonesApproved = normalizedMilestones.length > 0 && normalizedMilestones.every((m) => m.status === 'approved');
  const contractStatus = isPendingAcceptance
    ? 'pending_acceptance'
    : (allMilestonesApproved || isCompleted)
    ? 'completed'
    : (raw.status === 'delivered' && !normalizedMilestones.every((m) => m.status === 'submitted' || m.status === 'approved'))
    ? 'in_progress'
    : (raw.status || 'in_progress');

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
    status: contractStatus as any,
    amount: rawAmt,
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
    categoryId: raw.categoryId || raw.category_id,
    categoryName: raw.categoryName || raw.category_name || (raw.gigTitle?.toLowerCase().includes('design') ? 'UI/UX Design Systems' : raw.gigTitle?.toLowerCase().includes('ai') ? 'AI & Machine Learning' : raw.gigTitle?.toLowerCase().includes('mobile') ? 'Mobile App Development' : 'Full-Stack Architecture'),
    upiId: raw.upiId,
    phoneNumber: raw.phoneNumber,
    qrCodeUrl: raw.qrCodeUrl,
    isDirectAssignment: Boolean(raw.isDirectAssignment ?? raw.is_direct_assignment ?? false),
    invitationNote: raw.invitationNote || raw.invitation_note,
    clientAccepted: Boolean(raw.clientAccepted ?? raw.client_accepted ?? true),
    freelancerAccepted: Boolean(raw.freelancerAccepted ?? raw.freelancer_accepted ?? false),
    acceptedAt: raw.acceptedAt || raw.accepted_at,
    declinedAt: raw.declinedAt || raw.declined_at,
    declineReason: raw.declineReason || raw.decline_reason,
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

const isUUID = (str?: string | null): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || '').trim());

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

export const normalizeTicketMessage = (raw: any): SupportTicketMessage => {
  return {
    id: String(raw.id || `msg-tck-${Date.now()}`),
    ticketId: String(raw.ticketId || raw.ticket_id || ''),
    senderId: String(raw.senderId || raw.sender_id || 'unknown'),
    senderName: raw.senderName || raw.sender_name || 'User',
    senderRole: (raw.senderRole || raw.sender_role || 'client') as any,
    senderAvatar: raw.senderAvatar || raw.sender_avatar,
    content: raw.content || '',
    attachments: Array.isArray(raw.attachments) ? raw.attachments : typeof raw.attachments === 'string' && raw.attachments ? [raw.attachments] : [],
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
};

export const normalizeTicket = (raw: any): SupportTicket => {
  const messages = Array.isArray(raw.messages) ? raw.messages.map(normalizeTicketMessage) : [];
  return {
    id: String(raw.id || `ticket-${Date.now()}`),
    ticketNumber: raw.ticketNumber || `#TCK-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: String(raw.userId || raw.user_id || 'user-unknown'),
    userName: raw.userName || raw.user_name || 'User',
    userEmail: raw.userEmail || raw.user_email || 'user@platform.dev',
    userRole: (raw.userRole || raw.user_role || 'client') as any,
    userAvatar: raw.userAvatar || raw.user_avatar,
    subject: raw.subject || 'Support Inquiry',
    category: (raw.category || 'general') as any,
    priority: (raw.priority || 'medium') as any,
    status: (raw.status || 'open') as any,
    description: raw.description || '',
    contractId: raw.contractId || raw.contract_id,
    contractTitle: raw.contractTitle || raw.contract_title,
    gigId: raw.gigId || raw.gig_id,
    gigTitle: raw.gigTitle || raw.gig_title,
    attachments: Array.isArray(raw.attachments) ? raw.attachments : typeof raw.attachments === 'string' && raw.attachments ? [raw.attachments] : [],
    messages,
    adminNotes: raw.adminNotes || raw.admin_notes || '',
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.updated_at || raw.createdAt || new Date().toISOString(),
    resolvedAt: raw.resolvedAt || raw.resolved_at,
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

  // Support Desk modal state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);

  // Invoice & Receipt modal state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [activeInvoiceContractId, setActiveInvoiceContractId] = useState<string | null>(null);

  // Direct Contract Modal state
  const [isDirectContractModalOpen, setIsDirectContractModalOpen] = useState<boolean>(false);
  const [directContractFreelancer, setDirectContractFreelancer] = useState<Persona | CollaborationHistory | null>(null);

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

  // 3. Projects, Bids, Contracts, Verifications, and Support Tickets State
  const [gigs, setGigs] = useState<Gig[]>(() => safeParse(STORAGE_KEYS.GIGS, mockGigs));
  const [bids, setBids] = useState<Bid[]>(() => safeParse(STORAGE_KEYS.BIDS, mockBids));
  const [contracts, setContracts] = useState<OrderContract[]>(() => safeParse(STORAGE_KEYS.CONTRACTS, []));
  const [messages, setMessages] = useState<ChatMessage[]>(() => safeParse(STORAGE_KEYS.MESSAGES, []));
  const [verifications, setVerifications] = useState<VerificationSubmission[]>(() => safeParse(STORAGE_KEYS.VERIFICATIONS, mockVerifications));
  const [tickets, setTickets] = useState<SupportTicket[]>(() => safeParse(STORAGE_KEYS.TICKETS, []));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => safeParse(STORAGE_KEYS.NOTIFICATIONS, []));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const isFetchingRef = useRef<boolean>(false);

  // Fetch gigs, bids, contracts, messages, and verifications from backend API and sync with state
  const fetchGigsFromBackend = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const apiUrl = getApiBaseUrl();
      
      const [contractsRes, gigsRes, bidsRes, messagesRes, verifsRes, ticketsRes] = await Promise.allSettled([
        fetch(`${apiUrl}/api/marketplace/contracts`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${apiUrl}/api/marketplace/gigs`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${apiUrl}/api/marketplace/bids`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${apiUrl}/api/marketplace/messages`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${apiUrl}/api/marketplace/verifications`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${apiUrl}/api/marketplace/tickets`).then((r) => (r.ok ? r.json() : null)),
      ]);

      // 1. Process Contracts
      let completedContractGigIds = new Set<string>();
      if (contractsRes.status === 'fulfilled' && contractsRes.value?.contracts) {
        const backendContracts: OrderContract[] = contractsRes.value.contracts.map(normalizeContract);
        completedContractGigIds = new Set(
          backendContracts
            .filter((c) => c.status === 'completed' && c.gigId)
            .map((c) => String(c.gigId).trim())
        );

        setContracts((prev) => {
          const contractMap = new Map<string, OrderContract>();
          for (const c of prev || []) contractMap.set(String(c.id).trim(), c);
          for (const bc of backendContracts) contractMap.set(String(bc.id).trim(), bc);
          const combined = Array.from(contractMap.values());
          combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          try { localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(combined)); } catch {}
          return combined;
        });
      }

      // 2. Process Bids (Strict unique key: gigId + freelancerKey)
      let backendBidsList: Bid[] = [];
      if (bidsRes.status === 'fulfilled' && bidsRes.value?.bids) {
        backendBidsList = bidsRes.value.bids.map(normalizeBid);
        setBids(() => {
          const bidMap = new Map<string, Bid>();
          for (const bb of backendBidsList) {
            const key = `${String(bb.gigId).trim()}__${String(bb.freelancerId || bb.freelancerName || bb.id).trim()}`;
            bidMap.set(key, bb);
          }
          const combined = Array.from(bidMap.values());
          combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          try { localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(combined)); } catch {}
          return combined;
        });
      }

      // 3. Process Gigs with accurate Proposal Count & Strict Canonical Deduplication
      if (gigsRes.status === 'fulfilled' && gigsRes.value?.gigs) {
        const backendGigs: Gig[] = gigsRes.value.gigs.map(normalizeGig);
        setGigs((prev) => {
          const gigMap = new Map<string, Gig>();
          const canonicalKeyToIdMap = new Map<string, string>();

          const getCanonicalKey = (g: Gig) => {
            const cleanTitle = String(g.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanClientId = String(g.clientId || '').trim().toLowerCase();
            return cleanTitle ? `${cleanTitle}__${cleanClientId}` : String(g.id).trim();
          };

          for (const g of prev || []) {
            const key = getCanonicalKey(g);
            gigMap.set(String(g.id).trim(), g);
            if (key) canonicalKeyToIdMap.set(key, String(g.id).trim());
          }

          for (const bg of backendGigs) {
            const isGigCompleted = bg.status === 'completed' || completedContractGigIds.has(String(bg.id).trim());
            const key = getCanonicalKey(bg);
            const existingId = canonicalKeyToIdMap.get(key);

            if (existingId && existingId !== String(bg.id).trim()) {
              gigMap.delete(existingId);
            }

            const updatedBg = isGigCompleted ? { ...bg, status: 'completed' as const } : bg;
            gigMap.set(String(bg.id).trim(), updatedBg);
            if (key) {
              canonicalKeyToIdMap.set(key, String(bg.id).trim());
            }
          }

          // Strict final canonical deduplication pass
          const finalMap = new Map<string, Gig>();
          for (const g of gigMap.values()) {
            const key = getCanonicalKey(g);
            if (!finalMap.has(key)) {
              finalMap.set(key, g);
            } else {
              // Keep preferred non-default category
              const existing = finalMap.get(key)!;
              const preferredCategoryName = (!existing.categoryName || existing.categoryName === 'Full-Stack Architecture') && g.categoryName && g.categoryName !== 'Full-Stack Architecture'
                ? g.categoryName
                : existing.categoryName;
              const preferredCategoryId = (!existing.categoryId || existing.categoryId === 'fullstack') && g.categoryId && g.categoryId !== 'fullstack'
                ? g.categoryId
                : existing.categoryId;
              finalMap.set(key, {
                ...existing,
                categoryName: preferredCategoryName,
                categoryId: preferredCategoryId,
              });
            }
          }

          const combined = Array.from(finalMap.values()).map((g) => {
            const matchingBids = backendBidsList.filter((b) => String(b.gigId).trim() === String(g.id).trim());
            return {
              ...g,
              status: completedContractGigIds.has(String(g.id).trim()) ? ('completed' as const) : g.status,
              proposalsCount: matchingBids.length > 0 ? matchingBids.length : (g.proposalsCount || 0),
            };
          });
          combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          try { localStorage.setItem(STORAGE_KEYS.GIGS, JSON.stringify(combined)); } catch {}
          return combined;
        });
      }

      // 4. Process Messages
      if (messagesRes.status === 'fulfilled' && messagesRes.value?.messages) {
        const backendMessages: ChatMessage[] = messagesRes.value.messages.map(normalizeMessage);
        setMessages((prev) => {
          const msgMap = new Map<string, ChatMessage>();
          for (const m of prev || []) msgMap.set(String(m.id).trim(), m);
          for (const bm of backendMessages) msgMap.set(String(bm.id).trim(), bm);
          const combined = Array.from(msgMap.values());
          combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          try { localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(combined)); } catch {}
          return combined;
        });
      }

      // 5. Process Verifications
      let backendVerifs: VerificationSubmission[] = [];
      if (verifsRes.status === 'fulfilled' && verifsRes.value?.verifications && Array.isArray(verifsRes.value.verifications)) {
        backendVerifs = verifsRes.value.verifications.map(normalizeVerification);
      }

      // Always query Supabase directly and enrich with profiles to guarantee zero data loss
      try {
        const [{ data: directVerifs }, { data: directProfiles }] = await Promise.all([
          supabase.from('freelancer_verifications').select('*'),
          supabase.from('profiles').select('*'),
        ]);

        if (directVerifs && Array.isArray(directVerifs) && directVerifs.length > 0) {
          const profileMap = new Map<string, any>();
          if (directProfiles && Array.isArray(directProfiles)) {
            for (const p of directProfiles) {
              if (p.id) profileMap.set(p.id, p);
            }
          }

          const directMapped = directVerifs.map((dv) => {
            const p = profileMap.get(dv.user_id);
            return normalizeVerification({
              ...dv,
              userName: p?.full_name || dv.user_name || 'Applicant',
              userEmail: p?.email || dv.user_email || 'applicant@example.com',
              professionalTitle: p?.professional_title || dv.professional_title || 'Software Specialist',
              selfieUrl: dv.selfie_url || p?.avatar_url,
            });
          });

          const map = new Map<string, VerificationSubmission>();
          for (const bv of backendVerifs) {
            const key = `${String(bv.userId || '').trim()}__${(bv.userEmail || '').toLowerCase()}`;
            map.set(key || bv.id, bv);
          }
          for (const dv of directMapped) {
            const key = `${String(dv.userId || '').trim()}__${(dv.userEmail || '').toLowerCase()}`;
            if (!map.has(key) && !map.has(dv.id)) {
              map.set(key || dv.id, dv);
            } else {
              const existingKey = map.has(key) ? key : dv.id;
              const existing = map.get(existingKey)!;
              map.set(existingKey, {
                ...existing,
                ...dv,
                userName: dv.userName && dv.userName !== 'Applicant' ? dv.userName : existing.userName,
                userEmail: dv.userEmail && dv.userEmail !== 'applicant@example.com' ? dv.userEmail : existing.userEmail,
              });
            }
          }
          backendVerifs = Array.from(map.values());
        }
      } catch {}

      if (backendVerifs.length > 0) {
        setVerifications((prev) => {
          const verifMap = new Map<string, VerificationSubmission>();
          for (const v of prev || []) {
            const key = `${String(v.userId || '').trim()}__${(v.userEmail || '').toLowerCase()}`;
            verifMap.set(key || v.id, v);
          }
          for (const bv of backendVerifs) {
            const key = `${String(bv.userId || '').trim()}__${(bv.userEmail || '').toLowerCase()}`;
            verifMap.set(key || bv.id, bv);
          }
          const combined = Array.from(verifMap.values());
          combined.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          try { localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(combined)); } catch {}

          setCurrentUser((curr) => {
            if (!curr || curr.role !== 'freelancer') return curr;
            const myVerif = combined.find(
              (v) => v.userId === curr.id || (v.userEmail && v.userEmail.toLowerCase() === curr.email?.toLowerCase())
            );
            const isApproved = myVerif?.status === 'approved';
            if (curr.isVerified !== isApproved) {
              return { ...curr, isVerified: isApproved };
            }
            return curr;
          });

          return combined;
        });
      }

      // 6. Process Tickets
      if (ticketsRes.status === 'fulfilled' && ticketsRes.value?.tickets) {
        const backendTickets: SupportTicket[] = ticketsRes.value.tickets.map(normalizeTicket);
        setTickets((prev) => {
          const ticketMap = new Map<string, SupportTicket>();
          for (const t of prev || []) ticketMap.set(String(t.id).trim(), t);
          for (const bt of backendTickets) ticketMap.set(String(bt.id).trim(), bt);
          const combined = Array.from(ticketMap.values());
          combined.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
          try { localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(combined)); } catch {}
          return combined;
        });
      }
    } catch (err) {
      console.warn('Sync background fetch notice:', err);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Background polling: lightweight 15s interval and on view change
  useEffect(() => {
    fetchGigsFromBackend();
    const interval = setInterval(() => {
      fetchGigsFromBackend();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchGigsFromBackend]);

  useEffect(() => {
    fetchGigsFromBackend();
  }, [activeView, fetchGigsFromBackend]);

  // Explicit manual refresh
  const refreshGigs = useCallback(async () => {
    setIsSyncingGigs(true);
    await fetchGigsFromBackend();
    setTimeout(() => setIsSyncingGigs(false), 300);
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

    const completedGigIds = new Set(
      contracts
        .filter((c) => c.status === 'completed' && c.gigId)
        .map((c) => String(c.gigId).trim())
    );
    const totalGigs = gigs.length;
    const completedGigs = gigs.filter((g) => g.status === 'completed' || completedGigIds.has(String(g.id).trim())).length;
    const openGigs = gigs.filter((g) => (g.status || 'open') === 'open' && !completedGigIds.has(String(g.id).trim())).length;
    const awardedGigs = gigs.filter((g) => (g.status === 'awarded' || (g.status as any) === 'in_progress') && !completedGigIds.has(String(g.id).trim())).length;

    const totalBids = bids.length;
    const pendingBids = bids.filter((b) => (b.status || 'pending') === 'pending').length;
    const acceptedBids = bids.filter((b) => b.status === 'accepted').length;

    const pendingVerifs = verifications.filter((v) => v.status === 'pending' || v.status === 'under_review').length;
    const approvedVerifs = verifications.filter((v) => v.status === 'approved').length;

    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status === 'open').length;
    const inProgressTickets = tickets.filter((t) => t.status === 'in_progress').length;
    const resolvedTickets = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
    const clientTickets = tickets.filter((t) => t.userRole === 'client').length;
    const freelancerTickets = tickets.filter((t) => t.userRole === 'freelancer').length;

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
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      clientTickets,
      freelancerTickets,
    };
  }, [contracts, gigs, bids, verifications, messages, tickets]);

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
      const apiUrl = getApiBaseUrl();
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
          let isVerified = role === 'admin';
          if (role === 'freelancer') {
            const allVerifs: VerificationSubmission[] = verifications.length > 0 ? verifications : safeParse(STORAGE_KEYS.VERIFICATIONS, mockVerifications);
            const found = allVerifs.find(
              (v) => v.userId === payload.user.id || (v.userEmail && v.userEmail.toLowerCase() === cleanEmail)
            );
            isVerified = found?.status === 'approved';
          }

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
            isVerified,
            bio: '',
            skills: [],
          };

          // Guarantee profile row in Supabase
          try {
            await supabase.from('profiles').upsert({
              id: payload.user.id,
              email: cleanEmail,
              full_name: user.fullName,
              role,
              roles: [role],
              is_verified: isVerified,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          } catch {}

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
      let isVerified = role === 'admin';
      if (role === 'freelancer') {
        const allVerifs: VerificationSubmission[] = verifications.length > 0 ? verifications : safeParse(STORAGE_KEYS.VERIFICATIONS, mockVerifications);
        const found = allVerifs.find(
          (v) => v.userId === data.user.id || (v.userEmail && v.userEmail.toLowerCase() === cleanEmail)
        );
        isVerified = found?.status === 'approved';
      }

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
        isVerified,
        bio: '',
        skills: [],
      };

      // Guarantee profile row in Supabase
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: fullName,
          role,
          roles: [role],
          is_verified: isVerified,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch {}

      setCurrentUser(user);
      setIsAuthModalOpen(false);
      setActiveViewState(role as AppView);
      addToast('success', 'Logged In', `Welcome back, ${user.fullName}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed. Please verify your connection.' };
    }
  }, [addToast, verifications]);

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
      const apiUrl = getApiBaseUrl();
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

          // Guarantee profile row in Supabase
          try {
            await supabase.from('profiles').upsert({
              id: payload.user.id,
              email: cleanEmail,
              full_name: cleanName,
              role,
              roles: [role],
              is_verified: role === 'admin',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });
          } catch {}

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
        if (error?.message?.toLowerCase().includes('rate limit')) {
          // Attempt sign in in case user account was already created
          const loginRes = await login(cleanEmail, cleanPass);
          if (loginRes.success) return loginRes;
          return {
            success: false,
            error: 'Supabase email rate limit reached (max 3-4 emails/hr on free tier). Please disable "Confirm email" in Supabase Dashboard -> Authentication -> Providers -> Email, or sign in directly.',
          };
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

      // Guarantee profile row in Supabase
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: cleanName,
          role,
          roles: [role],
          is_verified: role === 'admin',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch {}

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
      const apiUrl = getApiBaseUrl();
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
      const apiUrl = getApiBaseUrl();
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
      const getCanonicalKey = (g: Gig) => {
        const cleanTitle = String(g.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanClientId = String(g.clientId || '').trim().toLowerCase();
        return cleanTitle ? `${cleanTitle}__${cleanClientId}` : String(g.id).trim();
      };
      const newKey = getCanonicalKey(newGig);
      const filtered = (prev || []).filter((g) => g.id !== gigId && getCanonicalKey(g) !== newKey);
      const updated = [newGig, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEYS.GIGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Background sync to backend API
    try {
      const apiUrl = getApiBaseUrl();
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
      const filtered = (prev || []).filter(
        (b) =>
          !(
            String(b.gigId).trim() === cleanGigId &&
            (String(b.freelancerId).trim() === String(fallbackUser.id).trim() ||
              (b.freelancerName && fallbackUser.fullName && b.freelancerName.toLowerCase().trim() === fallbackUser.fullName.toLowerCase().trim()))
          )
      );
      const updated = [newBid, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEYS.BIDS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Update proposal count on target gig directly based on unique proposals
    setGigs((prev) => {
      const updated = (prev || []).map((g) => {
        if (String(g.id).trim() === cleanGigId) {
          return { ...g, proposalsCount: Math.max(1, (g.proposalsCount || 0)) };
        }
        return g;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.GIGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Sync proposal to backend API
    try {
      const apiUrl = getApiBaseUrl();
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
            amount: Number(m.amount || 0),
            status: idx === 0 ? 'in_progress' : 'pending',
            deadline: new Date(Date.now() + (idx + 1) * 7 * 86400000).toISOString().split('T')[0],
          }))
        : [
            {
              id: `m-${Date.now()}-0`,
              title: 'System Architecture & Schema Design',
              amount: Math.round(bid.proposedPrice * 0.3),
              status: 'in_progress',
              deadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            },
            {
              id: `m-${Date.now()}-1`,
              title: 'Core Functionality & API Integration',
              amount: Math.round(bid.proposedPrice * 0.4),
              status: 'pending',
              deadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
            },
            {
              id: `m-${Date.now()}-2`,
              title: 'Production Polish, Testing & Deployment',
              amount: bid.proposedPrice - Math.round(bid.proposedPrice * 0.3) - Math.round(bid.proposedPrice * 0.4),
              status: 'pending',
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
      const apiUrl = getApiBaseUrl();
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
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    const newDeliverable = {
      id: `del-${Date.now()}`,
      milestoneId,
      title,
      description,
      files,
      liveUrl,
      submittedAt: new Date().toISOString(),
    };

    const currentMilestones = contract.milestones && contract.milestones.length > 0 ? contract.milestones : [];
    
    let matched = false;
    const updatedMilestones = currentMilestones.map((m) => {
      if (m.id === milestoneId) {
        matched = true;
        return {
          ...m,
          status: 'submitted' as const,
          deliverableNote: description,
          deliverableFiles: files,
          submittedAt: new Date().toISOString(),
        };
      }
      return m;
    });

    if (!matched && updatedMilestones.length > 0) {
      const inProgIdx = updatedMilestones.findIndex((m) => m.status === 'in_progress');
      const targetIdx = inProgIdx >= 0 ? inProgIdx : 0;
      updatedMilestones[targetIdx] = {
        ...updatedMilestones[targetIdx],
        status: 'submitted' as const,
        deliverableNote: description,
        deliverableFiles: files,
        submittedAt: new Date().toISOString(),
      };
    }

    const updatedDeliverables = [newDeliverable, ...(contract.deliverables || [])];
    const allDoneOrSubmitted = updatedMilestones.length > 0 && updatedMilestones.every(
      (m) => m.status === 'submitted' || m.status === 'approved'
    );
    const nextContractStatus: 'in_progress' | 'delivered' = allDoneOrSubmitted ? 'delivered' : 'in_progress';

    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: nextContractStatus,
              milestones: updatedMilestones,
              deliverables: updatedDeliverables,
            }
          : c
      )
    );

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

    try {
      const apiUrl = getApiBaseUrl();
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

    addToast('success', 'Deliverable Submitted!', 'Client notified to review your submission.');
    triggerCelebration();
  }, [contracts, currentUser, addToast, triggerCelebration]);

  // Action: Update Freelancer Payment Details (UPI, Phone, QR)
  const updateFreelancerPaymentDetails = useCallback((
    contractId: string,
    milestoneId: string | undefined,
    paymentDetails: MilestonePaymentDetails
  ) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    const currentMilestones = contract.milestones || [];
    const updatedMilestones = currentMilestones.map((m) => {
      if (!milestoneId || m.id === milestoneId) {
        return {
          ...m,
          paymentDetails: {
            ...paymentDetails,
            updatedAt: new Date().toISOString(),
          },
        };
      }
      return m;
    });

    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              milestones: updatedMilestones,
              upiId: paymentDetails.upiId || c.upiId,
              phoneNumber: paymentDetails.phoneNumber || c.phoneNumber,
              qrCodeUrl: paymentDetails.qrCodeUrl || c.qrCodeUrl,
            }
          : c
      )
    );

    const senderName = currentUser?.fullName || contract.freelancerName;
    const senderId = currentUser?.id || contract.freelancerId;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      orderId: contractId,
      senderId,
      senderName,
      senderAvatar: currentUser?.avatarUrl || contract.freelancerAvatar,
      senderRole: 'freelancer',
      content: `💳 **Freelancer Payment Coordinates Shared**\n` +
        `• UPI ID: \`${paymentDetails.upiId || 'Not provided'}\`\n` +
        `• Phone: \`${paymentDetails.phoneNumber || 'Not provided'}\`\n` +
        `• Payee Name: \`${paymentDetails.accountName || senderName}\`\n` +
        `${paymentDetails.paymentNote ? `• Instructions: ${paymentDetails.paymentNote}\n` : ''}` +
        `You can scan the QR code or use the UPI ID in the Milestone Settlement panel to send payments.`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, msg]);

    try {
      const apiUrl = getApiBaseUrl();
      fetch(`${apiUrl}/api/marketplace/orders/${contractId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      }).catch(() => {});

      fetch(`${apiUrl}/api/marketplace/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestones: updatedMilestones,
          upiId: paymentDetails.upiId,
          phoneNumber: paymentDetails.phoneNumber,
          qrCodeUrl: paymentDetails.qrCodeUrl,
        }),
      }).catch(() => {});
    } catch {}

    addToast('success', 'Payment Coordinates Updated', 'Client can now transfer funds directly via UPI/Phone/QR.');
  }, [contracts, currentUser, addToast]);

  // Action: Submit Milestone Payment Proof (Client)
  const submitMilestonePaymentProof = useCallback((
    contractId: string,
    milestoneId: string,
    proof: MilestonePaymentProof
  ) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    const currentMilestones = contract.milestones || [];
    let milestoneTitle = 'Milestone';
    const updatedMilestones = currentMilestones.map((m) => {
      if (m.id === milestoneId) {
        milestoneTitle = m.title;
        return {
          ...m,
          paymentProof: {
            ...proof,
            submittedAt: proof.submittedAt || new Date().toISOString(),
            status: 'submitted' as const,
          },
          paymentStatus: 'proof_submitted' as const,
        };
      }
      return m;
    });

    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              milestones: updatedMilestones,
            }
          : c
      )
    );

    const senderName = currentUser?.fullName || contract.clientName;
    const senderId = currentUser?.id || contract.clientId;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      orderId: contractId,
      senderId,
      senderName,
      senderAvatar: currentUser?.avatarUrl || contract.clientAvatar,
      senderRole: 'client',
      content: `📸 **Payment Proof Submitted for Milestone**: "${milestoneTitle}"\n` +
        `• Amount Paid: **$${proof.amountPaid.toLocaleString()}**\n` +
        `• Payment Mode: **${(proof.paymentMode || 'UPI').toUpperCase()}**\n` +
        `• Transaction / UTR Ref: \`${proof.transactionId || 'N/A'}\`\n` +
        `${proof.note ? `• Client Note: ${proof.note}\n` : ''}` +
        `\nScreenshot attached for freelancer confirmation.`,
      attachments: proof.proofUrl ? [proof.proofUrl] : [],
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, msg]);

    try {
      const apiUrl = getApiBaseUrl();
      fetch(`${apiUrl}/api/marketplace/orders/${contractId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      }).catch(() => {});

      fetch(`${apiUrl}/api/marketplace/contracts/${contractId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestones: updatedMilestones,
        }),
      }).catch(() => {});
    } catch {}

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: contract.freelancerId,
      type: 'milestone',
      title: 'Payment Proof Received! 📸',
      body: `${senderName} submitted payment proof ($${proof.amountPaid.toLocaleString()}) for "${milestoneTitle}".`,
      isRead: false,
      createdAt: new Date().toISOString(),
      targetView: 'contracts',
    };
    setNotifications((prev) => [notif, ...prev]);

    addToast('success', 'Payment Proof Submitted!', 'Screenshot and transaction reference shared with freelancer.');
    triggerCelebration();
  }, [contracts, currentUser, addToast, triggerCelebration]);

  // Action: Confirm Milestone Payment (Freelancer Verification)
  const confirmMilestonePayment = useCallback((
    contractId: string,
    milestoneId: string
  ) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    const currentMilestones = contract.milestones || [];
    let approvedAmount = 0;
    let milestoneTitle = 'Milestone';

    const updatedMilestones = currentMilestones.map((m) => {
      if (m.id === milestoneId) {
        milestoneTitle = m.title;
        approvedAmount = Number(m.amount || 0);
        return {
          ...m,
          status: 'approved' as const,
          approvedAt: m.approvedAt || new Date().toISOString(),
          paymentStatus: 'settled' as const,
          paymentProof: m.paymentProof
            ? { ...m.paymentProof, status: 'confirmed' as const, confirmedAt: new Date().toISOString() }
            : { amountPaid: approvedAmount, submittedAt: new Date().toISOString(), status: 'confirmed' as const, confirmedAt: new Date().toISOString() },
        };
      }
      return m;
    });

    let hasActivatedNext = false;
    const finalMilestones = updatedMilestones.map((m) => {
      if (!hasActivatedNext && m.status === 'pending') {
        hasActivatedNext = true;
        return { ...m, status: 'in_progress' as const };
      }
      return m;
    });

    const isAllDone = finalMilestones.length > 0 && finalMilestones.every((m) => m.status === 'approved');
    const nextContractStatus: 'in_progress' | 'completed' = isAllDone ? 'completed' : 'in_progress';
    const completedAt = isAllDone ? new Date().toISOString() : undefined;

    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: nextContractStatus,
              milestones: finalMilestones,
              completedAt,
            }
          : c
      )
    );

    if (isAllDone && contract.gigId) {
      setGigs((prev) =>
        prev.map((g) => (String(g.id).trim() === String(contract.gigId).trim() ? { ...g, status: 'completed' as const } : g))
      );
    }

    setCurrentUser((prev) => {
      if (!prev) return prev;
      if (prev.id === contract.freelancerId) {
        return {
          ...prev,
          totalEarned: (prev.totalEarned || 0) + approvedAmount,
          completedProjects: isAllDone ? (prev.completedProjects || 0) + 1 : prev.completedProjects,
        };
      }
      if (prev.id === contract.clientId) {
        return {
          ...prev,
          totalSpent: (prev.totalSpent || 0) + approvedAmount,
          completedProjects: isAllDone ? (prev.completedProjects || 0) + 1 : prev.completedProjects,
        };
      }
      return prev;
    });

    const senderName = currentUser?.fullName || contract.freelancerName;
    const senderId = currentUser?.id || contract.freelancerId;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      orderId: contractId,
      senderId,
      senderName,
      senderAvatar: currentUser?.avatarUrl || contract.freelancerAvatar,
      senderRole: 'freelancer',
      content: isAllDone
        ? `✅ **Payment Received & All Milestones Settled!**\nFreelancer verified receipt of all milestone payments. Total contract of $${contract.amount.toLocaleString()} is completed!`
        : `✅ **Payment Received & Verified!**\nFreelancer confirmed receipt of $${approvedAmount.toLocaleString()} for "${milestoneTitle}". Milestone marked as settled.`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, msg]);

    try {
      const apiUrl = getApiBaseUrl();
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

      if (isAllDone && contract.gigId) {
        fetch(`${apiUrl}/api/marketplace/gigs/${contract.gigId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        }).catch(() => {});
      }
    } catch {}

    addToast('success', 'Payment Confirmed & Verified ✅', `Milestone escrow of $${approvedAmount.toLocaleString()} settled.`);
    triggerCelebration();
  }, [contracts, currentUser, addToast, triggerCelebration]);

  // Action: Approve Milestone & Release Escrow
  const approveMilestoneAndReleaseEscrow = useCallback((
    contractId: string,
    milestoneId: string,
    paymentProof?: MilestonePaymentProof
  ) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    const currentMilestones = contract.milestones && contract.milestones.length > 0 ? contract.milestones : [];
    
    // Security check: Milestone must be submitted before escrow release
    const targetMilestone = currentMilestones.find((m) => m.id === milestoneId) || currentMilestones.find((m) => m.status === 'submitted');
    if (targetMilestone && targetMilestone.status !== 'submitted' && targetMilestone.status !== 'approved') {
      addToast('warning', 'Deliverable Required', `The freelancer must first submit deliverables for "${targetMilestone.title}" before escrow can be released.`);
      return;
    }

    let approvedAmount = 0;
    let milestoneTitle = 'Milestone';
    
    let matched = false;
    const updatedMilestones = currentMilestones.map((m) => {
      if (m.id === milestoneId) {
        matched = true;
        milestoneTitle = m.title;
        approvedAmount = Number(m.amount || 0);
        return {
          ...m,
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
          paymentStatus: 'settled' as const,
          paymentProof: paymentProof || m.paymentProof || { amountPaid: approvedAmount, submittedAt: new Date().toISOString(), status: 'confirmed' as const },
        };
      }
      return m;
    });

    if (!matched && updatedMilestones.length > 0) {
      const submittedIdx = updatedMilestones.findIndex((m) => m.status === 'submitted');
      if (submittedIdx >= 0) {
        milestoneTitle = updatedMilestones[submittedIdx].title;
        approvedAmount = Number(updatedMilestones[submittedIdx].amount || 0);
        updatedMilestones[submittedIdx] = {
          ...updatedMilestones[submittedIdx],
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
          paymentStatus: 'settled' as const,
          paymentProof: paymentProof || updatedMilestones[submittedIdx].paymentProof || { amountPaid: approvedAmount, submittedAt: new Date().toISOString(), status: 'confirmed' as const },
        };
      }
    }

    if (approvedAmount <= 0) {
      approvedAmount = Math.round(Number(contract.amount || 1000) * 0.3);
    }

    let hasActivatedNext = false;
    const finalMilestones = updatedMilestones.map((m) => {
      if (!hasActivatedNext && m.status === 'pending') {
        hasActivatedNext = true;
        return { ...m, status: 'in_progress' as const };
      }
      return m;
    });

    const isAllDone = finalMilestones.length > 0 && finalMilestones.every((m) => m.status === 'approved');
    const nextContractStatus: 'in_progress' | 'completed' = isAllDone ? 'completed' : 'in_progress';
    const completedAt = isAllDone ? new Date().toISOString() : undefined;

    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: nextContractStatus,
              milestones: finalMilestones,
              completedAt,
            }
          : c
      )
    );

    if (isAllDone && contract.gigId) {
      setGigs((prev) =>
        prev.map((g) => (String(g.id).trim() === String(contract.gigId).trim() ? { ...g, status: 'completed' as const } : g))
      );
    }

    setCurrentUser((prev) => {
      if (!prev) return prev;
      if (prev.id === contract.freelancerId) {
        return {
          ...prev,
          totalEarned: (prev.totalEarned || 0) + approvedAmount,
          completedProjects: isAllDone ? (prev.completedProjects || 0) + 1 : prev.completedProjects,
        };
      }
      if (prev.id === contract.clientId) {
        return {
          ...prev,
          totalSpent: (prev.totalSpent || 0) + approvedAmount,
          completedProjects: isAllDone ? (prev.completedProjects || 0) + 1 : prev.completedProjects,
        };
      }
      return prev;
    });

    const senderName = currentUser?.fullName || contract.clientName;
    const senderId = currentUser?.id || contract.clientId;
    
    let content = isAllDone
      ? `🎉 **Final Milestone Approved & Contract Completed!**\nAll milestones have been verified and escrow of $${approvedAmount.toLocaleString()} has been unlocked. Full project complete!`
      : `🎉 **Milestone Approved!** Escrow of $${approvedAmount.toLocaleString()} has been unlocked and released for "${milestoneTitle}".`;

    if (paymentProof) {
      content += `\n💳 **Payment Proof Attached**: Mode: ${paymentProof.paymentMode?.toUpperCase() || 'UPI'} • UTR: ${paymentProof.transactionId || 'N/A'}`;
    }

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      orderId: contractId,
      senderId,
      senderName,
      senderAvatar: currentUser?.avatarUrl || contract.clientAvatar,
      senderRole: 'client',
      content,
      attachments: paymentProof?.proofUrl ? [paymentProof.proofUrl] : [],
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, msg]);

    try {
      const apiUrl = getApiBaseUrl();
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

      if (isAllDone && contract.gigId) {
        fetch(`${apiUrl}/api/marketplace/gigs/${contract.gigId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        }).catch(() => {});
      }
    } catch {}

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: contract.freelancerId,
      type: 'milestone',
      title: 'Escrow Payment Released! 💰',
      body: `${senderName} approved "${milestoneTitle}". $${approvedAmount.toLocaleString()} has been credited.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      targetView: 'contracts',
    };
    setNotifications((prev) => [notif, ...prev]);

    addToast('success', 'Escrow Released!', `$${approvedAmount.toLocaleString()} successfully settled for milestone.`);
    triggerCelebration();
  }, [contracts, currentUser, addToast, triggerCelebration]);

  // Action: Request Revision
  const requestRevision = useCallback((contractId: string, milestoneId: string, reason: string) => {
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    const currentMilestones = contract.milestones && contract.milestones.length > 0 ? contract.milestones : [];
    let matched = false;
    const updatedMilestones = currentMilestones.map((m) => {
      if (m.id === milestoneId) {
        matched = true;
        return { ...m, status: 'in_progress' as const };
      }
      return m;
    });

    if (!matched && updatedMilestones.length > 0) {
      const subIdx = updatedMilestones.findIndex((m) => m.status === 'submitted');
      const targetIdx = subIdx >= 0 ? subIdx : 0;
      updatedMilestones[targetIdx] = {
        ...updatedMilestones[targetIdx],
        status: 'in_progress' as const,
      };
    }

    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: 'revision_requested' as const,
              revisionCount: (c.revisionCount || 0) + 1,
              milestones: updatedMilestones,
            }
          : c
      )
    );

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
      const apiUrl = getApiBaseUrl();
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

    addToast('info', 'Revision Requested', 'Feedback shared with freelancer for updates.');
  }, [contracts, currentUser, addToast]);

  // Action: Decline Bid
  const declineBid = useCallback((bidId: string) => {
    setBids((prev) =>
      prev.map((b) => (String(b.id).trim() === String(bidId).trim() ? { ...b, status: 'rejected' as const } : b))
    );
    try {
      const apiUrl = getApiBaseUrl();
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
    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return;

    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: 'delivered' as const,
              handoverNotes,
              deliveredAt: new Date().toISOString(),
            }
          : c
      )
    );

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
      const apiUrl = getApiBaseUrl();
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

    addToast('success', 'Final Handover Submitted!', 'Client notified to sign off and close the contract.');
    triggerCelebration();
  }, [contracts, currentUser, addToast, triggerCelebration]);

  // Helper: Query dynamic specialist rating statistics across all completed client orders
  const getFreelancerRating = useCallback((freelancerId: string): FreelancerRatingStats => {
    return getFreelancerRatingStats(freelancerId, contracts);
  }, [contracts]);

  // Action: Client signs off and completes contract with mutual rating & review
  const completeContract = useCallback((contractId: string, rating = 5, reviewText = 'Outstanding engineering execution and on-time delivery!') => {
    const targetContract = contracts.find((c) => c.id === contractId);
    if (!targetContract) return;

    const currentMilestones = targetContract.milestones && targetContract.milestones.length > 0 ? targetContract.milestones : [];
    const allApproved = currentMilestones.length > 0 && currentMilestones.every((m) => m.status === 'approved');

    if (!allApproved) {
      addToast(
        'warning',
        'Milestone Escrows Incomplete',
        `All ${currentMilestones.length} milestone escrows must be individually submitted, approved, and released before signing off on the contract.`
      );
      return;
    }

    const updatedContracts = contracts.map((c) =>
      c.id === contractId
        ? {
            ...c,
            status: 'completed' as const,
            completedAt: new Date().toISOString(),
            clientRating: rating,
            clientReview: reviewText,
          }
        : c
    );

    setContracts(updatedContracts);

    // Compute updated average rating for the specialist across all rated contracts
    const fId = String(targetContract.freelancerId).trim();
    const stats = getFreelancerRatingStats(fId, updatedContracts);

    const gigId = targetContract.gigId;
    setGigs((prev) =>
      prev.map((g) => (String(g.id).trim() === String(gigId).trim() ? { ...g, status: 'completed' as const } : g))
    );

    // Update dynamic freelancer rating on all bids
    setBids((prev) =>
      prev.map((b) =>
        String(b.freelancerId || (b as any).freelancer_id).trim() === fId
          ? { ...b, freelancerRating: stats.averageRating, freelancerCompletedOrders: stats.reviewsCount }
          : b
      )
    );

    setCurrentUser((prev) => {
      if (!prev) return prev;
      if (String(prev.id).trim() === fId) {
        return {
          ...prev,
          completedProjects: stats.reviewsCount,
          totalEarned: (prev.totalEarned || 0) + (targetContract.amount || 0),
          rating: stats.averageRating,
          reviewsCount: stats.reviewsCount,
        };
      }
      if (String(prev.id).trim() === String(targetContract.clientId).trim()) {
        return {
          ...prev,
          completedProjects: (prev.completedProjects || 0) + 1,
          totalSpent: (prev.totalSpent || 0) + (targetContract.amount || 0),
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
      content: `🏆 **Contract Successfully Completed & Closed!**\n⭐ Client Rating: ${rating}/5 Stars (Specialist Average: ${stats.averageRating}★ from ${stats.reviewsCount} review${stats.reviewsCount > 1 ? 's' : ''})\n💬 Review: "${reviewText}"\nAll escrow funds have been 100% disbursed. Thank you for the collaboration!`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, msg]);

    try {
      const apiUrl = getApiBaseUrl();
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
          milestones: currentMilestones,
          completedAt: new Date().toISOString(),
          clientRating: rating,
          clientReview: reviewText,
        }),
      }).catch(() => {});

      if (gigId) {
        fetch(`${apiUrl}/api/marketplace/gigs/${gigId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        }).catch(() => {});
      }
    } catch {}

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: targetContract.freelancerId,
      type: 'contract',
      title: 'Contract Successfully Completed! 🏆',
      body: `${senderName} approved final handover and rated you ${rating}★ (New Average: ${stats.averageRating}★)! Escrow is 100% unlocked.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      targetView: 'contracts',
    };
    setNotifications((prev) => [notif, ...prev]);

    addToast('success', 'Contract Completed!', `100% of escrow disbursed and rating submitted. Overall specialist rating updated to ${stats.averageRating}★.`);
    triggerCelebration();
  }, [contracts, currentUser, addToast, triggerCelebration]);

  // Action: Submit Verification (Connected to Backend & Admin Queue & Supabase Direct)
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
      const filtered = (prev || []).filter(
        (v) =>
          v.id !== newVerif.id &&
          v.userId !== newVerif.userId &&
          (v.userEmail || '').toLowerCase() !== (newVerif.userEmail || '').toLowerCase()
      );
      const updated = [newVerif, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Keep currentUser unverified until admin approves
    if (currentUser && currentUser.role === 'freelancer') {
      setCurrentUser((prev) => (prev ? { ...prev, isVerified: false } : null));
    }

    // 1. Backend REST API sync
    try {
      const apiUrl = getApiBaseUrl();
      fetch(`${apiUrl}/api/marketplace/verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVerif),
      })
        .then((r) => r.json())
        .then(() => fetchGigsFromBackend())
        .catch(() => {});
    } catch {}

    // 2. Direct Supabase Client sync
    (async () => {
      try {
        const { data: authSession } = await supabase.auth.getSession();
        const currentAuthUser = authSession?.session?.user;
        const targetUserId = currentAuthUser?.id || (user.id && isUUID(user.id) ? user.id : null);
        if (targetUserId) {
          await supabase.from('profiles').upsert({
            id: targetUserId,
            email: user.email,
            full_name: user.fullName,
            role: 'freelancer',
            is_verified: false,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

          await supabase.from('freelancer_verifications').upsert({
            user_id: targetUserId,
            status: 'pending',
            id_document_url: newVerif.idDocumentUrl || null,
            selfie_url: newVerif.selfieUrl || null,
            portfolio_files: Array.isArray(newVerif.portfolioFiles) ? newVerif.portfolioFiles : [],
            certificates: Array.isArray(newVerif.certificates) ? newVerif.certificates : [],
            external_links: Array.isArray(newVerif.externalLinks) ? newVerif.externalLinks : [],
            skill_tags: Array.isArray(newVerif.skillTags) ? newVerif.skillTags : [],
            pitch_statement: newVerif.pitchStatement || '',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        }
      } catch {}
    })();

    addToast('success', 'Verification Submitted! ⏳', 'Queued for Platform Administrator review and approval.');
    triggerCelebration();
    return newVerif;
  }, [currentUser, addToast, triggerCelebration, fetchGigsFromBackend]);

  // Action: Review Verification (Admin Decision & Badge Update)
  const reviewVerification = useCallback((verificationId: string, status: 'approved' | 'rejected' | 'under_review', adminComment: string) => {
    let candidateName = '';
    let candidateId = '';
    let candidateEmail = '';

    setVerifications((prev) => {
      const updated = prev.map((v) => {
        if (
          String(v.id).trim() === String(verificationId).trim() ||
          String(v.userId).trim() === String(verificationId).trim()
        ) {
          candidateName = v.userName;
          candidateId = v.userId;
          candidateEmail = v.userEmail || '';
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
    if (
      currentUser &&
      (currentUser.id === candidateId ||
        (candidateEmail && currentUser.email?.toLowerCase() === candidateEmail.toLowerCase()))
    ) {
      setCurrentUser((prev) => (prev ? { ...prev, isVerified: status === 'approved' } : null));
    }

    // 1. Backend API sync
    try {
      const apiUrl = getApiBaseUrl();
      fetch(`${apiUrl}/api/marketplace/verifications/${verificationId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminComment }),
      })
        .then((r) => r.json())
        .then(() => fetchGigsFromBackend())
        .catch(() => {});
    } catch {}

    // 2. Direct Supabase sync
    (async () => {
      try {
        if (candidateId && isUUID(candidateId)) {
          await supabase.from('freelancer_verifications').update({
            status,
            admin_comment: adminComment,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('user_id', candidateId);

          await supabase.from('profiles').update({
            is_verified: status === 'approved',
            updated_at: new Date().toISOString(),
          }).eq('id', candidateId);
        }
      } catch {}
    })();

    addToast(
      status === 'approved' ? 'success' : status === 'rejected' ? 'warning' : 'info',
      `Verification ${status === 'approved' ? 'Approved & Granted ⭐' : status === 'rejected' ? 'Rejected' : 'Under Review'}`,
      `Candidate ${candidateName || 'specialist'} status updated.`
    );
    if (status === 'approved') {
      triggerCelebration();
    }
  }, [currentUser, addToast, triggerCelebration, fetchGigsFromBackend]);

  // Action: Admin Update Gig
  const adminUpdateGig = useCallback(async (gigId: string, data: Partial<Gig> & { action?: string }) => {
    try {
      const apiUrl = getApiBaseUrl();
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
      const apiUrl = getApiBaseUrl();
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
      const apiUrl = getApiBaseUrl();
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

  // Support Desk Actions
  const openSupportModal = useCallback((ticketId?: string) => {
    if (ticketId) {
      setActiveSupportTicketId(ticketId);
    }
    setIsSupportModalOpen(true);
  }, []);

  const createSupportTicket = useCallback(
    async (data: {
      subject: string;
      category: TicketCategory;
      priority: TicketPriority;
      description: string;
      contractId?: string;
      contractTitle?: string;
      gigId?: string;
      gigTitle?: string;
      attachments?: string[];
    }): Promise<SupportTicket | null> => {
      if (!currentUser) {
        addToast('error', 'Authentication Required', 'Please log in to submit a support ticket.');
        return null;
      }

      const ticketId = `ticket-${Date.now()}`;
      const ticketNumber = `#TCK-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date().toISOString();

      const initialMsg: SupportTicketMessage = {
        id: `msg-tck-${Date.now()}`,
        ticketId,
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        senderRole: currentUser.role,
        senderAvatar: currentUser.avatarUrl,
        content: data.description,
        attachments: data.attachments || [],
        createdAt: now,
      };

      const autoBotMsg: SupportTicketMessage = {
        id: `msg-tck-${Date.now() + 2}`,
        ticketId,
        senderId: 'system-support-bot',
        senderName: 'FreelanceStack Support Bot',
        senderRole: 'support_agent',
        senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=support-ai-bot',
        content: `👋 Hello ${currentUser.fullName}! We have received your query regarding "${data.subject}" (Ticket ID: ${ticketNumber}). A Platform Administrator has been assigned to assist you. Typical response time is under 15 minutes.`,
        createdAt: new Date(Date.now() + 500).toISOString(),
      };

      const newTicket: SupportTicket = {
        id: ticketId,
        ticketNumber,
        userId: currentUser.id,
        userName: currentUser.fullName,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        userAvatar: currentUser.avatarUrl,
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        status: 'open',
        description: data.description,
        contractId: data.contractId,
        contractTitle: data.contractTitle,
        gigId: data.gigId,
        gigTitle: data.gigTitle,
        attachments: data.attachments || [],
        messages: [initialMsg, autoBotMsg],
        adminNotes: '',
        createdAt: now,
        updatedAt: now,
      };

      setTickets((prev) => {
        const updated = [newTicket, ...(prev || [])];
        try {
          localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      addToast('success', 'Support Ticket Created', `Ticket ${ticketNumber} is active. Our support team has been notified.`);
      setActiveSupportTicketId(newTicket.id);

      // Backend sync
      try {
        const apiUrl = getApiBaseUrl();
        const res = await fetch(`${apiUrl}/api/marketplace/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            userName: currentUser.fullName,
            userEmail: currentUser.email,
            userRole: currentUser.role,
            userAvatar: currentUser.avatarUrl,
            ...data,
          }),
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData && resData.ticket) {
            const synced = normalizeTicket(resData.ticket);
            setTickets((prev) => prev.map((t) => (t.id === newTicket.id ? synced : t)));
            return synced;
          }
        }
      } catch {}

      return newTicket;
    },
    [currentUser, addToast]
  );

  const sendTicketMessage = useCallback(
    async (ticketId: string, content: string, attachments?: string[]) => {
      if (!currentUser) return;
      const now = new Date().toISOString();
      const newMsg: SupportTicketMessage = {
        id: `msg-tck-${Date.now()}`,
        ticketId,
        senderId: currentUser.id,
        senderName: currentUser.role === 'admin' ? 'Master Administrator' : currentUser.fullName,
        senderRole: currentUser.role,
        senderAvatar: currentUser.avatarUrl || (currentUser.role === 'admin' ? 'https://api.dicebear.com/7.x/bottts/svg?seed=admin-governance-shield' : undefined),
        content,
        attachments: attachments || [],
        createdAt: now,
      };

      setTickets((prev) => {
        const updated = (prev || []).map((t) => {
          if (String(t.id).trim() === String(ticketId).trim()) {
            const newStatus =
              currentUser.role === 'admin'
                ? t.status === 'open'
                  ? 'in_progress'
                  : t.status
                : t.status === 'resolved' || t.status === 'closed'
                ? 'open'
                : t.status;
            return {
              ...t,
              status: newStatus,
              updatedAt: now,
              messages: [...(t.messages || []), newMsg],
            };
          }
          return t;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Backend sync
      try {
        const apiUrl = getApiBaseUrl();
        await fetch(`${apiUrl}/api/marketplace/tickets/${ticketId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: newMsg.senderId,
            senderName: newMsg.senderName,
            senderRole: newMsg.senderRole,
            senderAvatar: newMsg.senderAvatar,
            content,
            attachments,
          }),
        });
      } catch {}
    },
    [currentUser]
  );

  const adminUpdateTicket = useCallback(
    async (ticketId: string, data: { status?: TicketStatus; priority?: TicketPriority; adminNotes?: string }) => {
      const now = new Date().toISOString();
      setTickets((prev) => {
        const updated = (prev || []).map((t) => {
          if (String(t.id).trim() === String(ticketId).trim()) {
            return {
              ...t,
              ...data,
              updatedAt: now,
              resolvedAt: data.status === 'resolved' ? now : t.resolvedAt,
            };
          }
          return t;
        });
        try {
          localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      addToast('info', 'Ticket Updated', `Ticket status updated to ${data.status || 'saved'}.`);

      // Backend sync
      try {
        const apiUrl = getApiBaseUrl();
        await fetch(`${apiUrl}/api/marketplace/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch {}
    },
    [addToast]
  );

  // Collaboration & Domain Network Engine
  const getCollaborationBetween = useCallback(
    (clientId?: string, freelancerId?: string, domain?: string): CollaborationHistory | null => {
      if (!clientId || !freelancerId) return null;
      const matchingContracts = (contracts || []).filter((c) => {
        const isClientMatch = String(c.clientId).trim() === String(clientId).trim();
        const isFreelancerMatch = String(c.freelancerId).trim() === String(freelancerId).trim();
        if (!isClientMatch || !isFreelancerMatch) return false;
        if (domain) {
          const contractDomain = (c.categoryName || '').toLowerCase();
          const targetDomain = domain.toLowerCase();
          if (!contractDomain.includes(targetDomain) && !targetDomain.includes(contractDomain)) {
            return false;
          }
        }
        return true;
      });

      if (matchingContracts.length === 0) return null;

      const completedList = matchingContracts.filter(
        (c) => c.status === 'completed' || (c.milestones || []).some((m) => m.status === 'approved')
      );
      if (completedList.length === 0) return null;

      const first = completedList[0];
      const totalAmount = completedList.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const ratings = completedList.map((c) => c.clientRating).filter((r): r is number => typeof r === 'number');
      const averageRating = ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 5.0;

      return {
        partnerId: freelancerId,
        partnerName: first.freelancerName,
        partnerAvatar: first.freelancerAvatar,
        partnerRole: 'freelancer',
        partnerTitle: 'Verified Repeat Partner',
        isVerified: true,
        domain: first.categoryName || domain || 'Full-Stack Architecture',
        completedContractsCount: completedList.length,
        totalAmount,
        lastCollaboratedAt: completedList[0].completedAt || completedList[0].createdAt,
        contractTitles: completedList.map((c) => c.gigTitle),
        ratingsGiven: ratings,
        averageRating,
      };
    },
    [contracts]
  );

  const getRepeatCollaboratorsForClient = useCallback(
    (clientId?: string): CollaborationHistory[] => {
      const targetClientId = clientId || currentUser?.id;
      if (!targetClientId) return [];

      const clientContracts = (contracts || []).filter(
        (c) => String(c.clientId).trim() === String(targetClientId).trim()
      );

      const freelancerMap = new Map<string, { contracts: OrderContract[]; domain: string }>();

      for (const c of clientContracts) {
        const fId = String(c.freelancerId).trim();
        if (!fId || fId === 'freelancer-unknown') continue;
        const existing = freelancerMap.get(fId) || { contracts: [], domain: c.categoryName || 'Full-Stack Architecture' };
        existing.contracts.push(c);
        freelancerMap.set(fId, existing);
      }

      const results: CollaborationHistory[] = [];
      freelancerMap.forEach((entry, fId) => {
        const first = entry.contracts[0];
        const totalAmount = entry.contracts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        const ratings = entry.contracts.map((c) => c.clientRating).filter((r): r is number => typeof r === 'number');
        const averageRating = ratings.length > 0 ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : 5.0;

        results.push({
          partnerId: fId,
          partnerName: first.freelancerName,
          partnerAvatar: first.freelancerAvatar,
          partnerRole: 'freelancer',
          partnerTitle: 'Verified Specialist',
          isVerified: true,
          domain: first.categoryName || entry.domain || 'Full-Stack Architecture',
          completedContractsCount: entry.contracts.length,
          totalAmount,
          lastCollaboratedAt: entry.contracts[0].completedAt || entry.contracts[0].createdAt,
          contractTitles: entry.contracts.map((c) => c.gigTitle),
          ratingsGiven: ratings,
          averageRating,
        });
      });

      return results;
    },
    [contracts, currentUser]
  );

  const getRepeatClientsForFreelancer = useCallback(
    (freelancerId?: string): CollaborationHistory[] => {
      const targetFreelancerId = freelancerId || currentUser?.id;
      if (!targetFreelancerId) return [];

      const freelancerContracts = (contracts || []).filter(
        (c) => String(c.freelancerId).trim() === String(targetFreelancerId).trim()
      );

      const clientMap = new Map<string, { contracts: OrderContract[]; domain: string }>();

      for (const c of freelancerContracts) {
        const cId = String(c.clientId).trim();
        if (!cId || cId === 'client-unknown') continue;
        const existing = clientMap.get(cId) || { contracts: [], domain: c.categoryName || 'Full-Stack Architecture' };
        existing.contracts.push(c);
        clientMap.set(cId, existing);
      }

      const results: CollaborationHistory[] = [];
      clientMap.forEach((entry, cId) => {
        const first = entry.contracts[0];
        const totalAmount = entry.contracts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

        results.push({
          partnerId: cId,
          partnerName: first.clientName,
          partnerAvatar: first.clientAvatar,
          partnerRole: 'client',
          partnerTitle: 'Enterprise Client',
          isVerified: true,
          domain: first.categoryName || entry.domain || 'Full-Stack Architecture',
          completedContractsCount: entry.contracts.length,
          totalAmount,
          lastCollaboratedAt: entry.contracts[0].completedAt || entry.contracts[0].createdAt,
          contractTitles: entry.contracts.map((c) => c.gigTitle),
        });
      });

      return results;
    },
    [contracts, currentUser]
  );

  const createDirectContract = useCallback(
    async (data: {
      freelancerId: string;
      freelancerName?: string;
      freelancerAvatar?: string;
      title: string;
      categoryName: string;
      amount: number;
      deadline?: string;
      milestones?: { title: string; amount: number }[];
      note?: string;
    }): Promise<OrderContract | null> => {
      if (!currentUser) {
        addToast('error', 'Authentication Required', 'Please log in to initiate a direct contract.');
        return null;
      }

      const contractId = `contract-direct-${Date.now()}`;
      const rawAmount = Number(data.amount) || 1500;
      const dl = data.deadline || new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0];

      const rawMilestones: Milestone[] =
        data.milestones && data.milestones.length > 0
          ? data.milestones.map((m, idx) => ({
              id: `m-${contractId}-${idx}`,
              title: m.title,
              amount: Number(m.amount),
              status: 'pending' as const,
              deadline: new Date(Date.now() + (idx + 1) * 7 * 86400000).toISOString().split('T')[0],
              paymentStatus: 'unpaid' as const,
            }))
          : [
              {
                id: `m-${contractId}-0`,
                title: 'Phase 1: Architecture, Wireframes & Core Specs',
                amount: Math.round(rawAmount * 0.4),
                status: 'pending' as const,
                deadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
                paymentStatus: 'unpaid' as const,
              },
              {
                id: `m-${contractId}-1`,
                title: 'Phase 2: Core Engineering Implementation & API',
                amount: Math.round(rawAmount * 0.4),
                status: 'pending' as const,
                deadline: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
                paymentStatus: 'unpaid' as const,
              },
              {
                id: `m-${contractId}-2`,
                title: 'Phase 3: Production Polish, QA & Handover',
                amount: rawAmount - Math.round(rawAmount * 0.4) * 2,
                status: 'pending' as const,
                deadline: dl,
                paymentStatus: 'unpaid' as const,
              },
            ];

      const newContract: OrderContract = {
        id: contractId,
        gigId: `direct-gig-${Date.now()}`,
        gigTitle: data.title,
        categoryId: data.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        categoryName: data.categoryName,
        clientId: currentUser.id,
        clientName: currentUser.fullName,
        clientAvatar: currentUser.avatarUrl,
        freelancerId: data.freelancerId,
        freelancerName: data.freelancerName || 'Trusted Partner',
        freelancerAvatar: data.freelancerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        status: 'pending_acceptance',
        amount: rawAmount,
        escrowFunded: true,
        deadline: dl,
        createdAt: new Date().toISOString(),
        revisionCount: 0,
        milestones: rawMilestones,
        deliverables: [],
        handoverNotes: data.note,
        isDirectAssignment: true,
        invitationNote: data.note,
        clientAccepted: true,
        freelancerAccepted: false,
      };

      setContracts((prev) => {
        const updated = [newContract, ...(prev || [])];
        try {
          localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Initial chat invitation message
      const initialChatMsg: ChatMessage = {
        id: `msg-direct-${Date.now()}`,
        orderId: contractId,
        senderId: currentUser.id,
        senderName: currentUser.fullName,
        senderAvatar: currentUser.avatarUrl,
        senderRole: 'client',
        content: `📜 **Direct Contract Offer Extended**\n` +
          `Client **${currentUser.fullName}** has assigned this contract to **${data.freelancerName || 'Specialist'}** with **$${rawAmount.toLocaleString()} escrow vaulted**.\n\n` +
          `• **Domain**: ${data.categoryName}\n` +
          `• **Target Deadline**: ${dl}\n` +
          `${data.note ? `• **Scope Note**: ${data.note}\n` : ''}` +
          `\n⏳ *Freelancer review and mutual acceptance required before work milestones commence.*`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      setMessages((prev) => {
        const updated = [...(prev || []), initialChatMsg];
        try {
          localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Send notification to freelancer
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: data.freelancerId,
        type: 'contract',
        title: 'New Direct Contract Offer! 📜',
        body: `${currentUser.fullName} assigned you "${data.title}" ($${rawAmount.toLocaleString()} escrow funded). Review & accept terms to begin.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        targetView: 'contracts',
      };
      setNotifications((prev) => [notif, ...prev]);

      // Sync to backend
      try {
        const apiUrl = getApiBaseUrl();
        fetch(`${apiUrl}/api/marketplace/contracts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newContract),
        }).catch(() => {});
      } catch {}

      return newContract;
    },
    [currentUser, addToast]
  );

  // Mutual Acceptance Action: Freelancer accepts direct contract offer
  const acceptContractOffer = useCallback(
    async (contractId: string) => {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) return;

      const currentMilestones = contract.milestones || [];
      const updatedMilestones = currentMilestones.map((m, idx) => ({
        ...m,
        status: idx === 0 ? ('in_progress' as const) : m.status,
      }));

      const now = new Date().toISOString();
      setContracts((prev) =>
        prev.map((c) =>
          c.id === contractId
            ? {
                ...c,
                status: 'in_progress' as const,
                freelancerAccepted: true,
                acceptedAt: now,
                milestones: updatedMilestones,
              }
            : c
        )
      );

      const senderName = currentUser?.fullName || contract.freelancerName;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        orderId: contractId,
        senderId: currentUser?.id || contract.freelancerId,
        senderName,
        senderAvatar: currentUser?.avatarUrl || contract.freelancerAvatar,
        senderRole: 'freelancer',
        content: `🎉 **Direct Contract Accepted & Mutual Agreement Finalized!**\n` +
          `Freelancer **${contract.freelancerName}** has accepted the contract terms and milestone schedule. Work is officially underway and Milestone #1 is now **IN PROGRESS**!`,
        createdAt: now,
        isRead: false,
      };
      setMessages((prev) => [...prev, msg]);

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: contract.clientId,
        type: 'contract',
        title: 'Contract Offer Accepted! 🤝',
        body: `${senderName} has accepted your direct contract for "${contract.gigTitle}". Project is active!`,
        isRead: false,
        createdAt: now,
        targetView: 'contracts',
      };
      setNotifications((prev) => [notif, ...prev]);

      // Backend sync
      try {
        const apiUrl = getApiBaseUrl();
        fetch(`${apiUrl}/api/marketplace/orders/${contractId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        }).catch(() => {});

        fetch(`${apiUrl}/api/marketplace/contracts/${contractId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'in_progress',
            freelancerAccepted: true,
            acceptedAt: now,
            milestones: updatedMilestones,
          }),
        }).catch(() => {});
      } catch {}

      addToast('success', 'Contract Accepted! 🚀', 'Mutual agreement verified. Milestone #1 is now active.');
      triggerCelebration();
    },
    [contracts, currentUser, addToast, triggerCelebration]
  );

  // Mutual Acceptance Action: Freelancer declines direct contract offer
  const declineContractOffer = useCallback(
    async (contractId: string, reason?: string) => {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) return;

      const now = new Date().toISOString();
      setContracts((prev) =>
        prev.map((c) =>
          c.id === contractId
            ? {
                ...c,
                status: 'cancelled' as const,
                freelancerAccepted: false,
                declinedAt: now,
                declineReason: reason,
              }
            : c
        )
      );

      const senderName = currentUser?.fullName || contract.freelancerName;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        orderId: contractId,
        senderId: currentUser?.id || contract.freelancerId,
        senderName,
        senderAvatar: currentUser?.avatarUrl || contract.freelancerAvatar,
        senderRole: 'freelancer',
        content: `❌ **Contract Offer Declined**\n` +
          `Freelancer **${contract.freelancerName}** declined this direct contract offer.\n` +
          `${reason ? `• Reason: ${reason}\n` : ''}` +
          `• Vaulted Escrow: $${contract.amount.toLocaleString()} is refunded to client.`,
        createdAt: now,
        isRead: false,
      };
      setMessages((prev) => [...prev, msg]);

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: contract.clientId,
        type: 'contract',
        title: 'Contract Offer Declined',
        body: `${senderName} declined the direct contract for "${contract.gigTitle}". Escrow refunded.`,
        isRead: false,
        createdAt: now,
        targetView: 'contracts',
      };
      setNotifications((prev) => [notif, ...prev]);

      // Backend sync
      try {
        const apiUrl = getApiBaseUrl();
        fetch(`${apiUrl}/api/marketplace/orders/${contractId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        }).catch(() => {});

        fetch(`${apiUrl}/api/marketplace/contracts/${contractId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'cancelled',
            freelancerAccepted: false,
            declinedAt: now,
            declineReason: reason,
          }),
        }).catch(() => {});
      } catch {}

      addToast('info', 'Offer Declined', 'Contract marked as cancelled and client notified.');
    },
    [contracts, currentUser, addToast]
  );

  // Client Action: Cancel/Withdraw pending direct contract offer
  const cancelContractOffer = useCallback(
    async (contractId: string) => {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) return;

      const now = new Date().toISOString();
      setContracts((prev) =>
        prev.map((c) =>
          c.id === contractId
            ? {
                ...c,
                status: 'cancelled' as const,
              }
            : c
        )
      );

      const senderName = currentUser?.fullName || contract.clientName;
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        orderId: contractId,
        senderId: currentUser?.id || contract.clientId,
        senderName,
        senderAvatar: currentUser?.avatarUrl || contract.clientAvatar,
        senderRole: 'client',
        content: `🚫 **Contract Offer Withdrawn by Client**\n` +
          `Client **${senderName}** has cancelled the pending contract invitation. Escrow funds refunded.`,
        createdAt: now,
        isRead: false,
      };
      setMessages((prev) => [...prev, msg]);

      // Backend sync
      try {
        const apiUrl = getApiBaseUrl();
        fetch(`${apiUrl}/api/marketplace/orders/${contractId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        }).catch(() => {});

        fetch(`${apiUrl}/api/marketplace/contracts/${contractId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'cancelled',
          }),
        }).catch(() => {});
      } catch {}

      addToast('info', 'Offer Withdrawn', 'Direct contract invitation cancelled and escrow refunded.');
    },
    [contracts, currentUser, addToast]
  );

  // Invoice modal trigger
  const openInvoiceModal = useCallback(
    (contractId?: string) => {
      if (contractId) {
        setActiveInvoiceContractId(contractId);
      } else if (selectedContractId) {
        setActiveInvoiceContractId(selectedContractId);
      } else if (contracts && contracts.length > 0) {
        setActiveInvoiceContractId(contracts[0].id);
      }
      setIsInvoiceModalOpen(true);
    },
    [selectedContractId, contracts]
  );

  // Direct Contract Modal trigger
  const openDirectContractModal = useCallback((partner: Persona | CollaborationHistory) => {
    setDirectContractFreelancer(partner);
    setIsDirectContractModalOpen(true);
  }, []);

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
      tickets,
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
      getFreelancerRating,
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
      updateFreelancerPaymentDetails,
      submitMilestonePaymentProof,
      confirmMilestonePayment,
      markWorkHandoverComplete,
      completeContract,
      requestRevision,
      submitVerification,
      reviewVerification,
      adminUpdateGig,
      adminUpdateContract,
      sendMessage,
      isSupportModalOpen,
      setIsSupportModalOpen,
      activeSupportTicketId,
      setActiveSupportTicketId,
      openSupportModal,
      createSupportTicket,
      sendTicketMessage,
      adminUpdateTicket,
      getCollaborationBetween,
      getRepeatCollaboratorsForClient,
      getRepeatClientsForFreelancer,
      createDirectContract,
      acceptContractOffer,
      declineContractOffer,
      cancelContractOffer,
      isInvoiceModalOpen,
      setIsInvoiceModalOpen,
      activeInvoiceContractId,
      setActiveInvoiceContractId,
      openInvoiceModal,
      isDirectContractModalOpen,
      setIsDirectContractModalOpen,
      directContractFreelancer,
      setDirectContractFreelancer,
      openDirectContractModal,
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
      tickets,
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
      getFreelancerRating,
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
      updateFreelancerPaymentDetails,
      submitMilestonePaymentProof,
      confirmMilestonePayment,
      markWorkHandoverComplete,
      completeContract,
      requestRevision,
      submitVerification,
      reviewVerification,
      adminUpdateGig,
      adminUpdateContract,
      sendMessage,
      isSupportModalOpen,
      activeSupportTicketId,
      openSupportModal,
      createSupportTicket,
      sendTicketMessage,
      adminUpdateTicket,
      getCollaborationBetween,
      getRepeatCollaboratorsForClient,
      getRepeatClientsForFreelancer,
      createDirectContract,
      acceptContractOffer,
      declineContractOffer,
      cancelContractOffer,
      isInvoiceModalOpen,
      activeInvoiceContractId,
      openInvoiceModal,
      isDirectContractModalOpen,
      directContractFreelancer,
      openDirectContractModal,
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
