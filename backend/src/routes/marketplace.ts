import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// Setup persistent disk storage file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_PATH = path.join(DATA_DIR, 'marketplace_store.json');

// Initial seed gigs if store is completely empty
const initialSeedGigs = [
  {
    id: 'gig-101',
    clientId: 'client-1',
    client_id: 'client-1',
    title: 'Autonomous Multi-Agent AI Workflow Architecture',
    slug: 'autonomous-multi-agent-ai-workflow-architecture',
    description: 'Looking for a senior AI Engineer to architect and build a multi-agent system using LangGraph and OpenAI function calling with production telemetry.',
    budget_min: 4500,
    budgetMin: 4500,
    budget_max: 8500,
    budgetMax: 8500,
    categoryId: 'ai-ml',
    categoryName: 'AI & Machine Learning',
    status: 'open',
    tags: ['LangGraph', 'Python', 'FastAPI', 'OpenAI', 'Docker'],
    proposalsCount: 3,
    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    clientName: 'Alex Rivera',
    clientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    clientCompany: 'Synthetix AI Corp',
    clientVerified: true,
  },
  {
    id: 'gig-102',
    clientId: 'client-2',
    client_id: 'client-2',
    title: 'Next.js 15 Full-Stack Fintech Platform with Stripe Escrow',
    slug: 'nextjs-15-fullstack-fintech-platform-stripe',
    description: 'Develop a high-throughput financial management portal with automated invoice processing, Stripe billing webhooks, and sub-second dashboard rendering.',
    budget_min: 6000,
    budgetMin: 6000,
    budget_max: 12000,
    budgetMax: 12000,
    categoryId: 'fullstack',
    categoryName: 'Full-Stack Architecture',
    status: 'open',
    tags: ['Next.js 15', 'TypeScript', 'TailwindCSS', 'PostgreSQL', 'Stripe API'],
    proposalsCount: 5,
    deadline: new Date(Date.now() + 21 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    clientName: 'Marcus Vance',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    clientCompany: 'Apex Capital Labs',
    clientVerified: true,
  },
  {
    id: 'gig-103',
    clientId: 'client-3',
    client_id: 'client-3',
    title: 'Design System & Micro-Interactions for Web3 DeFi Terminal',
    slug: 'design-system-micro-interactions-web3-defi',
    description: 'We require a top-tier UI/UX product designer to craft a dark-mode luxury design system with interactive charts and fluid micro-animations.',
    budget_min: 3500,
    budgetMin: 3500,
    budget_max: 7000,
    budgetMax: 7000,
    categoryId: 'ui-ux',
    categoryName: 'UI/UX Design Systems',
    status: 'open',
    tags: ['Figma', 'Design Systems', 'Dark Mode', 'Framer Motion'],
    proposalsCount: 2,
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    clientName: 'Elena Rostova',
    clientAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    clientCompany: 'Krypton Protocol',
    clientVerified: true,
  },
  {
    id: 'gig-104',
    clientId: 'client-4',
    client_id: 'client-4',
    title: 'Kubernetes Cloud Infrastructure & Zero-Downtime CI/CD',
    slug: 'kubernetes-cloud-infrastructure-zero-downtime-cicd',
    description: 'Design and deploy a production-grade multi-region Kubernetes cluster with automated Terraform provisioning, ArgoCD GitOps, and Prometheus monitoring.',
    budget_min: 5000,
    budgetMin: 5000,
    budget_max: 10000,
    budgetMax: 10000,
    categoryId: 'cloud-devops',
    categoryName: 'Cloud & DevOps',
    status: 'open',
    tags: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'GitOps'],
    proposalsCount: 1,
    deadline: new Date(Date.now() + 18 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    clientName: 'David Chen',
    clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    clientCompany: 'CloudScale Technologies',
    clientVerified: true,
  },
  {
    id: 'gig-105',
    clientId: 'client-5',
    client_id: 'client-5',
    title: 'Cross-Platform React Native Mobile App with Offline Sync',
    slug: 'cross-platform-react-native-mobile-app-offline-sync',
    description: 'Looking for a React Native expert to build an enterprise mobile application featuring WatermelonDB local offline sync, biometric security, and push notifications.',
    budget_min: 4000,
    budgetMin: 4000,
    budget_max: 8000,
    budgetMax: 8000,
    categoryId: 'mobile-apps',
    categoryName: 'Mobile App Development',
    status: 'open',
    tags: ['React Native', 'TypeScript', 'iOS', 'Android', 'Offline First'],
    proposalsCount: 4,
    deadline: new Date(Date.now() + 15 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    clientName: 'Sophia Lin',
    clientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    clientCompany: 'Nexus Mobile Labs',
    clientVerified: true,
  },
  {
    id: 'gig-106',
    clientId: 'client-6',
    client_id: 'client-6',
    title: 'Full Multi-Entity General Ledger Reconciliation & Year-End Tax Preparation',
    slug: 'general-ledger-reconciliation-tax-prep',
    description: 'We are seeking a licensed CPA or senior bookkeeper to perform a comprehensive financial audit and chart-of-accounts cleanup for our operating entities in QuickBooks Online.',
    budget_min: 2400,
    budgetMin: 2400,
    budget_max: 3800,
    budgetMax: 3800,
    categoryId: 'accounting-bookkeeping',
    categoryName: 'Accounting & Bookkeeping',
    status: 'open',
    tags: ['QuickBooks Online', 'GAAP', 'Bank Reconciliation', 'Tax Strategy', 'Excel'],
    proposalsCount: 3,
    deadline: new Date(Date.now() + 25 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    clientName: 'Sarah Lin',
    clientAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    clientCompany: 'NeoScale AI Solutions',
    clientVerified: true,
  },
  {
    id: 'gig-107',
    clientId: 'client-7',
    client_id: 'client-7',
    title: '5-Year SaaS Dynamic Financial Model & Series A Investor Pitch Deck Financials',
    slug: '5-year-saas-financial-model-series-a',
    description: 'Looking for an experienced FP&A Specialist or Fractional CFO to build an investor-grade 3-statement financial model and cap table scenario model.',
    budget_min: 3200,
    budgetMin: 3200,
    budget_max: 5000,
    budgetMax: 5000,
    categoryId: 'finance-cfo',
    categoryName: 'Finance & Fractional CFO',
    status: 'open',
    tags: ['Financial Modeling', 'FP&A', 'DCF Valuation', 'Cap Table', 'SaaS Metrics'],
    proposalsCount: 5,
    deadline: new Date(Date.now() + 20 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    clientName: 'Marcus Vance',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    clientCompany: 'Apex Capital',
    clientVerified: true,
  },
  {
    id: 'gig-108',
    clientId: 'client-8',
    client_id: 'client-8',
    title: 'Draft Enterprise Master Services Agreement (MSA), SOW Suite & GDPR Privacy Package',
    slug: 'enterprise-msa-sow-gdpr-legal-package',
    description: 'Seeking a corporate technology attorney to draft a robust suite of commercial contracts for our enterprise software offerings.',
    budget_min: 2000,
    budgetMin: 2000,
    budget_max: 3500,
    budgetMax: 3500,
    categoryId: 'legal-compliance',
    categoryName: 'Legal & Compliance',
    status: 'open',
    tags: ['Commercial Law', 'Contract Drafting', 'Enterprise MSA', 'SLA', 'GDPR'],
    proposalsCount: 2,
    deadline: new Date(Date.now() + 16 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    clientName: 'David Chen',
    clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    clientCompany: 'CloudScale Technologies',
    clientVerified: true,
  }
];

const initialSeedVerifications = [
  {
    id: 'verif-1',
    userId: 'user-freelancer-2',
    userName: 'Elena Rostova',
    userEmail: 'elena.rostova@designcraft.io',
    professionalTitle: 'Senior UI/UX & Design Systems Lead',
    yearsExperience: '6',
    status: 'pending',
    idDocumentUrl: 'https://documents.freelancestack.dev/verif/elena-passport-redacted.pdf',
    selfieUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    portfolioFiles: [
      'https://dribbble.com/elenarostova-fintech',
      'https://figma.com/@elena_design_tokens',
    ],
    certificates: [
      'https://certificates.coursera.org/google-ux-master-elena.pdf',
    ],
    externalLinks: [
      'https://linkedin.com/in/elena-rostova-design',
      'https://github.com/elena-design-tokens',
    ],
    skillTags: ['UI/UX Design', 'Design Systems', 'Figma', 'WCAG AAA', 'Micro-Animations'],
    pitchStatement: 'I have spent 6 years crafting conversion-optimized SaaS products for European fintechs. My design system blueprints reduce developer handoff time by 40%.',
    submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'verif-2',
    userId: 'user-freelancer-3',
    userName: 'Devon Wright',
    userEmail: 'devon.wright@cloudforge.tech',
    professionalTitle: 'AWS Certified Solutions Architect',
    yearsExperience: '8',
    status: 'under_review',
    idDocumentUrl: 'https://documents.freelancestack.dev/verif/devon-id.pdf',
    selfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    portfolioFiles: [
      'https://github.com/devon-wright/terraform-multi-cloud',
    ],
    certificates: [
      'https://aws.amazon.com/verification/AWS-PSA-88291.pdf',
    ],
    externalLinks: [
      'https://linkedin.com/in/devon-wright-aws',
    ],
    skillTags: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Security'],
    pitchStatement: 'Certified solutions architect with 8+ years enterprise cloud scaling experience. Built multi-region failover for banking clients handling 15k RPS.',
    submittedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  }
];

const initialSeedTickets = [
  {
    id: 'ticket-101',
    ticketNumber: '#TCK-8921',
    userId: 'client-1',
    userName: 'Alex Rivera',
    userEmail: 'alex.rivera@synthetix.ai',
    userRole: 'client',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    subject: 'Escrow release confirmation inquiry for Milestone #2',
    category: 'payment_escrow',
    priority: 'high',
    status: 'in_progress',
    description: 'I uploaded the payment proof screenshot and UTR code for Milestone 2. Could the support team confirm if the escrow audit is completed so the freelancer receives payout notifications?',
    contractId: 'contract-seed-1',
    contractTitle: 'Autonomous Multi-Agent AI Workflow Architecture',
    attachments: [
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
    ],
    messages: [
      {
        id: 'msg-tck-1',
        ticketId: 'ticket-101',
        senderId: 'client-1',
        senderName: 'Alex Rivera',
        senderRole: 'client',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        content: 'I uploaded the payment proof screenshot and UTR code for Milestone 2. Could the support team confirm if the escrow audit is completed so the freelancer receives payout notifications?',
        attachments: [
          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
        ],
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      },
      {
        id: 'msg-tck-2',
        ticketId: 'ticket-101',
        senderId: 'admin-master-node',
        senderName: 'Master Administrator',
        senderRole: 'admin',
        senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin-governance-shield',
        content: 'Hello Alex! We reviewed your UTR transaction reference and screenshot proof. The payment matches the milestone valuation. The milestone status is approved and the freelancer has been notified.',
        createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      }
    ],
    adminNotes: 'Verified UTR proof against bank treasury log. Settled smoothly.',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'ticket-102',
    ticketNumber: '#TCK-6419',
    userId: 'user-freelancer-2',
    userName: 'Elena Rostova',
    userEmail: 'elena.rostova@designcraft.io',
    userRole: 'freelancer',
    userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    subject: 'Verification Badge Audit & Direct UPI Configuration Assistance',
    category: 'verification',
    priority: 'medium',
    status: 'open',
    description: 'Hello Support Team, I submitted my government ID and Figma portfolio for Verified Pro status 2 days ago. I also wanted to verify if my GPay UPI QR code is properly formatted for clients.',
    attachments: [],
    messages: [
      {
        id: 'msg-tck-3',
        ticketId: 'ticket-102',
        senderId: 'user-freelancer-2',
        senderName: 'Elena Rostova',
        senderRole: 'freelancer',
        senderAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
        content: 'Hello Support Team, I submitted my government ID and Figma portfolio for Verified Pro status 2 days ago. I also wanted to verify if my GPay UPI QR code is properly formatted for clients.',
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      }
    ],
    adminNotes: 'Under review in Trust & Verification queue. Portfolio looks solid.',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  }
];

interface StoreData {
  gigs: any[];
  bids: any[];
  contracts: any[];
  messages: any[];
  verifications: any[];
  tickets: any[];
}

const loadStore = (): StoreData => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const initial: StoreData = {
        gigs: initialSeedGigs,
        bids: [],
        contracts: [],
        messages: [],
        verifications: initialSeedVerifications,
        tickets: initialSeedTickets,
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    const existingGigs = Array.isArray(parsed.gigs) ? parsed.gigs : [];
    
    // Ensure open seed gigs are available if count is low
    const openGigs = existingGigs.filter((g: any) => g.status === 'open');
    let combinedGigs = [...existingGigs];
    if (openGigs.length < 3) {
      for (const sg of initialSeedGigs) {
        if (!combinedGigs.some((g: any) => g.id === sg.id || g.slug === sg.slug)) {
          combinedGigs.push(sg);
        }
      }
    }

    const existingVerifs = Array.isArray(parsed.verifications) ? parsed.verifications : [];
    const combinedVerifs = existingVerifs.length > 0 ? existingVerifs : initialSeedVerifications;

    const rawContracts = Array.isArray(parsed.contracts) ? parsed.contracts : [];
    let didSynthesize = false;
    const normalizedContracts = rawContracts.map((c: any) => {
      let milestones = Array.isArray(c.milestones) && c.milestones.length > 0 ? c.milestones : [];
      
      if (milestones.length === 0) {
        didSynthesize = true;
        const amt = Number(c.amount || 1000);
        const m1 = Math.round(amt * 0.3);
        const m2 = Math.round(amt * 0.4);
        const m3 = amt - m1 - m2;
        milestones = [
          {
            id: `m-${c.id}-0`,
            title: 'System Architecture & Schema Design',
            amount: m1,
            status: c.status === 'completed' ? 'approved' : (c.deliverables && c.deliverables.length > 0 ? 'submitted' : 'in_progress'),
            deadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          },
          {
            id: `m-${c.id}-1`,
            title: 'Core Functionality & API Integration',
            amount: m2,
            status: c.status === 'completed' ? 'approved' : 'pending',
            deadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          },
          {
            id: `m-${c.id}-2`,
            title: 'Production Polish, Testing & Deployment',
            amount: m3,
            status: c.status === 'completed' ? 'approved' : 'pending',
            deadline: c.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          },
        ];
      }

      if (c.status === 'completed') {
        milestones = milestones.map((m: any) => ({
          ...m,
          status: 'approved',
          approvedAt: m.approvedAt || c.completedAt || new Date().toISOString(),
          paymentStatus: m.paymentStatus || 'settled',
        }));
      }

      return {
        ...c,
        milestones,
      };
    });

    // Synchronize gigs status if their corresponding contract is completed
    const completedContractGigIds = new Set(
      normalizedContracts
        .filter((c: any) => c.status === 'completed' && c.gigId)
        .map((c: any) => String(c.gigId).trim())
    );

    combinedGigs = combinedGigs.map((g: any) => {
      if (completedContractGigIds.has(String(g.id).trim())) {
        return { ...g, status: 'completed' };
      }
      return g;
    });

    const existingTickets = Array.isArray(parsed.tickets) ? parsed.tickets : [];
    const combinedTickets = existingTickets.length > 0 ? existingTickets : initialSeedTickets;

    const loadedData: StoreData = {
      gigs: combinedGigs.length > 0 ? combinedGigs : initialSeedGigs,
      bids: Array.isArray(parsed.bids) ? parsed.bids : [],
      contracts: normalizedContracts,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      verifications: combinedVerifs,
      tickets: combinedTickets,
    };

    if (didSynthesize || completedContractGigIds.size > 0 || existingTickets.length === 0) {
      try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(loadedData, null, 2), 'utf-8');
      } catch {}
    }

    return loadedData;
  } catch (err) {
    console.error('Error reading marketplace disk store:', err);
    return { gigs: initialSeedGigs, bids: [], contracts: [], messages: [], verifications: initialSeedVerifications, tickets: initialSeedTickets };
  }
};

const saveStore = (data: StoreData) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing marketplace disk store:', err);
  }
};

