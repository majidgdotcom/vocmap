import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  type SignInInput,
} from 'aws-amplify/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const authKeys = {
  user:   ['auth', 'user']   as const,
  groups: ['auth', 'groups'] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn:  () => getCurrentUser(),
    retry:    false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Reads `cognito:groups` from the Amplify IdToken payload.
 * Returns an empty array when the user is not in any group.
 * Caches for the same duration as the user query.
 */
export function useUserGroups() {
  return useQuery<string[]>({
    queryKey: authKeys.groups,
    queryFn: async () => {
      const session = await fetchAuthSession();
      const payload = session.tokens?.idToken?.payload;
      if (!payload) return [];
      const raw = payload['cognito:groups'];
      if (!raw) return [];
      return Array.isArray(raw) ? (raw as string[]) : [String(raw)];
    },
    retry:    false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SignInInput) => signIn(input),
    onSuccess:  () => qc.invalidateQueries({ queryKey: authKeys.user }),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => signOut(),
    onSuccess:  () => qc.clear(),
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signUp({ username: email, password }),
  });
}

export function useConfirmSignUp() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      confirmSignUp({ username: email, confirmationCode: code }),
  });
}

export async function getAccessToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return token;
}
