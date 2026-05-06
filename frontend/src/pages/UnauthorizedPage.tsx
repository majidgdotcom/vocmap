import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Shown when an authenticated user tries to access a route
 * they don't have permission for (e.g. a non-admin visiting /word-families).
 */
export const UnauthorizedPage: React.FC = () => {
  const { signOut, isSigningOut, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#f9fafb',
    }}>
      <div style={{
        textAlign: 'center', maxWidth: 400, padding: '40px 32px',
        background: '#fff', borderRadius: 16,
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px', fontFamily: 'monospace' }}>
          Access Restricted
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px', lineHeight: 1.6 }}>
          This area is for admin users only.
          {user?.signInDetails?.loginId && (
            <><br /><span style={{ fontSize: 12, color: '#9ca3af' }}>Signed in as {user.signInDetails.loginId}</span></>
          )}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '9px 0', borderRadius: 8, border: '1.5px solid #e5e7eb',
              background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer', fontWeight: 500,
            }}
          >
            ← Go back
          </button>
          <button
            onClick={() => signOut()}
            disabled={isSigningOut}
            style={{
              padding: '9px 0', borderRadius: 8, border: 'none',
              background: '#f3f4f6', color: '#6b7280', fontSize: 13,
              cursor: isSigningOut ? 'not-allowed' : 'pointer',
            }}
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
};
