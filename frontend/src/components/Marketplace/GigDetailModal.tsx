import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  CheckCircle2,
  Calendar,
  Sparkles,
  Send,
  FileText,
  Users,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export const GigDetailModal: React.FC = () => {
  const {
    gigs,
    bids,
    verifications,
    selectedGigId,
    setSelectedGigId,
    currentUser,
    submitBid,
    acceptBidAndCreateContract,
    setSelectedContractId,
    setActiveView,
    getCollaborationBetween,
    getFreelancerRating,
    addToast,
  } = useApp();

  const gig = gigs.find((g) => String(g.id).trim() === String(selectedGigId || '').trim());

  const isFreelancer = currentUser?.role === 'freelancer' || (!currentUser && gig?.status === 'open');
  const myVerif = (verifications || []).find(
    (v) =>
      currentUser &&
      (v.userId === currentUser.id ||
        (v.userEmail && v.userEmail.toLowerCase() === currentUser.email?.toLowerCase()))
  );
  const isVerifiedFreelancer = currentUser?.isVerified === true || myVerif?.status === 'approved';
  const isClientOwner = currentUser?.role === 'client' && gig?.clientId === currentUser?.id;

  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'apply'>(() => {
    return isFreelancer && gig?.status === 'open' ? 'apply' : 'overview';
  });
  const [proposedPrice, setProposedPrice] = useState<number>(() => (gig ? Math.round((gig.budgetMin + gig.budgetMax) / 2) : 2500));
  const [deliveryDays, setDeliveryDays] = useState<number>(14);
  const [coverMessage, setCoverMessage] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state whenever selectedGigId changes
  React.useEffect(() => {
    if (gig) {
      setProposedPrice(Math.round((gig.budgetMin + gig.budgetMax) / 2));
      if (currentUser?.role === 'freelancer' && gig.status === 'open') {
        setActiveTab('apply');
      } else {
        setActiveTab('overview');
      }
    }
  }, [selectedGigId, currentUser?.role, gig?.status]);

  if (!gig) return null;

  const gigBids = bids.filter((b) => String(b.gigId || (b as any).gig_id || '').trim() === String(gig.id).trim());
  const platformFee = proposedPrice * 0.05;
  const netEarnings = proposedPrice - platformFee;

  // AI Proposal Generator
  const generateAiProposal = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      const skillsText = currentUser?.skills?.length ? currentUser.skills.slice(0, 3).join(', ') : (gig.categoryName || 'professional delivery & strategy');
      const senderName = currentUser?.fullName || 'Verified Specialist';
      const pitch = `Hi ${gig.clientName},\n\nI reviewed your requirements for "${gig.title}" in ${gig.categoryName || 'this field'} and would love to collaborate. With my background in ${skillsText}, I have delivered similar high-impact projects with verified results.\n\nMy approach:\n1. Detailed requirements alignment and clear milestone execution roadmap.\n2. Strict quality standards, milestone deliverables, and transparent communication.\n3. Continuous milestone demonstrations and comprehensive handover package.\n\nI am available to start immediately and guarantee on-time delivery within ${deliveryDays} days.\n\nBest regards,\n${senderName}`;
      setCoverMessage(pitch);
      setIsGeneratingAi(false);
      addToast('info', 'Proposal Pitch Generated ✨', 'Tailored proposal draft created based on project brief.');
    }, 500);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isFreelancer && !isVerifiedFreelancer) {
      addToast('warning', 'Verification Required', 'You must be approved by the Administrator before submitting proposals.');
      return;
    }
    if (!coverMessage.trim()) {
      addToast('warning', 'Missing Proposal', 'Please write a brief cover message.');
      return;
    }

    setIsSubmitting(true);
    submitBid(gig.id, proposedPrice, deliveryDays, coverMessage, gig.suggestedMilestones);
    setCoverMessage('');
    setActiveTab('proposals');
    setTimeout(() => setIsSubmitting(false), 800);
  };

  const handleHireFromModal = (bidId: string) => {
    const contract = acceptBidAndCreateContract(bidId);
    if (contract) {
      setSelectedContractId(contract.id);
      setSelectedGigId(null);
      setActiveView('contracts');
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setSelectedGigId(null)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={() => setSelectedGigId(null)}>
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--accent-cyan)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {gig.categoryName}
            </span>
            {isClientOwner && (
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 800,
                }}
              >
                YOUR POSTED PROJECT
              </span>
            )}
            {gig.isFeatured && (
              <span className="featured-pill">
                <Sparkles size={12} /> Featured Gig
              </span>
            )}
            <span
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: gig.status === 'open' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                color: gig.status === 'open' ? 'var(--accent-emerald)' : 'var(--accent-primary)',
                fontWeight: 700,
              }}
            >
              {gig.status.toUpperCase()}
            </span>
          </div>

          <h2 style={{ fontSize: '1.6rem', marginBottom: '12px' }}>{gig.title}</h2>

          {/* Client & Budget Meta Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={gig.clientAvatar} alt={gig.clientName} className="client-avatar-sm" />
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {gig.clientName}
                  {gig.clientVerified && <CheckCircle2 size={14} color="var(--accent-emerald)" />}
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {gig.clientCompany || 'Verified Enterprise'} • ${gig.clientSpent.toLocaleString()} spent
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ESTIMATED BUDGET</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--accent-emerald)' }}>
                  ${gig.budgetMin.toLocaleString()} - ${gig.budgetMax.toLocaleString()}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TARGET DEADLINE</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {new Date(gig.deadline).toLocaleDateString()}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '24px',
            paddingBottom: '8px',
          }}
        >
          <button
            className={`btn-ghost ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{
              borderBottom: activeTab === 'overview' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              borderRadius: 0,
              color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            <FileText size={16} /> Project Brief & Scope
          </button>

          <button
            className={`btn-ghost ${activeTab === 'proposals' ? 'active' : ''}`}
            onClick={() => setActiveTab('proposals')}
            style={{
              borderBottom: activeTab === 'proposals' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              borderRadius: 0,
              color: activeTab === 'proposals' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            <Users size={16} /> Proposals ({gigBids.length})
          </button>

          {isFreelancer && gig.status === 'open' && (
            <button
              className={`btn-ghost ${activeTab === 'apply' ? 'active' : ''}`}
              onClick={() => setActiveTab('apply')}
              style={{
                borderBottom: activeTab === 'apply' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                borderRadius: 0,
                color: activeTab === 'apply' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                fontWeight: 700,
              }}
            >
              <Sparkles size={16} /> ⚡ Send Request / Submit Proposal
            </button>
          )}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Project Description</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#cbd5e1', whiteSpace: 'pre-line' }}>
                {gig.description}
              </p>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Required Skills & Technologies</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {gig.tags.map((tag) => (
                  <span key={tag} className="tag-badge" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Suggested Milestones */}
            {gig.suggestedMilestones && gig.suggestedMilestones.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>Suggested Milestones Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {gig.suggestedMilestones.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#c7d2fe',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{m.title}</span>
                      </div>
                      <strong style={{ color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>
                        ${m.amount.toLocaleString()}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action CTA */}
            {isFreelancer && gig.status === 'open' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                <button className="btn-primary" onClick={() => setActiveTab('apply')}>
                  <Sparkles size={16} /> ⚡ Send Request / Submit Proposal
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Proposals */}
        {activeTab === 'proposals' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Active Proposals ({gigBids.length})</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Guaranteed by Escrow Protection
              </span>
            </div>

            {gigBids.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No proposals submitted yet.</p>
                {isFreelancer && (
                  <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => setActiveTab('apply')}>
                    ⚡ Submit First Proposal
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {gigBids.map((b) => {
                  const repeatCollab = getCollaborationBetween(gig.clientId, b.freelancerId, gig.categoryName);
                  return (
                    <div
                      key={b.id}
                      style={{
                        padding: '18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: repeatCollab ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border-subtle)',
                        boxShadow: repeatCollab ? '0 0 20px rgba(16, 185, 129, 0.12)' : undefined,
                      }}
                    >
                      {repeatCollab && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(99, 102, 241, 0.2))',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            marginBottom: '10px',
                            fontSize: '0.75rem',
                            color: 'var(--accent-emerald)',
                            fontWeight: 700,
                          }}
                        >
                          <Sparkles size={12} />
                          <span>🌟 Repeat Partner • Completed {repeatCollab.completedContractsCount} previous contract(s) in {repeatCollab.domain}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={b.freelancerAvatar} alt={b.freelancerName} className="client-avatar-sm" />
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {b.freelancerName}
                            {b.isVerified && <CheckCircle2 size={14} color="var(--accent-emerald)" />}
                            {b.freelancerBadge && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--radius-full)',
                                  background: 'rgba(99, 102, 241, 0.2)',
                                  color: '#c7d2fe',
                                }}
                              >
                                {b.freelancerBadge}
                              </span>
                            )}
                          </strong>
                          {(() => {
                            const stats = getFreelancerRating(b.freelancerId);
                            const ratingVal = stats.hasClientReviews ? stats.averageRating : (b.freelancerRating ?? 5.0);
                            const countVal = stats.hasClientReviews ? stats.reviewsCount : (b.freelancerCompletedOrders ?? 0);
                            return (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {b.freelancerTitle} • <strong style={{ color: 'var(--accent-amber)' }}>★ {ratingVal}</strong> ({countVal} {countVal === 1 ? 'review' : 'reviews'})
                              </span>
                            );
                          })()}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--accent-emerald)', display: 'block' }}>
                          ${b.proposedPrice.toLocaleString()}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          in {b.deliveryDays} days
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      "{b.coverMessage}"
                    </p>

                    {b.milestones && b.milestones.length > 0 && (
                      <div style={{ margin: '12px 0', padding: '10px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.02)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                          Proposed Milestone Breakdown:
                        </span>
                        {b.milestones.map((m, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', padding: '2px 0' }}>
                            <span>{idx + 1}. {m.title}</span>
                            <strong style={{ color: 'var(--accent-emerald)' }}>${m.amount.toLocaleString()}</strong>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Submitted {new Date(b.createdAt).toLocaleDateString()} • STATUS: <strong style={{ color: b.status === 'accepted' ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>{b.status.toUpperCase()}</strong>
                      </span>

                      {/* Client Hire Action */}
                      {(isClientOwner || currentUser?.role === 'client') && b.status === 'pending' && (
                        <button
                          className="btn-success"
                          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                          onClick={() => handleHireFromModal(b.id)}
                        >
                          <ShieldCheck size={14} /> Hire & Fund Escrow
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        )}

        {/* Tab 3: Submit Proposal Studio (Freelancer Only) */}
        {isFreelancer && activeTab === 'apply' && !isVerifiedFreelancer && (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--accent-amber)',
              }}
            >
              <Lock size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Administrator Verification Required
            </h3>
            <p style={{ maxWidth: '460px', margin: '0 auto 24px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              To safeguard client escrow funds and maintain premier quality, your freelancer profile must be reviewed and approved by the Platform Administrator before bidding on projects.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setSelectedGigId(null);
                setActiveView('verification');
              }}
              style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Sparkles size={16} /> Open Trust & Verification Center
            </button>
          </div>
        )}

        {/* Tab 3: Submit Proposal Studio (Verified Freelancers Only) */}
        {isFreelancer && activeTab === 'apply' && isVerifiedFreelancer && (
          <form onSubmit={handleApply}>
            {/* AI Assistant Banner */}
            <div className="ai-assistant-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'var(--accent-gradient)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'white',
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>AI Proposal Copilot</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Draft a high-conversion pitch analyzing the client brief and your profile.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.85rem', padding: '8px 14px' }}
                onClick={generateAiProposal}
                disabled={isGeneratingAi}
              >
                {isGeneratingAi ? 'Drafting...' : '⚡ Generate AI Pitch'}
              </button>
            </div>

            {/* Price & Delivery Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  YOUR TOTAL BID AMOUNT ($ USD)
                </label>
                <input
                  type="number"
                  min={100}
                  step={50}
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(Number(e.target.value))}
                  style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  DELIVERY TIMELINE (DAYS)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={deliveryDays}
                  onChange={(e) => setDeliveryDays(Number(e.target.value))}
                  style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
                  required
                />
              </div>
            </div>

            {/* Platform Fee Breakdown */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>5% Escrow Protection Fee:</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                  -${platformFee.toFixed(2)}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>You will receive:</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--accent-emerald)', marginLeft: '8px' }}>
                  ${netEarnings.toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Cover Message */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                PROPOSAL NOTE & IMPLEMENTATION STRATEGY
              </label>
              <textarea
                rows={7}
                value={coverMessage}
                onChange={(e) => setCoverMessage(e.target.value)}
                placeholder="Explain why you are the best fit for this project, your technical approach, and milestones delivery..."
                style={{ width: '100%', resize: 'vertical' }}
                required
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn-secondary" onClick={() => setActiveTab('overview')} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span>Submitting Proposal...</span>
                ) : (
                  <>
                    <Send size={16} /> Send Proposal Request to Client
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
