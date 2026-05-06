import { useCurrentUser, useSignIn, useSignOut, useUserGroups } from '@/services/auth.service';

export function useAuth() {
  const { data: user, isLoading: userLoading, error } = useCurrentUser();
  const { data: groups = [], isLoading: groupsLoading }  = useUserGroups();
  const signIn  = useSignIn();
  const signOut = useSignOut();

  return {
    user,
    isAuthenticated: !!user,
    isLoading:       userLoading || groupsLoading,
    error,
    groups,
    isAdmin:         groups.includes('admin'),
    isUser:          groups.includes('user'),
    signIn:          signIn.mutateAsync,
    signOut:         signOut.mutateAsync,
    isSigningIn:     signIn.isPending,
    isSigningOut:    signOut.isPending,
  };
}
