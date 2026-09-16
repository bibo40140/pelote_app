import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveReference,
  createReference,
  listReferences,
  updateReference,
  type ReferenceTable,
} from '../api/referenceApi'

export function useReferences<T>(table: ReferenceTable, columns: string) {
  const queryClient = useQueryClient()
  const queryKey = ['admin', table] as const
  const query = useQuery({ queryKey, queryFn: () => listReferences<T>(table, columns) })
  const refresh = () => queryClient.invalidateQueries({ queryKey })

  const create = useMutation({ mutationFn: (values: Record<string, unknown>) => createReference(table, values), onSuccess: refresh })
  const update = useMutation({ mutationFn: ({ id, values }: { id: string; values: Record<string, unknown> }) => updateReference(table, id, values), onSuccess: refresh })
  const archive = useMutation({ mutationFn: (id: string) => archiveReference(table, id), onSuccess: refresh })

  return { ...query, create, update, archive }
}