import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listOwnAvailabilitySlots,
  upsertOwnAvailability,
  type AvailabilityStatus,
} from '../api/availabilityApi'

const queryKey = ['player', 'availabilities'] as const

export function useAvailabilities() {
  const queryClient = useQueryClient()

  return {
    ...useQuery({ queryKey, queryFn: listOwnAvailabilitySlots }),
    save: useMutation({
      mutationFn: ({ trainingSlotId, status }: { trainingSlotId: string; status: AvailabilityStatus }) =>
        upsertOwnAvailability(trainingSlotId, status),
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    }),
  }
}