// Global in-memory cache synchronized with disk
let store = loadStore();

const gigSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(5000),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().nonnegative(),
  deadline: z.string().optional(),
  referenceFiles: z.array(z.string()).default([]),
  status: z.enum(['draft', 'open', 'awarded', 'completed', 'in_progress', 'closed', 'cancelled']).default('open'),
  clientName: z.string().optional(),
  clientAvatar: z.string().optional(),
  clientCompany: z.string().optional(),
  clientId: z.string().optional(),
  clientVerified: z.boolean().optional(),
  clientRating: z.number().optional(),
  clientSpent: z.number().optional(),
  suggestedMilestones: z.array(z.object({ title: z.string(), amount: z.number() })).optional(),
});

const bidSchema = z.object({
  proposedPrice: z.number().positive(),
  deliveryDays: z.number().int().positive(),
  coverMessage: z.string().optional(),
  freelancerId: z.string().optional(),
  freelancerName: z.string().optional(),
  freelancerTitle: z.string().optional(),
  freelancerAvatar: z.string().optional(),
  freelancerRating: z.number().optional(),
  isVerified: z.boolean().optional(),
  milestones: z.array(z.object({ title: z.string(), amount: z.number() })).optional(),
});

const contractSchema = z.object({
  id: z.string().optional(),
  bidId: z.string().optional(),
  gigId: z.string(),
  gigTitle: z.string().optional(),
  clientId: z.string(),
  clientName: z.string().optional(),
  clientAvatar: z.string().optional(),
  freelancerId: z.string(),
  freelancerName: z.string().optional(),
  freelancerAvatar: z.string().optional(),
  amount: z.number().positive(),
  status: z.enum(['pending_acceptance', 'in_progress', 'delivered', 'completed', 'revision_requested', 'disputed', 'cancelled']).default('in_progress'),
  escrowFunded: z.boolean().default(true),
  deadline: z.string().optional(),
  milestones: z.array(z.any()).optional(),
  deliverables: z.array(z.any()).optional(),
  upiId: z.string().optional(),
  phoneNumber: z.string().optional(),
  qrCodeUrl: z.string().optional(),
  isDirectAssignment: z.boolean().optional(),
  invitationNote: z.string().optional(),
  clientAccepted: z.boolean().optional(),
  freelancerAccepted: z.boolean().optional(),
  acceptedAt: z.string().optional(),
  declinedAt: z.string().optional(),
  declineReason: z.string().optional(),
});

