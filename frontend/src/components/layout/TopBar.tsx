import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const TopBar: React.FC = () => {
  const { user, signOut, isSigningOut, isAdmin } = useAuth();

  return (
    <header style={barStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#6366f1', letterSpacing: '-0.5px' }}>
          📚 VocMap
        </span>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isAdmin ? (
            // Admin navigation
            <>
              <NavLink to="/word-families" style={navStyle}>📝 Word Families</NavLink>
              <NavLink to="/vocabulary"    style={navStyle}>🔤 Vocabulary</NavLink>
            </>
          ) : (
            // User navigation (future)
            <NavLink to="/dashboard" style={navStyle}>🏠 Dashboard</NavLink>
          )}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Role badge */}
        {isAdmin && (
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', fontWeight: 600 }}>
            admin
          </span>
        )}
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

function navStyle({ isActive }: { isActive: boolean }): React.CSSProperties {
  return {
    padding: '4px 12px', borderRadius: 6, fontSize: 13,
    textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
    background: isActive ? '#eef2ff' : 'transparent',
    color:      isActive ? '#6366f1' : '#6b7280',
    fontWeight: isActive ? 600 : 400,
  };
}

const barStyle: React.CSSProperties = {
  height: 52, display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', padding: '0 20px',
  borderBottom: '1px solid #e5e7eb', background: '#fff',
  flexShrink: 0, zIndex: 10,
};
const signOutBtnStyle: React.CSSProperties = {
  padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: 6,
  background: '#fff', cursor: 'pointer', fontSize: 12, color: '#374151',
};
