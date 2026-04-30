import React from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/store';
import { selectActiveKeywordLabel } from '@/store/slices/keyword-filter.slice';

interface TopBarProps {
  onNewTodo: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onNewTodo }) => {
  const { user, signOut, isSigningOut } = useAuth();
  const activeKeywordLabel = useAppSelector(selectActiveKeywordLabel);

  return (
    <header style={barStyle}>
      {/* Left: Brand + active filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#6366f1', letterSpacing: '-0.5px' }}>
          ✓ VocMap
        </span>

        {activeKeywordLabel && (
          <span style={filterBadgeStyle}>
            🏷 {activeKeywordLabel}
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onNewTodo} style={newBtnStyle}>
          + New Todo
        </button>

        <span style={{ fontSize: 13, color: '#6b7280' }}>
          {user?.signInDetails?.loginId ?? user?.username}
        </span>

        <button
          onClick={() => signOut()}
          disabled={isSigningOut}
          style={signOutBtnStyle}
        >
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </header>
  );
};

const barStyle: React.CSSProperties = {
  height: 52, display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', padding: '0 20px',
  borderBottom: '1px solid #e5e7eb', background: '#fff',
  flexShrink: 0, zIndex: 10,
};
const newBtnStyle: React.CSSProperties = {
  padding: '6px 14px', border: 'none', borderRadius: 6,
  background: '#6366f1', color: '#fff', cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
};
const signOutBtnStyle: React.CSSProperties = {
  padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: 6,
  background: '#fff', cursor: 'pointer', fontSize: 12, color: '#374151',
};
const filterBadgeStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, padding: '3px 10px',
  background: '#eef2ff', color: '#6366f1',
  border: '1px solid #c7d2fe', borderRadius: 9999,
};