const messageSchema = z.object({
  id: z.string().optional(),
  orderId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderAvatar: z.string().optional(),
  senderRole: z.enum(['client', 'freelancer', 'admin']).default('client'),
  content: z.string().min(1),
  attachments: z.array(z.string()).optional(),
});

const verificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  userEmail: z.string().optional(),
  professionalTitle: z.string().optional(),
  yearsExperience: z.union([z.string(), z.number()]).optional(),
  status: z.enum(['pending', 'under_review', 'approved', 'rejected']).default('pending'),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  portfolioUrl: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  idDocumentUrl: z.string().optional(),
  selfieUrl: z.string().optional(),
  portfolioFiles: z.array(z.string()).default([]),
  certificates: z.array(z.string()).default([]),
  externalLinks: z.array(z.string()).default([]),
  skillTags: z.array(z.string()).default([]),
  pitchStatement: z.string().default(''),
  adminComment: z.string().optional(),
  reviewNotes: z.string().optional(),
  submittedAt: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
}).passthrough();

const slugify = (value: string) => `${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Math.random().toString(36).slice(2, 8)}`;

// ==========================================
// GIGS ENDPOINTS (Guaranteed Sync)
// ==========================================

router.get('/gigs', async (req, res) => {
  store = loadStore();
  const status = typeof req.query.status === 'string' ? req.query.status : 'all';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';

  let supabaseGigs: any[] = [];
  try {
    let query = supabaseAdmin
      .from('gigs')
      .select('*, profiles!gigs_client_id_fkey(id, full_name, professional_title, avatar_url, is_verified), categories(id, name, slug)')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (!error && data && Array.isArray(data)) {
      supabaseGigs = data;
    }
  } catch {}

  // Merge store gigs and Supabase gigs
  const allGigsMap = new Map<string, any>();

  // Add store gigs first with accurate dynamic proposal count
  for (const gig of store.gigs) {
    const matchingBids = store.bids.filter((b) => String(b.gigId || b.gig_id).trim() === String(gig.id).trim());
    allGigsMap.set(gig.id, {
      ...gig,
      proposalsCount: matchingBids.length > 0 ? matchingBids.length : (gig.proposalsCount || 0),
    });
  }

  // Merge Supabase gigs
  for (const sg of supabaseGigs) {
    if (!allGigsMap.has(sg.id)) {
      const matchingBids = store.bids.filter((b) => String(b.gigId || b.gig_id).trim() === String(sg.id).trim());
      allGigsMap.set(sg.id, {
        id: sg.id,
        clientId: sg.client_id || sg.clientId,
        client_id: sg.client_id || sg.clientId,
        clientName: sg.profiles?.full_name || sg.clientName || 'Enterprise Client',
        clientAvatar: sg.profiles?.avatar_url || sg.clientAvatar,
        clientCompany: sg.clientCompany || 'Enterprise Project',
        clientVerified: sg.profiles?.is_verified ?? true,
        title: sg.title,
        slug: sg.slug,
        description: sg.description,
        budgetMin: sg.budget_min ?? sg.budgetMin ?? 1000,
        budget_min: sg.budget_min ?? sg.budgetMin ?? 1000,
        budgetMax: sg.budget_max ?? sg.budgetMax ?? 5000,
        budget_max: sg.budget_max ?? sg.budgetMax ?? 5000,
        categoryId: sg.categories?.slug || sg.category_id || sg.categoryId || 'fullstack',
        categoryName: sg.categories?.name || sg.categoryName || 'Full-Stack Architecture',
        deadline: sg.deadline,
        status: sg.status || 'open',
        tags: sg.tags || ['Full-Stack'],
        referenceFiles: sg.reference_files || [],
        proposalsCount: matchingBids.length > 0 ? matchingBids.length : (sg.proposalsCount || 0),
        createdAt: sg.created_at || sg.createdAt || new Date().toISOString(),
      });
    }
  }

  let results = Array.from(allGigsMap.values());

  if (status !== 'all') {
    results = results.filter((g) => (g.status || 'open') === status);
  }
  if (search) {
    results = results.filter((g) =>
      g.title.toLowerCase().includes(search) ||
      g.description.toLowerCase().includes(search) ||
      (g.tags && g.tags.some((t: string) => t.toLowerCase().includes(search)))
    );
  }

  // Sort latest first
  results.sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());

  return res.json({ ok: true, gigs: results });
});

