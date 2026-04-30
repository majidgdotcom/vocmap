import { useCurrentUser, useSignIn, useSignOut } from '@/services/auth.service';

export function useAuth() {
  const { data: user, isLoading, error } = useCurrentUser();
  const signIn = useSignIn();
  const signOut = useSignOut();

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    signIn: signIn.mutateAsync,
    signOut: signOut.mutateAsync,
    isSigningIn: signIn.isPending,
    isSigningOut: signOut.isPending,
  };
}
