import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { configureAmplify } from '@/config/amplify';
import { ProtectedRoute }       from '@/components/common/ProtectedRoute';
import { PublicSearchPage }     from '@/pages/PublicSearchPage';
import { LoginPage }            from '@/pages/LoginPage';
import { WordFamilyPage }       from '@/pages/WordFamilyPage';
import { VocabularyPage }       from '@/pages/VocabularyPage';
import { UnauthorizedPage }     from '@/pages/UnauthorizedPage';
import { UserDashboardPage }    from '@/pages/UserDashboardPage';

configureAmplify();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      onError: (err) => console.error('Mutation error:', err),
    },
  },
});

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"             element={<PublicSearchPage />} />
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ── Admin-only ── */}
        <Route
          path="/word-families"
          element={<ProtectedRoute adminOnly><WordFamilyPage /></ProtectedRoute>}
        />
        <Route
          path="/vocabulary"
          element={<ProtectedRoute adminOnly><VocabularyPage /></ProtectedRoute>}
        />

        {/* ── Regular user (future) ── */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);

export default App;