router.get('/gigs/:id', async (req, res) => {
  store = loadStore();
  const gigId = req.params.id;

  try {
    const { data, error } = await supabaseAdmin
      .from('gigs')
      .select('*, profiles!gigs_client_id_fkey(id, full_name, professional_title, avatar_url, is_verified), categories(id, name, slug)')
      .eq('id', gigId)
      .single();

    if (!error && data) {
      return res.json({ ok: true, gig: data });
    }
  } catch {}

  const gig = store.gigs.find((g) => String(g.id).trim() === String(gigId).trim() || g.slug === gigId);
  if (!gig) {
    return res.status(404).json({ ok: false, message: 'Gig not found' });
  }

  const matchingBids = store.bids.filter((b) => String(b.gigId || b.gig_id).trim() === String(gig.id).trim());
  return res.json({ ok: true, gig: { ...gig, proposalsCount: matchingBids.length > 0 ? matchingBids.length : (gig.proposalsCount || 0) } });
});

router.post('/gigs', async (req, res) => {
  store = loadStore();
  const parsed = gigSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Invalid gig payload', errors: parsed.error.flatten() });
  }

  const gigId = parsed.data.id || req.body.id || `gig-${Date.now()}`;
  const userId = parsed.data.clientId || (req as any).user?.id || `client-${Date.now()}`;
  
  const newGigData: any = {
    id: gigId,
    client_id: userId,
    clientId: userId,
    title: parsed.data.title,
    slug: slugify(parsed.data.title),
    description: parsed.data.description,
    budget_min: parsed.data.budgetMin,
    budgetMin: parsed.data.budgetMin,
    budget_max: parsed.data.budgetMax,
    budgetMax: parsed.data.budgetMax,
    deadline: parsed.data.deadline || new Date(Date.now() + 14 * 86400000).toISOString(),
    categoryId: parsed.data.categoryId || 'fullstack',
    categoryName: parsed.data.categoryName || 'Full-Stack Architecture',
    tags: parsed.data.tags && parsed.data.tags.length > 0 ? parsed.data.tags : ['Full-Stack', 'Production'],
    reference_files: parsed.data.referenceFiles,
    referenceFiles: parsed.data.referenceFiles,
    status: parsed.data.status || 'open',
    proposalsCount: 0,
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    clientName: parsed.data.clientName || 'Enterprise Client',
    clientAvatar: parsed.data.clientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    clientCompany: parsed.data.clientCompany || 'Verified Enterprise',
    clientVerified: parsed.data.clientVerified ?? true,
    suggestedMilestones: parsed.data.suggestedMilestones || [
      { title: 'System Architecture & Schema Design', amount: Math.round(parsed.data.budgetMin * 0.4) },
      { title: 'Core Functionality & API Integration', amount: Math.round(parsed.data.budgetMin * 0.6) },
    ],
  };

  // Attempt Supabase sync if valid UUID
  try {
    await supabaseAdmin
      .from('gigs')
      .insert({
        client_id: userId,
        title: parsed.data.title,
        slug: newGigData.slug,
        description: parsed.data.description,
        budget_min: parsed.data.budgetMin,
        budget_max: parsed.data.budgetMax,
        deadline: parsed.data.deadline ?? null,
        reference_files: parsed.data.referenceFiles,
        status: parsed.data.status,
      });
  } catch {}

  const existingIdx = store.gigs.findIndex((g) => g.id === newGigData.id || g.slug === newGigData.slug);
  if (existingIdx >= 0) {
    store.gigs[existingIdx] = newGigData;
  } else {
    store.gigs.unshift(newGigData);
  }
  saveStore(store);

  return res.status(201).json({ ok: true, gig: newGigData });
});

router.patch('/gigs/:id', async (req, res) => {
  store = loadStore();
  const gigId = req.params.id;
  const gig = store.gigs.find((g) => String(g.id).trim() === String(gigId).trim());

  if (!gig) {
    return res.status(404).json({ ok: false, message: 'Gig not found' });
  }

  Object.assign(gig, req.body);
  saveStore(store);

  return res.json({ ok: true, gig });
});

// ==========================================
// BIDS / PROPOSALS ENDPOINTS
// ==========================================

