import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  ExternalLink,
  Award,
  AlertCircle,
  Lock,
  Edit3,
} from 'lucide-react';

type StepKey = 'basic' | 'identity' | 'skills' | 'pitch' | 'review';

const SKILL_CATALOG = [
  'React / Next.js',
  'TypeScript',
  'Node.js & Express',
  'Python & AI Agents',
  'Supabase & PostgreSQL',
  'UI/UX & Figma',
  'Cloud DevOps & Docker',
  'TailwindCSS',
  'GraphQL',
  'Web3 & Solidity',
];

export const VerificationWizard: React.FC = () => {
  const {
    currentUser,
    verifications,
    submitVerification,
    setActiveView,
    refreshGigs,
    isSyncingGigs,
  } = useApp();

  // Find user's verification submission
  const myVerif = (verifications || []).find(
    (v) =>
      currentUser &&
      (v.userId === currentUser.id ||
        (v.userEmail && v.userEmail.toLowerCase() === currentUser.email?.toLowerCase()))
  );

  const isApproved = currentUser?.isVerified === true || myVerif?.status === 'approved';
  const isPending = myVerif?.status === 'pending' || myVerif?.status === 'under_review';
  const isRejected = myVerif?.status === 'rejected';

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<StepKey>('basic');

  const [formData, setFormData] = useState({
    professionalTitle: myVerif?.professionalTitle || currentUser?.professionalTitle || 'Staff Full-Stack & AI Engineer',
    yearsExperience: myVerif?.yearsExperience ? String(myVerif.yearsExperience) : '5',
    idDocumentUrl: myVerif?.idDocumentUrl || 'https://documents.freelancestack.dev/verif/passport-scan-encrypted.pdf',
    selfieUrl: myVerif?.selfieUrl || currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=applicant',
    portfolioFiles: myVerif?.portfolioFiles?.length
      ? myVerif.portfolioFiles
      : ['https://github.com/freelancestack/demo-showcase', 'https://dribbble.com/craft-shots'],
    certificates: myVerif?.certificates?.length
      ? myVerif.certificates
      : ['https://certificates.coursera.org/verified-meta-fullstack.pdf'],
    externalLinks: myVerif?.externalLinks?.length
      ? myVerif.externalLinks
      : ['https://linkedin.com/in/freelancer-pro', 'https://github.com/freelancestack'],
    skillTags: myVerif?.skillTags?.length
      ? myVerif.skillTags
      : currentUser?.skills && currentUser.skills.length > 0
      ? currentUser.skills
      : ['React / Next.js', 'TypeScript', 'Supabase & PostgreSQL'],
    pitchStatement:
      myVerif?.pitchStatement ||
      currentUser?.bio ||
      'Seasoned full-stack engineer with 5+ years building scalable SaaS web applications with high security and testing standards.',
  });

  // Sync formData if myVerif updates
  useEffect(() => {
    if (myVerif) {
      setFormData({
        professionalTitle: myVerif.professionalTitle || 'Staff Full-Stack & AI Engineer',
        yearsExperience: myVerif.yearsExperience ? String(myVerif.yearsExperience) : '5',
        idDocumentUrl: myVerif.idDocumentUrl || 'https://documents.freelancestack.dev/verif/passport-scan-encrypted.pdf',
        selfieUrl: myVerif.selfieUrl || currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=applicant',
        portfolioFiles: myVerif.portfolioFiles?.length
          ? myVerif.portfolioFiles
          : ['https://github.com/freelancestack/demo-showcase'],
        certificates: myVerif.certificates?.length
          ? myVerif.certificates
          : ['https://certificates.coursera.org/verified-meta-fullstack.pdf'],
        externalLinks: myVerif.externalLinks?.length
          ? myVerif.externalLinks
          : ['https://linkedin.com/in/freelancer-pro'],
        skillTags: myVerif.skillTags?.length
          ? myVerif.skillTags
          : ['React / Next.js', 'TypeScript', 'Supabase & PostgreSQL'],
        pitchStatement: myVerif.pitchStatement || '',
      });
    }
  }, [myVerif, currentUser]);

  const steps: { key: StepKey; title: string; desc: string }[] = [
    { key: 'basic', title: '1. Professional Profile', desc: 'Title & experience' },
    { key: 'identity', title: '2. Identity Verification', desc: 'Encrypted ID scan' },
    { key: 'skills', title: '3. Proof of Skill', desc: 'Certificates & links' },
    { key: 'pitch', title: '4. Client Pitch', desc: 'Value proposition' },
    { key: 'review', title: '5. Final Review', desc: 'Submit for review' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.key === currentStep);
  const progressPct = ((currentStepIdx + 1) / steps.length) * 100;

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skillTags: prev.skillTags.includes(skill)
        ? prev.skillTags.filter((s) => s !== skill)
        : [...prev.skillTags, skill],
    }));
  };

  const handleNext = () => {
    if (currentStepIdx < steps.length - 1) {
      setCurrentStep(steps[currentStepIdx + 1].key);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStep(steps[currentStepIdx - 1].key);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitVerification(formData);
    setIsEditing(false);
  };

  // =========================================================================
  // VIEW 1: APPROVED STATE (Gold Verified Talent Pass)
  // =========================================================================
  if (isApproved && !isEditing) {
    return (
      <div className="app-container">
        <div style={{ maxWidth: '850px', margin: '0 auto 32px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: 'var(--accent-emerald)',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '14px',
            }}
          >
            <CheckCircle2 size={16} /> OFFICIAL VERIFIED PRO
          </div>
          <h2>Verified Talent Credential Pass</h2>
          <p style={{ maxWidth: '600px', margin: '8px auto 0' }}>
            Your identity, portfolio, and technical credentials have been audited and approved by the Platform Administrator.
          </p>
        </div>

        <div className="glass-panel" style={{ maxWidth: '850px', margin: '0 auto', padding: '36px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={formData.selfieUrl}
                  alt={currentUser?.fullName || 'Verified Talent'}
                  style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-emerald)' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    background: 'var(--accent-emerald)',
                    color: '#050a12',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Audited by Administrator"
                >
                  <CheckCircle2 size={14} strokeWidth={3} />
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {currentUser?.fullName || 'Verified Specialist'}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: 600, margin: 0 }}>
                  {formData.professionalTitle} • {formData.yearsExperience} Years Exp
                </p>
              </div>
            </div>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--accent-emerald)',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              <Award size={16} /> KYC & Portfolio Approved
            </span>
          </div>

          {/* Verified Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                VERIFIED SKILLS
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {formData.skillTags.map((s) => (
                  <span key={s} className="tag-badge" style={{ fontSize: '0.75rem' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                AUDITED LINKS
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                <a href={formData.portfolioFiles[0]} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
                  <ExternalLink size={14} /> Portfolio Showcase
                </a>
                {formData.certificates[0] && (
                  <a href={formData.certificates[0]} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)' }}>
                    <Award size={14} /> Verified Certificate
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Pitch */}
          <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', marginBottom: '32px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              ACTIVE CLIENT PITCH STATEMENT
            </span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              "{formData.pitchStatement}"
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <button
              className="btn-secondary"
              onClick={() => setIsEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={15} /> Update Application Profile
            </button>

            <button
              className="btn-primary"
              onClick={() => setActiveView('freelancer')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Go to Freelancer Workspace</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: REJECTED STATE (Admin Feedback & 1-Click Correction)
  // =========================================================================
  if (isRejected && !isEditing) {
    return (
      <div className="app-container">
        <div style={{ maxWidth: '850px', margin: '0 auto 32px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: 'var(--accent-rose)',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '14px',
            }}
          >
            <XCircle size={16} /> VERIFICATION REVISION REQUIRED
          </div>
          <h2>Application Not Approved by Administrator</h2>
          <p style={{ maxWidth: '600px', margin: '8px auto 0' }}>
            The Platform Administrator reviewed your credentials and left feedback requiring updates before granting marketplace access.
          </p>
        </div>

        <div className="glass-panel" style={{ maxWidth: '850px', margin: '0 auto', padding: '36px', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
          {/* Admin Feedback Box */}
          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)', fontWeight: 700, marginBottom: '8px' }}>
              <AlertCircle size={18} />
              <span>ADMINISTRATOR AUDIT FEEDBACK:</span>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#fda4af', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
              "{myVerif?.adminComment || 'Please provide updated identification documents and a live working link to your portfolio/code showcase.'}"
            </p>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '28px' }}>
            FreelanceStack enforces strict verification standards to protect client funds in our milestone escrow vault. You can update your submission with the requested corrections and re-submit for immediate administrator review.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn-primary"
              onClick={() => setIsEditing(true)}
              style={{ padding: '12px 28px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Edit3 size={18} />
              <span>Fix Details & Resubmit Application</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: PENDING / UNDER REVIEW STATE (Live Audit Status Portal)
  // =========================================================================
  if (isPending && !isEditing) {
    return (
      <div className="app-container">
        <div style={{ maxWidth: '850px', margin: '0 auto 32px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--accent-amber)',
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '14px',
            }}
          >
            <Clock size={16} className="spin-icon" /> APPLICATION UNDER REVIEW
          </div>
          <h2>Portal Access Gated — Pending Administrator Approval</h2>
          <p style={{ maxWidth: '640px', margin: '8px auto 0' }}>
            To safeguard our marketplace escrow vault and maintain elite engineering standards, freelancer accounts must be audited and approved by the Platform Administrator before bidding on client projects.
          </p>
        </div>

        <div className="glass-panel" style={{ maxWidth: '850px', margin: '0 auto', padding: '36px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          {/* Timeline */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} /> 1. Application Submitted
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                {myVerif?.submittedAt ? new Date(myVerif.submittedAt).toLocaleDateString() : 'Received'}
              </span>
            </div>

            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)', fontWeight: 700, fontSize: '0.85rem' }}>
                <Clock size={16} /> 2. Admin KYC & Skill Audit
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', display: 'block', marginTop: '4px' }}>
                In Progress (Priority Queue)
              </span>
            </div>

            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>
                <Lock size={16} /> 3. Marketplace Unlock
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Awaiting Admin Sign-off
              </span>
            </div>
          </div>

          {/* Submitted Dossier Details */}
          <div style={{ padding: '22px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', marginBottom: '28px' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="var(--accent-cyan)" /> Submitted Verification Dossier
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>APPLICANT</span>
                <strong style={{ color: 'var(--text-primary)' }}>{myVerif?.userName || currentUser?.fullName}</strong>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>{myVerif?.userEmail || currentUser?.email}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>PROFESSIONAL TITLE</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formData.professionalTitle}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>EXPERIENCE</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formData.yearsExperience} Years</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>PORTFOLIO / SHOWCASE</span>
                <a href={formData.portfolioFiles[0]} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>
                  {formData.portfolioFiles[0]}
                </a>
              </div>
            </div>

            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', marginBottom: '6px' }}>
                SELECTED CORE SKILLS
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {formData.skillTags.map((s) => (
                  <span key={s} className="tag-badge" style={{ fontSize: '0.75rem' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <button
              className="btn-secondary"
              onClick={() => setIsEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Edit3 size={15} /> Edit Submitted Info
            </button>

            <button
              className="btn-primary"
              onClick={() => refreshGigs()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={15} className={isSyncingGigs ? 'spin-icon' : ''} />
              <span>{isSyncingGigs ? 'Checking Approval Status...' : 'Check Live Approval Status'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 4: 5-STEP VERIFICATION APPLICATION WIZARD
  // =========================================================================
  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ maxWidth: '850px', margin: '0 auto 32px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#c7d2fe',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '14px',
          }}
        >
          <Sparkles size={14} /> Trust & Verification Center
        </div>
        <h2>{isEditing ? 'Update Your Verification Application' : 'Complete Verification to Unlock Freelancer Portal'}</h2>
        <p style={{ maxWidth: '620px', margin: '8px auto 0' }}>
          FreelanceStack is an exclusive, vetted talent marketplace. Submit your identity documents, skills, and portfolio for Administrator approval.
        </p>
      </div>

      {/* Wizard Box */}
      <div className="glass-panel" style={{ maxWidth: '850px', margin: '0 auto', padding: '36px' }}>
        {/* Stepper Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Step {currentStepIdx + 1} of {steps.length}: <strong>{steps[currentStepIdx].title}</strong>
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>{Math.round(progressPct)}% Complete</strong>
          </div>

          <div style={{ width: '100%', height: '8px', borderRadius: 'var(--radius-full)', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                background: 'var(--accent-gradient)',
                borderRadius: 'inherit',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Step Contents */}
        <form onSubmit={handleSubmit}>
          {/* STEP 1: Basic */}
          {currentStep === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  PROFESSIONAL TITLE
                </label>
                <input
                  type="text"
                  value={formData.professionalTitle}
                  onChange={(e) => setFormData({ ...formData, professionalTitle: e.target.value })}
                  style={{ width: '100%' }}
                  placeholder="e.g. Senior Full-Stack & GenAI Architect"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  YEARS OF PROFESSIONAL EXPERIENCE
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  SELECT CORE SKILLS (SELECT 3 OR MORE)
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {SKILL_CATALOG.map((skill) => {
                    const isSelected = formData.skillTags.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          color: isSelected ? '#e0e7ff' : 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        {skill} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Identity */}
          {currentStep === 'identity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '18px', borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                <strong style={{ fontSize: '0.95rem', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={18} /> Zero-Knowledge Identity Protection
                </strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                  Your identity documents are encrypted end-to-end and stored in a SOC2-compliant secure vault, accessible strictly by the Platform Administrator for KYC audit.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  PASSPORT / DRIVER LICENSE DOCUMENT URL
                </label>
                <input
                  type="url"
                  value={formData.idDocumentUrl}
                  onChange={(e) => setFormData({ ...formData, idDocumentUrl: e.target.value })}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  VERIFIED PROFILE PHOTO / LIVE SELFIE URL
                </label>
                <input
                  type="url"
                  value={formData.selfieUrl}
                  onChange={(e) => setFormData({ ...formData, selfieUrl: e.target.value })}
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 3: Proof of Skill */}
          {currentStep === 'skills' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  PORTFOLIO / GITHUB SHOWCASE URL
                </label>
                <input
                  type="url"
                  value={formData.portfolioFiles[0] || ''}
                  onChange={(e) => setFormData({ ...formData, portfolioFiles: [e.target.value] })}
                  style={{ width: '100%' }}
                  placeholder="https://github.com/your-name or https://dribbble.com/your-name"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  CERTIFICATE OR ACCREDITATION LINK (OPTIONAL)
                </label>
                <input
                  type="url"
                  value={formData.certificates[0] || ''}
                  onChange={(e) => setFormData({ ...formData, certificates: [e.target.value] })}
                  style={{ width: '100%' }}
                  placeholder="https://certificates.coursera.org/..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  LINKEDIN OR SOCIAL PROOF PROFILE
                </label>
                <input
                  type="url"
                  value={formData.externalLinks[0] || ''}
                  onChange={(e) => setFormData({ ...formData, externalLinks: [e.target.value] })}
                  style={{ width: '100%' }}
                  placeholder="https://linkedin.com/in/your-profile"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Pitch */}
          {currentStep === 'pitch' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  PROFESSIONAL ELEVATOR PITCH FOR CLIENTS
                </label>
                <textarea
                  rows={6}
                  value={formData.pitchStatement}
                  onChange={(e) => setFormData({ ...formData, pitchStatement: e.target.value })}
                  placeholder="Describe your engineering background, major technical achievements, and the high-impact value you bring to founders..."
                  style={{ width: '100%', resize: 'vertical' }}
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 5: Final Review */}
          {currentStep === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Review Verification Summary</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Applicant: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{currentUser?.fullName || 'Verification Applicant'}</strong> ({currentUser?.email})
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Title: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formData.professionalTitle}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Experience: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formData.yearsExperience} Years</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Core Skills: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formData.skillTags.join(', ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Portfolio: </span>
                    <a href={formData.portfolioFiles[0]} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>
                      {formData.portfolioFiles[0]}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
              style={{ opacity: currentStepIdx === 0 ? 0.4 : 1 }}
            >
              <ArrowLeft size={16} /> Previous
            </button>

            {currentStepIdx < steps.length - 1 ? (
              <button type="button" className="btn-primary" onClick={handleNext}>
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" className="btn-success">
                <ShieldCheck size={16} /> Submit for Administrator Approval
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
