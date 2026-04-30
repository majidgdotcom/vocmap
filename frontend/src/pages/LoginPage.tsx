import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useSignIn, useSignUp, useConfirmSignUp } from '@/services/auth.service';

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const ConfirmSchema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code'),
});

type LoginForm = z.infer<typeof LoginSchema>;
type ConfirmForm = z.infer<typeof ConfirmSchema>;
type Mode = 'signin' | 'signup' | 'confirm';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [pendingEmail, setPendingEmail] = useState('');
  const [authError, setAuthError] = useState('');

  const signIn = useSignIn();
  const signUp = useSignUp();
  const confirmSignUp = useConfirmSignUp();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });
  const confirmForm = useForm<ConfirmForm>({ resolver: zodResolver(ConfirmSchema) });

  const handleSignIn = loginForm.handleSubmit(async ({ email, password }) => {
    setAuthError('');
    try {
      await signIn.mutateAsync({ username: email, password });
      navigate('/');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed');
    }
  });

  const handleSignUp = loginForm.handleSubmit(async ({ email, password }) => {
    setAuthError('');
    try {
      await signUp.mutateAsync({ email, password });
      setPendingEmail(email);
      setMode('confirm');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-up failed');
    }
  });

  const handleConfirm = confirmForm.handleSubmit(async ({ code }) => {
    setAuthError('');
    try {
      await confirmSignUp.mutateAsync({ email: pendingEmail, code });
      setMode('signin');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Confirmation failed');
    }
  });

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>
            VocMap
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#9ca3af' }}>
            {mode === 'confirm' ? 'Check your email for a code' :
             mode === 'signup' ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        {authError && (
          <div style={errorBannerStyle}>{authError}</div>
        )}

        {/* Confirm code form */}
        {mode === 'confirm' ? (
          <form onSubmit={handleConfirm} style={formStyle}>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>
              A verification code was sent to <strong>{pendingEmail}</strong>
            </p>
            <div>
              <label style={labelStyle}>Verification Code</label>
              <input
                {...confirmForm.register('code')}
                placeholder="123456"
                style={{ ...inputStyle, letterSpacing: '0.2em', textAlign: 'center' }}
                maxLength={6}
              />
              {confirmForm.formState.errors.code && (
                <FieldError msg={confirmForm.formState.errors.code.message!} />
              )}
            </div>
            <button
              type="submit"
              disabled={confirmForm.formState.isSubmitting}
              style={primaryBtnStyle}
            >
              {confirmForm.formState.isSubmitting ? 'Verifying…' : 'Verify Email'}
            </button>
            <button type="button" onClick={() => setMode('signup')} style={linkBtnStyle}>
              ← Back to sign up
            </button>
          </form>
        ) : (
          /* Sign in / Sign up shared form */
          <form
            onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}
            style={formStyle}
          >
            <div>
              <label style={labelStyle}>Email</label>
              <input
                {...loginForm.register('email')}
                type="email"
                placeholder="you@example.com"
                style={inputStyle}
                autoComplete="email"
              />
              {loginForm.formState.errors.email && (
                <FieldError msg={loginForm.formState.errors.email.message!} />
              )}
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                {...loginForm.register('password')}
                type="password"
                placeholder="••••••••"
                style={inputStyle}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              {loginForm.formState.errors.password && (
                <FieldError msg={loginForm.formState.errors.password.message!} />
              )}
            </div>

            <button
              type="submit"
              disabled={loginForm.formState.isSubmitting}
              style={primaryBtnStyle}
            >
              {loginForm.formState.isSubmitting
                ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </button>

            <div style={{ textAlign: 'center', marginTop: 4 }}>
              {mode === 'signin' ? (
                <>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>No account? </span>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setAuthError(''); }}
                    style={linkBtnStyle}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setAuthError(''); }}
                    style={linkBtnStyle}
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const FieldError: React.FC<{ msg: string }> = ({ msg }) => (
  <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{msg}</p>
);

const pageStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)', padding: 16,
};
const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16,
  padding: '36px 32px', boxShadow: '0 8px 40px rgba(99,102,241,0.12)',
  border: '1px solid #e5e7eb',
};
const formStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 16,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#374151',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
  outline: 'none', transition: 'border-color 0.15s',
};
const primaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '11px 0', border: 'none', borderRadius: 8,
  background: '#6366f1', color: '#fff', cursor: 'pointer',
  fontSize: 15, fontWeight: 700, marginTop: 4,
};
const linkBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#6366f1', fontSize: 13, fontWeight: 600, padding: 0,
};
const errorBannerStyle: React.CSSProperties = {
  padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5',
  borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 4,
};
