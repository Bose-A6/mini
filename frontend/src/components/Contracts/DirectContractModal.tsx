import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  ShieldCheck,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import type { CollaborationHistory, Persona } from '../../types';

export const DirectContractModal: React.FC = () => {
  const {
    isDirectContractModalOpen,
    setIsDirectContractModalOpen,
    directContractFreelancer,
    categories,
    createDirectContract,
    setSelectedContractId,
    setActiveView,
    addToast,
    triggerCelebration,
  } = useApp();

  const [title, setTitle] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [projectBrief, setProjectBrief] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Milestones
  const [milestones, setMilestones] = useState<{ title: string; amount: number; deadline: string }[]>([
    { title: 'Phase 1: Architecture, Wireframes & Core Specs', amount: 1500, deadline: '2026-10-10' },
    { title: 'Phase 2: Core Engineering Implementation & API', amount: 2000, deadline: '2026-10-20' },
    { title: 'Phase 3: Production Polish, QA & Handover', amount: 1000, deadline: '2026-10-30' },
  ]);

  useEffect(() => {
    if (directContractFreelancer) {
      const defaultDomain = (directContractFreelancer as CollaborationHistory).domain || 'Full-Stack Architecture';
      const partnerDisplayName = (directContractFreelancer as CollaborationHistory).partnerName || (directContractFreelancer as Persona).fullName || 'partner';
      setCategoryName(defaultDomain);
      setTitle(`Direct Extension: ${defaultDomain} Production Phase`);
      setProjectBrief(`Direct engagement with trusted partner ${partnerDisplayName} following previous successful delivery.`);
      setDeadline('2026-10-30');
    }
  }, [directContractFreelancer]);

  if (!isDirectContractModalOpen || !directContractFreelancer) return null;

  const isRepeatPartner = Boolean((directContractFreelancer as CollaborationHistory).completedContractsCount && (directContractFreelancer as CollaborationHistory).completedContractsCount > 0);
  const partnerName = (directContractFreelancer as CollaborationHistory).partnerName || (directContractFreelancer as Persona).fullName || 'Specialist Freelancer';
  const partnerAvatar = (directContractFreelancer as CollaborationHistory).partnerAvatar || (directContractFreelancer as Persona).avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const partnerId = (directContractFreelancer as CollaborationHistory).partnerId || (directContractFreelancer as Persona).id;
  const partnerTitle = (directContractFreelancer as Persona).professionalTitle || (directContractFreelancer as CollaborationHistory).partnerTitle || 'Verified Specialist';
  const pastCount = (directContractFreelancer as CollaborationHistory).completedContractsCount || 0;
  const pastDomain = (directContractFreelancer as CollaborationHistory).domain || 'Core Engineering';
  const pastAmount = (directContractFreelancer as CollaborationHistory).totalAmount || 0;

  const totalAmount = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const handleAddMilestone = () => {
    if (milestones.length >= 5) {
      addToast('info', 'Milestone Limit', 'Maximum 5 milestones per direct contract.');
      return;
    }
    setMilestones([
      ...milestones,
      {
        title: `Milestone ${milestones.length + 1}: Final Review & Delivery`,
        amount: 800,
        deadline: new Date(Date.now() + (milestones.length + 1) * 7 * 86400000).toISOString().split('T')[0],
      },
    ]);
  };

  const handleRemoveMilestone = (idx: number) => {
    if (milestones.length <= 1) {
      addToast('warning', 'Minimum Milestones', 'Contracts must have at least 1 milestone.');
      return;
    }
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleUpdateMilestone = (idx: number, field: 'title' | 'amount' | 'deadline', val: any) => {
    const updated = [...milestones];
    updated[idx] = { ...updated[idx], [field]: val };
    setMilestones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryName.trim() || totalAmount <= 0) {
      addToast('warning', 'Missing Fields', 'Please ensure title, domain, and valid milestone budgets are set.');
      return;
    }

    setIsSubmitting(true);
    try {
      const contract = await createDirectContract({
        freelancerId: partnerId,
        freelancerName: partnerName,
        freelancerAvatar: partnerAvatar,
        title: title.trim(),
        categoryName: categoryName.trim(),
        amount: totalAmount,
        deadline: deadline || new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
        milestones: milestones.map((m) => ({ title: m.title.trim(), amount: Number(m.amount) || 500 })),
        note: projectBrief.trim(),
      });

      if (contract) {
        setIsDirectContractModalOpen(false);
        setSelectedContractId(contract.id);
        setActiveView('contracts');
        triggerCelebration();
        addToast(
          'success',
          'Contract Offer Sent ⚡',
          `Escrow of $${totalAmount.toLocaleString()} vaulted! Waiting for ${partnerName} to review & accept terms.`
        );
      }
    } catch (err: any) {
      addToast('error', 'Failed to Create', err?.message || 'Could not initiate direct contract.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsDirectContractModalOpen(false)} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(145deg, #111827, #0d121f)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(16, 185, 129, 0.15)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: isRepeatPartner ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: isRepeatPartner ? 'var(--accent-emerald)' : '#a5b4fc',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={13} /> {isRepeatPartner ? '1-CLICK RE-HIRE & DIRECT ESCROW' : 'DIRECT WORK ASSIGNMENT'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Mutual Consent & Escrow Protection
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>
              {isRepeatPartner ? 'Direct Re-Hire Contract' : 'Assign Work to Specialist'}
            </h3>
          </div>
          <button
            onClick={() => setIsDirectContractModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Connection Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: isRepeatPartner
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(99, 102, 241, 0.1))'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.1))',
            border: isRepeatPartner ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
            marginBottom: '20px',
          }}
        >
          <img
            src={partnerAvatar}
            alt={partnerName}
            style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${isRepeatPartner ? 'var(--accent-emerald)' : 'var(--accent-indigo)'}` }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{partnerName}</strong>
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  background: isRepeatPartner ? 'rgba(16, 185, 129, 0.25)' : 'rgba(99, 102, 241, 0.25)',
                  color: isRepeatPartner ? 'var(--accent-emerald)' : '#c7d2fe',
                  fontWeight: 700,
                }}
              >
                {isRepeatPartner ? '🌟 Verified Repeat Partner' : partnerTitle}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isRepeatPartner ? (
                <>
                  You have completed <strong>{pastCount} contract(s)</strong> together in <strong>{pastDomain}</strong> (${pastAmount.toLocaleString()} settled).
                </>
              ) : (
                <>
                  Direct work assignment. Freelancer will review and accept your milestone terms before work starts.
                </>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Project Title & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                DIRECT CONTRACT TITLE *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Next.js Architecture Phase 2"
                style={{ width: '100%' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                DOMAIN / CATEGORY *
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                style={{ width: '100%' }}
              >
                {(categories || []).map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Brief */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              COLLABORATION BRIEF & DELIVERABLE OBJECTIVES
            </label>
            <textarea
              rows={2}
              value={projectBrief}
              onChange={(e) => setProjectBrief(e.target.value)}
              placeholder="Outline specific objectives, repositories, or milestones for this direct hire..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          {/* Milestones Builder */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} color="var(--accent-cyan)" /> Itemized Milestone Schedule ({milestones.length})
              </label>
              <button
                type="button"
                onClick={handleAddMilestone}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={13} /> Add Milestone
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr 120px 120px 32px',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={m.title}
                    onChange={(e) => handleUpdateMilestone(idx, 'title', e.target.value)}
                    placeholder="Milestone Deliverable Title"
                    style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                    required
                  />
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 8, top: 7, fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>$</span>
                    <input
                      type="number"
                      min={100}
                      step={50}
                      value={m.amount}
                      onChange={(e) => handleUpdateMilestone(idx, 'amount', Number(e.target.value))}
                      style={{ paddingLeft: '20px', fontSize: '0.82rem', paddingRight: '6px' }}
                      required
                    />
                  </div>
                  <input
                    type="date"
                    value={m.deadline}
                    onChange={(e) => handleUpdateMilestone(idx, 'deadline', e.target.value)}
                    style={{ fontSize: '0.78rem', padding: '6px 4px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-rose)',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                    title="Remove Milestone"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Escrow Lock Summary Box */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                TOTAL ESCROW VALUATION
              </span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--accent-emerald)' }}>
                ${totalAmount.toLocaleString()} USD
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#a7f3d0' }}>
              <ShieldCheck size={18} color="var(--accent-emerald)" />
              <span>100% Escrow Vaulted on Platform</span>
            </div>
          </div>

          {/* Mutual Consent Notice */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px dashed rgba(99, 102, 241, 0.3)',
              marginBottom: '20px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            🔒 <strong style={{ color: '#c7d2fe' }}>Two-Way Mutual Agreement:</strong> Freelancer must review and accept your milestone schedule before work officially begins. Your escrow funds are held safely by the platform and can be withdrawn if unaccepted.
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsDirectContractModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={16} />
              {isSubmitting ? 'Sending Contract Offer...' : `Vault Escrow & Send Offer (${totalAmount ? `$${totalAmount.toLocaleString()}` : ''})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