router.get('/bids', async (req, res) => {
  store = loadStore();
  const gigId = typeof req.query.gigId === 'string' ? req.query.gigId : undefined;
  const freelancerId = typeof req.query.freelancerId === 'string' ? req.query.freelancerId : undefined;
  const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : undefined;

  let results = [...store.bids];

  // Try fetching additional Supabase bids if available
  try {
    const { data: dbBids } = await supabaseAdmin
      .from('bids')
      .select('*, profiles!bids_freelancer_id_fkey(id, full_name, professional_title, avatar_url, is_verified)');
    if (dbBids && Array.isArray(dbBids)) {
      for (const sb of dbBids) {
        if (!results.some((b) => b.id === sb.id)) {
          results.push({
            id: sb.id,
            gigId: sb.gig_id,
            gig_id: sb.gig_id,
            freelancerId: sb.freelancer_id,
            freelancer_id: sb.freelancer_id,
            freelancerName: sb.profiles?.full_name || 'Verified Freelancer',
            freelancerTitle: sb.profiles?.professional_title || 'Specialist Engineer',
            freelancerAvatar: sb.profiles?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
            freelancerRating: 5.0,
            isVerified: sb.profiles?.is_verified ?? true,
            status: sb.status || 'pending',
            proposedPrice: sb.proposed_price,
            deliveryDays: sb.delivery_days,
            coverMessage: sb.cover_message || '',
            createdAt: sb.created_at,
          });
        }
      }
    }
  } catch {}

  if (gigId) {
    results = results.filter((b) => String(b.gigId || b.gig_id).trim() === String(gigId).trim());
  }
  if (freelancerId) {
    results = results.filter((b) => String(b.freelancerId || b.freelancer_id).trim() === String(freelancerId).trim());
  }
  if (clientId) {
    const clientGigIds = new Set(store.gigs.filter((g) => g.clientId === clientId || g.client_id === clientId).map((g) => String(g.id).trim()));
    results = results.filter((b) => clientGigIds.has(String(b.gigId || b.gig_id).trim()));
  }

  // Sort latest first
  results.sort((a, b) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());

  return res.json({ ok: true, bids: results });
});

router.post('/gigs/:id/bids', async (req, res) => {
  store = loadStore();
  const parsed = bidSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Invalid bid payload', errors: parsed.error.flatten() });
  }

  const gigId = req.params.id;
  const userId = parsed.data.freelancerId || (req as any).user?.id || `freelancer-${Date.now()}`;
  
  const newBid = {
    id: `bid-${Date.now()}`,
    gig_id: gigId,
    gigId: gigId,
    freelancer_id: userId,
    freelancerId: userId,
    proposed_price: parsed.data.proposedPrice,
    proposedPrice: parsed.data.proposedPrice,
    delivery_days: parsed.data.deliveryDays,
    deliveryDays: parsed.data.deliveryDays,
    cover_message: parsed.data.coverMessage ?? '',
    coverMessage: parsed.data.coverMessage ?? '',
    milestones: parsed.data.milestones || [],
    status: 'pending',
    created_at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    freelancerName: parsed.data.freelancerName || 'Professional Freelancer',
    freelancerTitle: parsed.data.freelancerTitle || 'Verified Specialist',
    freelancerAvatar: parsed.data.freelancerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    freelancerRating: parsed.data.freelancerRating ?? 5.0,
    isVerified: parsed.data.isVerified ?? true,
  };

  try {
    await supabaseAdmin
      .from('bids')
      .insert({
        gig_id: gigId,
        freelancer_id: userId,
        proposed_price: parsed.data.proposedPrice,
        delivery_days: parsed.data.deliveryDays,
        cover_message: parsed.data.coverMessage ?? null,
      });
  } catch {}

  // Remove existing bid for same freelancer & gig if re-applying
  const existingIdx = store.bids.findIndex((b) => (String(b.gigId || b.gig_id).trim() === String(gigId).trim()) && (String(b.freelancerId || b.freelancer_id).trim() === String(userId).trim()));
  if (existingIdx >= 0) {
    store.bids.splice(existingIdx, 1);
  }

  store.bids.unshift(newBid);

  // Update proposals count on target gig
  const targetGig = store.gigs.find((g) => String(g.id).trim() === String(gigId).trim());
  if (targetGig) {
    targetGig.proposalsCount = store.bids.filter((b) => String(b.gigId || b.gig_id).trim() === String(gigId).trim()).length;
  }

  saveStore(store);
  return res.status(201).json({ ok: true, bid: newBid });
});

router.patch('/bids/:id/status', async (req, res) => {
  store = loadStore();
  const status = z.enum(['accepted', 'rejected', 'pending']).safeParse(req.body.status);

  if (!status.success) {
    return res.status(400).json({ ok: false, message: 'Status must be accepted, rejected, or pending' });
  }

  const bid = store.bids.find((b) => String(b.id).trim() === String(req.params.id).trim());
  if (bid) {
    bid.status = status.data;
    saveStore(store);
  }

  return res.json({ ok: true, bid: bid || { id: req.params.id, status: status.data } });
});

// ==========================================
// CONTRACTS / ORDERS ENDPOINTS
// ==========================================

router.get('/contracts', async (req, res) => {
  store = loadStore();
  const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
  let results = [...store.contracts];

  if (userId) {
    results = results.filter((c) => String(c.clientId).trim() === String(userId).trim() || String(c.freelancerId).trim() === String(userId).trim());
  }

  results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return res.json({ ok: true, contracts: results });
});

router.get('/orders', async (req, res) => {
  store = loadStore();
  return res.json({ ok: true, contracts: store.contracts });
});

router.get('/contracts/:id', async (req, res) => {
  store = loadStore();
  const contract = store.contracts.find((c) => String(c.id).trim() === String(req.params.id).trim());
  if (!contract) {
    return res.status(404).json({ ok: false, message: 'Contract not found' });
  }
  return res.json({ ok: true, contract });
});

