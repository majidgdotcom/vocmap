import React from 'react';
import { TopBar } from '@/components/layout/TopBar';

/**
 * User Dashboard — placeholder for future implementation.
 *
 * This page is accessible to users in the "user" Cognito group.
 * Feature scope TBD.
 */
export const UserDashboardPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f9fafb' }}>
      <TopBar />
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
      }}>
        <div style={{
          textAlign: 'center', maxWidth: 480, padding: '48px 40px',
          background: '#fff', borderRadius: 16,
          border: '1.5px dashed #e5e7eb',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px', fontFamily: 'monospace' }}>
            User Dashboard
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 8px', lineHeight: 1.7 }}>
            Coming soon — this dashboard is reserved for regular users.
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            Feature scope is being defined. Check back later.
          </p>
        </div>
      </div>
    </div>
  );
};
