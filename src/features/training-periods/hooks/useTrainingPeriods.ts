import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveTrainingPeriod,
  changeTrainingPeriodStatus,
  createTrainingPeriod,
  listTrainingPeriods,
  updateTrainingPeriod,
  type TrainingPeriodInput,
  type TrainingPeriodStatus,
} from '../api/trainingPeriodApi'

const queryKey = ['admin', 'training-periods'] as const

export function useTrainingPeriods() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey })

  return {
    ...useQuery({ queryKey, queryFn: listTrainingPeriods }),
    create: useMutation({ mutationFn: createTrainingPeriod, onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: TrainingPeriodInput }) => updateTrainingPeriod(id, input),
      onSuccess: refresh,
    }),
    changeStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: TrainingPeriodStatus }) =>
        changeTrainingPeriodStatus(id, status),
      onSuccess: refresh,
    }),
    archive: useMutation({ mutationFn: archiveTrainingPeriod, onSuccess: refresh }),
  }
}