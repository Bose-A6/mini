export type AccountRole = 'client' | 'freelancer' | 'admin';

export interface Persona {
  id: string;
  email: string;
  fullName: string;
  role: AccountRole;
  roles: AccountRole[];
  professionalTitle: string;
  avatarUrl: string;
  company?: string;
  rating: number;
  reviewsCount: number;
  completedProjects: number;
  totalEarned?: number;
  totalSpent?: number;
  isVerified: boolean;
  verificationBadge?: 'verified_pro' | 'top_rated' | 'rising_talent';
  bio: string;
  skills: string[];
  upiId?: string;
  phoneNumber?: string;
  qrCodeUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  gigCount: number;
}

export interface MilestonePaymentDetails {
  upiId?: string;
  phoneNumber?: string;
  qrCodeUrl?: string;
  accountName?: string;
  paymentNote?: string;
  updatedAt?: string;
}

export interface MilestonePaymentProof {
  proofUrl?: string;
  proofFiles?: string[];
  transactionId?: string;
  paymentMode?: 'upi' | 'gpay' | 'phonepe' | 'paytm' | 'bank_transfer' | 'other';
  payerName?: string;
  amountPaid: number;
  submittedAt: string;
  note?: string;
  status?: 'submitted' | 'confirmed' | 'disputed';
  confirmedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved';
  deadline?: string;
  deliverableNote?: string;
  deliverableFiles?: string[];
  submittedAt?: string;
  approvedAt?: string;
  paymentDetails?: MilestonePaymentDetails;
  paymentProof?: MilestonePaymentProof;
  paymentStatus?: 'unpaid' | 'proof_submitted' | 'settled';
}

export interface Gig {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  clientCompany?: string;
  clientRating: number;
  clientSpent: number;
  clientVerified: boolean;
  categoryId: string;
  categoryName: string;
  title: string;
  slug: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  status: 'draft' | 'open' | 'awarded' | 'in_progress' | 'closed' | 'completed' | 'cancelled';
  referenceFiles: string[];
  tags: string[];
  proposalsCount: number;
  isFeatured: boolean;
  createdAt: string;
  suggestedMilestones?: { title: string; amount: number }[];
}

export interface Bid {
  id: string;
  gigId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerTitle: string;
  freelancerAvatar: string;
  freelancerRating: number;
  freelancerCompletedOrders: number;
  freelancerBadge?: string;
  isVerified: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  proposedPrice: number;
  deliveryDays: number;
  coverMessage: string;
  milestones?: { title: string; amount: number }[];
  createdAt: string;
}

export interface OrderDeliverable {
  id: string;
  milestoneId?: string;
  title: string;
  description: string;
  files: string[];
  liveUrl?: string;
  submittedAt: string;
}

export interface OrderContract {
  id: string;
  gigId: string;
  gigTitle: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  status: 'pending_acceptance' | 'in_progress' | 'delivered' | 'revision_requested' | 'completed' | 'disputed' | 'cancelled';
  amount: number;
  escrowFunded: boolean;
  deadline: string;
  createdAt: string;
  completedAt?: string;
  deliveredAt?: string;
  handoverNotes?: string;
  clientRating?: number;
  clientReview?: string;
  freelancerRating?: number;
  freelancerReview?: string;
  milestones: Milestone[];
  deliverables: OrderDeliverable[];
  revisionCount: number;
  reviewId?: string;
  categoryId?: string;
  categoryName?: string;
  upiId?: string;
  phoneNumber?: string;
  qrCodeUrl?: string;

  // Mutual Acceptance & Direct Offer Fields
  isDirectAssignment?: boolean;
  invitationNote?: string;
  clientAccepted?: boolean;
  freelancerAccepted?: boolean;
  acceptedAt?: string;
  declinedAt?: string;
  declineReason?: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: AccountRole;
  content: string;
  attachments?: string[];
  createdAt: string;
  isRead: boolean;
}

export interface VerificationSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  professionalTitle: string;
  yearsExperience: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  idDocumentUrl: string;
  selfieUrl: string;
  portfolioFiles: string[];
  certificates: string[];
  externalLinks: string[];
  skillTags: string[];
  pitchStatement: string;
  adminComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  gigTitle: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  revieweeId: string;
  rating: number;
  qualityRating: number;
  communicationRating: number;
  timelinessRating: number;
  comment: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'bid' | 'contract' | 'milestone' | 'message' | 'verification' | 'review' | 'system';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  targetView?: 'gigs' | 'client' | 'freelancer' | 'contracts' | 'admin' | 'verification';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

export type TicketCategory =
  | 'payment_escrow'
  | 'contract_milestone'
  | 'verification'
  | 'account_security'
  | 'technical'
  | 'general';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: AccountRole | 'support_agent';
  senderAvatar?: string;
  content: string;
  attachments?: string[];
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: AccountRole;
  userAvatar?: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  contractId?: string;
  contractTitle?: string;
  gigId?: string;
  gigTitle?: string;
  attachments?: string[];
  messages: SupportTicketMessage[];
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface CollaborationHistory {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerRole: AccountRole;
  partnerTitle?: string;
  isVerified?: boolean;
  domain: string;
  completedContractsCount: number;
  totalAmount: number;
  lastCollaboratedAt: string;
  contractTitles: string[];
  ratingsGiven?: number[];
  averageRating?: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  contractId: string;
  contractTitle: string;
  categoryName?: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientCompany?: string;
  freelancerId: string;
  freelancerName: string;
  freelancerEmail?: string;
  freelancerTitle?: string;
  freelancerUpiId?: string;
  freelancerPhone?: string;
  amount: number;
  platformFee: number;
  netPayout: number;
  status: 'paid' | 'held_in_escrow' | 'in_progress';
  milestones: Milestone[];
  issuedAt: string;
  settledAt?: string;
  transactionReference?: string;
  paymentMode?: string;
  auditSignature: string;
}

