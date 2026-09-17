import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelOwnAvailabilityException,
  createOwnUnavailabilityPeriod,
  listOwnAvailabilityExceptions,
  upsertOwnAvailabilityException,
  upsertOwnAvailabilityExceptions,
} from '../api/availabilityExceptionApi'

const queryKey = ['player', 'availability-exceptions'] as const

export function useAvailabilityExceptions() {
  const queryClient = useQueryClient()

  return {
    ...useQuery({ queryKey, queryFn: listOwnAvailabilityExceptions }),
    save: useMutation({
      mutationFn: upsertOwnAvailabilityException,
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    }),
    saveMany: useMutation({
      mutationFn: upsertOwnAvailabilityExceptions,
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    }),
    createPeriod: useMutation({
      mutationFn: createOwnUnavailabilityPeriod,
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    }),
    cancel: useMutation({
      mutationFn: cancelOwnAvailabilityException,
      onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    }),
  }
}