router.post('/contracts', async (req, res) => {
  store = loadStore();
  const parsed = contractSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Invalid contract payload', errors: parsed.error.flatten() });
  }

  const contractId = parsed.data.id || `contract-${Date.now()}`;
  const newContract = {
    id: contractId,
    gigId: parsed.data.gigId,
    gigTitle: parsed.data.gigTitle || 'Project Contract',
    clientId: parsed.data.clientId,
    clientName: parsed.data.clientName || 'Enterprise Client',
    clientAvatar: parsed.data.clientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    freelancerId: parsed.data.freelancerId,
    freelancerName: parsed.data.freelancerName || 'Professional Freelancer',
    freelancerAvatar: parsed.data.freelancerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: parsed.data.status || 'in_progress',
    amount: parsed.data.amount,
    escrowFunded: true,
    deadline: parsed.data.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    revisionCount: 0,
    upiId: parsed.data.upiId,
    phoneNumber: parsed.data.phoneNumber,
    qrCodeUrl: parsed.data.qrCodeUrl,
    milestones: (Array.isArray(parsed.data.milestones) && parsed.data.milestones.length > 0)
      ? parsed.data.milestones.map((m: any, idx: number) => ({
          id: m.id || `m-${contractId}-${idx}`,
          title: m.title || `Milestone ${idx + 1}`,
          amount: Number(m.amount || 0),
          status: m.status || (idx === 0 ? 'in_progress' : 'pending'),
          deadline: m.deadline || new Date(Date.now() + (idx + 1) * 7 * 86400000).toISOString().split('T')[0],
          paymentDetails: m.paymentDetails || (parsed.data.upiId ? { upiId: parsed.data.upiId, phoneNumber: parsed.data.phoneNumber, qrCodeUrl: parsed.data.qrCodeUrl } : undefined),
          paymentProof: m.paymentProof,
          paymentStatus: m.paymentStatus || 'unpaid',
        }))
      : [
          {
            id: `m-${contractId}-0`,
            title: 'System Architecture & Schema Design',
            amount: Math.round(parsed.data.amount * 0.3),
            status: 'in_progress',
            deadline: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            paymentStatus: 'unpaid',
          },
          {
            id: `m-${contractId}-1`,
            title: 'Core Functionality & API Integration',
            amount: Math.round(parsed.data.amount * 0.4),
            status: 'pending',
            deadline: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
            paymentStatus: 'unpaid',
          },
          {
            id: `m-${contractId}-2`,
            title: 'Production Polish, Testing & Deployment',
            amount: parsed.data.amount - Math.round(parsed.data.amount * 0.3) - Math.round(parsed.data.amount * 0.4),
            status: 'pending',
            deadline: parsed.data.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            paymentStatus: 'unpaid',
          },
        ],
    deliverables: parsed.data.deliverables || [],
  };

  // 1. Mark accepted bid and reject others
  if (parsed.data.bidId) {
    store.bids = store.bids.map((b) =>
      String(b.id).trim() === String(parsed.data.bidId).trim()
        ? { ...b, status: 'accepted' }
        : String(b.gigId || b.gig_id).trim() === String(parsed.data.gigId).trim()
        ? { ...b, status: 'rejected' }
        : b
    );
  }

  // 2. Mark gig as awarded
  store.gigs = store.gigs.map((g) =>
    String(g.id).trim() === String(parsed.data.gigId).trim() ? { ...g, status: 'awarded' } : g
  );

  // 3. Add contract
  const existingIdx = store.contracts.findIndex((c) => String(c.id).trim() === String(contractId).trim());
  if (existingIdx >= 0) {
    store.contracts[existingIdx] = newContract;
  } else {
    store.contracts.unshift(newContract);
  }

  // 4. Create initial welcome chat message
  const welcomeMsg = {
    id: `msg-${Date.now()}`,
    orderId: contractId,
    senderId: newContract.clientId,
    senderName: newContract.clientName,
    senderAvatar: newContract.clientAvatar,
    senderRole: 'client',
    content: `Hello ${newContract.freelancerName}! I've accepted your proposal and funded the $${newContract.amount.toLocaleString()} escrow. Looking forward to collaborating!`,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
  store.messages.push(welcomeMsg);

  saveStore(store);
  return res.status(201).json({ ok: true, contract: newContract, welcomeMessage: welcomeMsg });
});

router.patch('/contracts/:id', async (req, res) => {
  store = loadStore();
  const contract = store.contracts.find((c) => String(c.id).trim() === String(req.params.id).trim());

  if (!contract) {
    return res.status(404).json({ ok: false, message: 'Contract not found' });
  }

  Object.assign(contract, req.body);

  if (contract.status === 'completed' && contract.gigId) {
    const targetGig = store.gigs.find((g) => String(g.id).trim() === String(contract.gigId).trim());
    if (targetGig) {
      targetGig.status = 'completed';
    }
  }

  saveStore(store);

  return res.json({ ok: true, contract });
});

// ==========================================
// REAL-TIME CHAT MESSAGING ENDPOINTS
// ==========================================

router.get('/messages', async (req, res) => {
  store = loadStore();
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
  let results = [...store.messages];

  if (orderId) {
    results = results.filter((m) => String(m.orderId).trim() === String(orderId).trim());
  }

  results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return res.json({ ok: true, messages: results });
});

router.get('/orders/:orderId/messages', async (req, res) => {
  store = loadStore();
  const results = store.messages.filter((m) => String(m.orderId).trim() === String(req.params.orderId).trim());
  results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return res.json({ ok: true, messages: results });
});

router.get('/contracts/:orderId/messages', async (req, res) => {
  store = loadStore();
  const results = store.messages.filter((m) => String(m.orderId).trim() === String(req.params.orderId).trim());
  results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return res.json({ ok: true, messages: results });
});

router.post('/orders/:orderId/messages', async (req, res) => {
  store = loadStore();
  const parsed = messageSchema.safeParse({ ...req.body, orderId: req.params.orderId });

  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Invalid message payload', errors: parsed.error.flatten() });
  }

  const newMsg = {
    id: parsed.data.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderId: req.params.orderId,
    senderId: parsed.data.senderId,
    senderName: parsed.data.senderName,
    senderAvatar: parsed.data.senderAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user',
    senderRole: parsed.data.senderRole,
    content: parsed.data.content,
    attachments: parsed.data.attachments || [],
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  store.messages.push(newMsg);
  saveStore(store);

  return res.status(201).json({ ok: true, message: newMsg });
});

router.post('/contracts/:orderId/messages', async (req, res) => {
  store = loadStore();
  const parsed = messageSchema.safeParse({ ...req.body, orderId: req.params.orderId });

  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Invalid message payload', errors: parsed.error.flatten() });
  }

  const newMsg = {
    id: parsed.data.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderId: req.params.orderId,
    senderId: parsed.data.senderId,
    senderName: parsed.data.senderName,
    senderAvatar: parsed.data.senderAvatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user',
    senderRole: parsed.data.senderRole,
    content: parsed.data.content,
    attachments: parsed.data.attachments || [],
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  store.messages.push(newMsg);
  saveStore(store);

  return res.status(201).json({ ok: true, message: newMsg });
});

// ==========================================
// VERIFICATION ENDPOINTS
// ==========================================

router.get('/verifications', async (_req, res) => {
  store = loadStore();
  const verifs = store.verifications || [];
  verifs.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
  return res.json({ ok: true, verifications: verifs });
});

router.post('/verifications', async (req, res) => {
  store = loadStore();
  const parsed = verificationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: 'Invalid verification payload', errors: parsed.error.flatten() });
  }

  const newVerif = {
    id: parsed.data.id || `verif-${Date.now()}`,
    userId: parsed.data.userId || `user-${Date.now()}`,
    userName: parsed.data.userName || 'Applicant',
    userEmail: parsed.data.userEmail || 'applicant@example.com',
    professionalTitle: parsed.data.professionalTitle || 'Software Engineer',
    yearsExperience: parsed.data.yearsExperience ? String(parsed.data.yearsExperience) : '3',
    status: parsed.data.status || 'pending',
    idType: parsed.data.idType || 'passport',
    idNumber: parsed.data.idNumber || '',
    portfolioUrl: parsed.data.portfolioUrl || '',
    specialties: parsed.data.specialties || [],
    idDocumentUrl: parsed.data.idDocumentUrl || 'https://documents.freelancestack.dev/verif/doc.pdf',
    selfieUrl: parsed.data.selfieUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=verified',
    portfolioFiles: parsed.data.portfolioFiles || [],
    certificates: parsed.data.certificates || [],
    externalLinks: parsed.data.externalLinks || [],
    skillTags: parsed.data.skillTags || (parsed.data.specialties || []),
    pitchStatement: parsed.data.pitchStatement || '',
    submittedAt: new Date().toISOString(),
  };

  if (!Array.isArray(store.verifications)) {
    store.verifications = [];
  }

  const existingIdx = store.verifications.findIndex((v) => v.id === newVerif.id || v.userId === newVerif.userId);
  if (existingIdx >= 0) {
    store.verifications[existingIdx] = newVerif;
  } else {
    store.verifications.unshift(newVerif);
  }

  saveStore(store);
  return res.status(201).json({ ok: true, submission: newVerif, verification: newVerif });
});

