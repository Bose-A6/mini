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
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  gigCount: number;
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
  status: 'in_progress' | 'delivered' | 'revision_requested' | 'completed' | 'disputed' | 'cancelled';
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
