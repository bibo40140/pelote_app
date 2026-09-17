import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveTrainingSlot,
  createTrainingSlot,
  createTrainingSlotsGrid,
  listTrainingSlots,
  updateTrainingSlot,
  type TrainingSlotInput,
} from '../api/trainingSlotApi'

const queryKey = ['admin', 'training-slots'] as const

export function useTrainingSlots() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey })

  return {
    ...useQuery({ queryKey, queryFn: listTrainingSlots }),
    create: useMutation({ mutationFn: createTrainingSlot, onSuccess: refresh }),
    createGrid: useMutation({ mutationFn: createTrainingSlotsGrid, onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: TrainingSlotInput }) => updateTrainingSlot(id, input),
      onSuccess: refresh,
    }),
    archive: useMutation({ mutationFn: archiveTrainingSlot, onSuccess: refresh }),
  }
}