router.patch('/verifications/:id/decision', async (req, res) => {
  store = loadStore();
  const { status, adminComment, reviewNotes } = req.body;

  if (!status || !['approved', 'rejected', 'under_review'].includes(status)) {
    return res.status(400).json({ ok: false, message: 'Invalid status' });
  }

  if (!Array.isArray(store.verifications)) {
    store.verifications = [];
  }

  const verif = store.verifications.find(
    (v) => String(v.id).trim() === String(req.params.id).trim() || String(v.userId || '').trim() === String(req.params.id).trim()
  );
  if (verif) {
    verif.status = status;
    verif.adminComment = adminComment || reviewNotes || '';
    verif.reviewedAt = new Date().toISOString();

    if (status === 'approved' && Array.isArray(store.bids)) {
      store.bids.forEach((b: any) => {
        if (b.freelancerId === verif.userId || (b.freelancerEmail && b.freelancerEmail.toLowerCase() === verif.userEmail?.toLowerCase())) {
          b.freelancerVerified = true;
        }
      });
    }

    saveStore(store);
    return res.json({
      ok: true,
      submission: verif,
      verification: verif,
      badge: status === 'approved' ? 'Verified Pro' : undefined,
    });
  }

  return res.status(404).json({ ok: false, message: 'Verification record not found' });
});

// ==========================================
// ADMIN GOVERNANCE & STATS ENDPOINTS
// ==========================================

router.get('/admin/stats', async (_req, res) => {
  store = loadStore();

  const totalGMV = store.contracts.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const escrowLocked = store.contracts
    .filter((c) => c.status === 'in_progress' || c.status === 'delivered' || c.status === 'revision_requested' || c.status === 'disputed')
    .reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const escrowReleased = store.contracts
    .filter((c) => c.status === 'completed')
    .reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const platformFees = totalGMV * 0.05;

  const totalGigs = store.gigs.length;
  const openGigs = store.gigs.filter((g) => (g.status || 'open') === 'open').length;
  const awardedGigs = store.gigs.filter((g) => g.status === 'awarded' || g.status === 'in_progress').length;
  const completedGigs = store.gigs.filter((g) => g.status === 'completed').length;

  const totalBids = store.bids.length;
  const pendingBids = store.bids.filter((b) => (b.status || 'pending') === 'pending').length;
  const acceptedBids = store.bids.filter((b) => b.status === 'accepted').length;

  const verifications = store.verifications || [];
  const pendingVerifs = verifications.filter((v) => v.status === 'pending' || v.status === 'under_review').length;
  const approvedVerifs = verifications.filter((v) => v.status === 'approved').length;

  return res.json({
    ok: true,
    stats: {
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
      totalContracts: store.contracts.length,
      pendingVerifications: pendingVerifs,
      verifiedPros: approvedVerifs,
      totalMessages: store.messages.length,
    },
  });
});

router.get('/admin/users', async (_req, res) => {
  store = loadStore();

  const userMap = new Map<string, any>();

  // Add clients from gigs and contracts
  for (const g of store.gigs) {
    if (g.clientId && !userMap.has(g.clientId)) {
      userMap.set(g.clientId, {
        id: g.clientId,
        fullName: g.clientName || 'Enterprise Client',
        email: `${g.clientId}@client.io`,
        role: 'client',
        avatarUrl: g.clientAvatar,
        company: g.clientCompany || 'Enterprise Project',
        isVerified: g.clientVerified ?? true,
        postedGigsCount: store.gigs.filter((x) => x.clientId === g.clientId).length,
        rating: 5.0,
      });
    }
  }

  // Add freelancers from bids and contracts
  for (const b of store.bids) {
    if (b.freelancerId && !userMap.has(b.freelancerId)) {
      userMap.set(b.freelancerId, {
        id: b.freelancerId,
        fullName: b.freelancerName || 'Professional Freelancer',
        email: `${b.freelancerId}@freelancestack.dev`,
        role: 'freelancer',
        avatarUrl: b.freelancerAvatar,
        professionalTitle: b.freelancerTitle || 'Specialist Engineer',
        isVerified: b.isVerified ?? true,
        bidsCount: store.bids.filter((x) => x.freelancerId === b.freelancerId).length,
        rating: b.freelancerRating ?? 5.0,
      });
    }
  }

  // Add admin user
  userMap.set('admin-master-node', {
    id: 'admin-master-node',
    fullName: 'Master Administrator',
    email: 'admin@freelancestack.io',
    role: 'admin',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin-governance-shield',
    professionalTitle: 'Platform Governance & Escrow Mediator',
    isVerified: true,
    rating: 5.0,
  });

  return res.json({ ok: true, users: Array.from(userMap.values()) });
});

router.patch('/admin/gigs/:id', async (req, res) => {
  store = loadStore();
  const gigId = req.params.id;
  const gig = store.gigs.find((g) => String(g.id).trim() === String(gigId).trim());

  if (!gig) {
    return res.status(404).json({ ok: false, message: 'Gig not found' });
  }

  if (req.body.action === 'delete') {
    store.gigs = store.gigs.filter((g) => String(g.id).trim() !== String(gigId).trim());
    store.bids = store.bids.filter((b) => String(b.gigId || b.gig_id).trim() !== String(gigId).trim());
    saveStore(store);
    return res.json({ ok: true, message: 'Gig deleted by admin' });
  }

  if (req.body.status) {
    gig.status = req.body.status;
  }
  if (req.body.isFeatured !== undefined) {
    gig.isFeatured = Boolean(req.body.isFeatured);
  }

  saveStore(store);
  return res.json({ ok: true, gig });
});

router.patch('/admin/contracts/:id', async (req, res) => {
  store = loadStore();
  const contractId = req.params.id;
  const contract = store.contracts.find((c) => String(c.id).trim() === String(contractId).trim());

  if (!contract) {
    return res.status(404).json({ ok: false, message: 'Contract not found' });
  }

  const { action, resolutionNotes } = req.body;

  if (action === 'release_escrow') {
    contract.status = 'completed';
    contract.completedAt = new Date().toISOString();
    (contract.milestones || []).forEach((m: any) => {
      m.status = 'approved';
      m.approvedAt = new Date().toISOString();
    });
  } else if (action === 'refund_client') {
    contract.status = 'cancelled';
    (contract.milestones || []).forEach((m: any) => {
      m.status = 'cancelled';
    });
  } else if (action === 'mark_disputed') {
    contract.status = 'disputed';
  }

  const adminMsg = {
    id: `msg-${Date.now()}`,
    orderId: contractId,
    senderId: 'admin-master-node',
    senderName: 'Platform Governance Admin',
    senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin-governance-shield',
    senderRole: 'admin',
    content: `🛡️ **Admin Governance Action (${action})**\n${resolutionNotes || 'Escrow action finalized by Platform Administrator.'}`,
    createdAt: new Date().toISOString(),
    isRead: false,
  };
  store.messages.push(adminMsg);

  saveStore(store);
  return res.json({ ok: true, contract, adminMessage: adminMsg });
});

