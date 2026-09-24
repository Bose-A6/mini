import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
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
  const { currentUser, submitVerification, setActiveView } = useApp();

  const [currentStep, setCurrentStep] = useState<StepKey>('basic');
  const [formData, setFormData] = useState({
    professionalTitle: currentUser?.professionalTitle || 'Staff Full-Stack & AI Engineer',
    yearsExperience: '5',
    idDocumentUrl: 'https://documents.freelancestack.dev/verif/passport-scan-encrypted.pdf',
    selfieUrl: currentUser?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=applicant',
    portfolioFiles: ['https://github.com/freelancestack/demo-showcase', 'https://dribbble.com/craft-shots'],
    certificates: ['https://certificates.coursera.org/verified-meta-fullstack.pdf'],
    externalLinks: ['https://linkedin.com/in/freelancer-pro', 'https://github.com/freelancestack'],
    skillTags: currentUser?.skills && currentUser.skills.length > 0 ? currentUser.skills : ['React / Next.js', 'TypeScript', 'Supabase & PostgreSQL'],
    pitchStatement: currentUser?.bio || 'Seasoned full-stack engineer with 5+ years building scalable SaaS web applications with high security and testing standards.',
  });

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
    setActiveView('freelancer');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ maxWidth: '850px', margin: '0 auto 32px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#c7d2fe', fontSize: '0.85rem', fontWeight: 600, marginBottom: '14px' }}>
          <Sparkles size={14} /> Trust & Verification Center
        </div>
        <h2>Earn Your Gold Verified Pro Badge</h2>
        <p style={{ maxWidth: '600px', margin: '8px auto 0' }}>
          Verified talent win 4.2x more proposals, command 35% higher hourly rates, and receive priority placement in client searches.
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
                  Your identity documents are encrypted end-to-end and stored in a SOC2-compliant secure vault, accessible strictly by the compliance team.
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
                  CERTIFICATE OR ACCREDITATION LINK
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
                  placeholder="Describe your background, what sets your engineering apart, and the value you bring to enterprise founders..."
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
                    <span style={{ color: 'var(--text-muted)' }}>Name: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{currentUser?.fullName || 'Verification Applicant'}</strong>
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
                    <span style={{ color: 'var(--text-muted)' }}>Skills: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formData.skillTags.join(', ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Portfolio: </span>
                    <a href={formData.portfolioFiles[0]} target="_blank" rel="noreferrer">{formData.portfolioFiles[0]}</a>
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
                <ShieldCheck size={16} /> Submit for Admin Review
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
