import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ShieldCheck, Briefcase, UserCheck } from 'lucide-react';
import type { AccountRole } from '../types';

export const PersonaSwitcher: React.FC = () => {
  const { currentUser, setCurrentUser, signup, login, adminLogin, setActiveView, addToast } = useApp();

  const handleRoleQuickSwitch = async (role: AccountRole) => {
    if (role === 'admin') {
      await adminLogin('admin@426');
      setActiveView('admin');
      return;
    }

    const email = `${role}@freelancestack.io`;
    const fullName = role === 'client' ? 'Client Founder' : 'Senior AI Specialist';
    const res = await signup(email, 'Password123!', fullName, role);
    if (!res.success) {
      const loginRes = await login(email, 'Password123!');
      if (!loginRes.success) {
        // Fallback local persona activation
        setCurrentUser({
          id: `user-${role}-demo`,
          email,
          fullName,
          role,
          roles: [role],
          professionalTitle: role === 'freelancer' ? 'Verified Specialist' : 'Account Founder',
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${role}`,
          rating: 5.0,
          reviewsCount: 12,
          completedProjects: 8,
          totalEarned: role === 'freelancer' ? 45000 : 0,
          totalSpent: role === 'client' ? 32000 : 0,
          isVerified: true,
          bio: '',
          skills: ['Full-Stack', 'AI Architecture', 'Supabase'],
        });
        addToast('info', 'Workspace Switched', `Active workspace: ${role.toUpperCase()}`);
      }
    }
    if (role === 'client') setActiveView('client');
    else if (role === 'freelancer') setActiveView('freelancer');
  };

  return (
    <div className="persona-bar">
      <div className="persona-label">
        <Sparkles size={16} />
        <span>⚡ Quick Role Switch:</span>
      </div>

      <div className="persona-chips">
        {(['client', 'freelancer', 'admin'] as const).map((r) => {
          const isActive = currentUser?.role === r;
          return (
            <button
              key={r}
              className={`persona-chip ${isActive ? 'active' : ''}`}
              onClick={() => handleRoleQuickSwitch(r)}
            >
              {r === 'client' && <Briefcase size={12} />}
              {r === 'freelancer' && <UserCheck size={12} />}
              {r === 'admin' && <ShieldCheck size={12} />}
              <span>{r.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