// ==========================================
// CUSTOMER & FREELANCER SUPPORT DESK ROUTES
// ==========================================

router.get('/tickets', async (req, res) => {
  store = loadStore();
  const { userId, role, status, priority, category, search } = req.query;

  let list = Array.isArray(store.tickets) ? [...store.tickets] : [];

  if (userId) {
    list = list.filter((t) => String(t.userId).trim() === String(userId).trim());
  } else if (role && role !== 'admin') {
    list = list.filter((t) => t.userRole === role);
  }

  if (status && status !== 'all') {
    list = list.filter((t) => t.status === status);
  }

  if (priority && priority !== 'all') {
    list = list.filter((t) => t.priority === priority);
  }

  if (category && category !== 'all') {
    list = list.filter((t) => t.category === category);
  }

  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (t) =>
        (t.ticketNumber && t.ticketNumber.toLowerCase().includes(q)) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.userName && t.userName.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

  return res.json({ ok: true, tickets: list });
});

router.get('/tickets/:id', async (req, res) => {
  store = loadStore();
  const ticketId = req.params.id;
  const ticket = (store.tickets || []).find((t) => String(t.id).trim() === String(ticketId).trim());

  if (!ticket) {
    return res.status(404).json({ ok: false, message: 'Ticket not found' });
  }

  return res.json({ ok: true, ticket });
});

router.post('/tickets', async (req, res) => {
  store = loadStore();
  const {
    userId,
    userName,
    userEmail,
    userRole,
    userAvatar,
    subject,
    category,
    priority,
    description,
    contractId,
    contractTitle,
    gigId,
    gigTitle,
    attachments,
  } = req.body;

  if (!userId || !subject || !description) {
    return res.status(400).json({ ok: false, message: 'Missing required ticket fields' });
  }

  const ticketId = `ticket-${Date.now()}`;
  const ticketNumber = `#TCK-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const initialMsg = {
    id: `msg-tck-${Date.now()}`,
    ticketId,
    senderId: userId,
    senderName: userName || 'User',
    senderRole: userRole || 'client',
    senderAvatar: userAvatar || (userRole === 'client' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' : 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400'),
    content: description,
    attachments: attachments || [],
    createdAt: now,
  };

  const autoBotMsg = {
    id: `msg-tck-${Date.now() + 2}`,
    ticketId,
    senderId: 'system-support-bot',
    senderName: 'FreelanceStack Support Bot',
    senderRole: 'support_agent',
    senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=support-ai-bot',
    content: `👋 Hello ${userName || 'there'}! We have received your support inquiry regarding **${subject}** (Reference: ${ticketNumber}). A Platform Administrator has been notified and is reviewing your case. Typical response turnaround is under 15 minutes.`,
    createdAt: new Date(Date.now() + 500).toISOString(),
  };

  const newTicket = {
    id: ticketId,
    ticketNumber,
    userId,
    userName: userName || 'User',
    userEmail: userEmail || `${userId}@platform.dev`,
    userRole: userRole || 'client',
    userAvatar: userAvatar || initialMsg.senderAvatar,
    subject,
    category: category || 'general',
    priority: priority || 'medium',
    status: 'open',
    description,
    contractId,
    contractTitle,
    gigId,
    gigTitle,
    attachments: attachments || [],
    messages: [initialMsg, autoBotMsg],
    adminNotes: '',
    createdAt: now,
    updatedAt: now,
  };

  if (!Array.isArray(store.tickets)) {
    store.tickets = [];
  }
  store.tickets.unshift(newTicket);
  saveStore(store);

  return res.status(201).json({ ok: true, ticket: newTicket });
});

router.post('/tickets/:id/messages', async (req, res) => {
  store = loadStore();
  const ticketId = req.params.id;
  const ticket = (store.tickets || []).find((t) => String(t.id).trim() === String(ticketId).trim());

  if (!ticket) {
    return res.status(404).json({ ok: false, message: 'Ticket not found' });
  }

  const { senderId, senderName, senderRole, senderAvatar, content, attachments } = req.body;

  if (!content) {
    return res.status(400).json({ ok: false, message: 'Message content is required' });
  }

  const now = new Date().toISOString();
  const newMsg = {
    id: `msg-tck-${Date.now()}`,
    ticketId,
    senderId: senderId || 'unknown',
    senderName: senderName || 'Platform Support Representative',
    senderRole: senderRole || 'support_agent',
    senderAvatar: senderAvatar || (senderRole === 'admin' ? 'https://api.dicebear.com/7.x/bottts/svg?seed=admin-governance-shield' : 'https://api.dicebear.com/7.x/bottts/svg?seed=user'),
    content,
    attachments: attachments || [],
    createdAt: now,
  };

  if (!Array.isArray(ticket.messages)) {
    ticket.messages = [];
  }
  ticket.messages.push(newMsg);
  ticket.updatedAt = now;

  if (senderRole === 'admin' || senderRole === 'support_agent') {
    if (ticket.status === 'open') {
      ticket.status = 'in_progress';
    }
  } else if (ticket.status === 'resolved' || ticket.status === 'closed') {
    ticket.status = 'open'; // Reopen ticket if user sends a follow-up
  }

  saveStore(store);
  return res.json({ ok: true, message: newMsg, ticket });
});

router.patch('/tickets/:id', async (req, res) => {
  store = loadStore();
  const ticketId = req.params.id;
  const ticket = (store.tickets || []).find((t) => String(t.id).trim() === String(ticketId).trim());

  if (!ticket) {
    return res.status(404).json({ ok: false, message: 'Ticket not found' });
  }

  const { status, priority, adminNotes } = req.body;
  const now = new Date().toISOString();

  if (status) {
    ticket.status = status;
    if (status === 'resolved') {
      ticket.resolvedAt = now;
    }
  }
  if (priority) {
    ticket.priority = priority;
  }
  if (adminNotes !== undefined) {
    ticket.adminNotes = adminNotes;
  }

  ticket.updatedAt = now;
  saveStore(store);

  return res.json({ ok: true, ticket });
});

router.delete('/tickets/:id', async (req, res) => {
  store = loadStore();
  const ticketId = req.params.id;
  store.tickets = (store.tickets || []).filter((t) => String(t.id).trim() !== String(ticketId).trim());
  saveStore(store);
  return res.json({ ok: true, message: 'Ticket deleted' });
});

export default router;