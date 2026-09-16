import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../providers/AuthProvider'
import { getOwnProfile, updateOwnProfile, type UpdateProfileInput } from '../api/profileApi'

const profileQueryKey = ['profile'] as const

export function useProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => getOwnProfile(user!.id),
    enabled: Boolean(user),
  })

  const updateProfileMutation = useMutation({
    mutationFn: updateOwnProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileQueryKey }),
  })

  return {
    ...profileQuery,
    updateProfile: (input: UpdateProfileInput) => updateProfileMutation.mutateAsync(input),
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
    isSuccess: updateProfileMutation.isSuccess,
  }
}