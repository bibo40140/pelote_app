import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archivePlayerDiscipline,
  createPlayer,
  createPlayerDiscipline,
  deactivatePlayer,
  getPlayer,
  listPlayerDisciplines,
  listPlayers,
  updatePlayer,
  type PlayerDisciplineInput,
  type PlayerInput,
} from '../api/playerApi'

const playersQueryKey = ['admin', 'players'] as const

export function usePlayers() {
  const queryClient = useQueryClient()
  const players = useQuery({ queryKey: playersQueryKey, queryFn: listPlayers })
  const refreshPlayers = () => queryClient.invalidateQueries({ queryKey: playersQueryKey })

  return {
    ...players,
    create: useMutation({ mutationFn: createPlayer, onSuccess: refreshPlayers }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: PlayerInput }) => updatePlayer(id, input), onSuccess: refreshPlayers }),
    deactivate: useMutation({ mutationFn: deactivatePlayer, onSuccess: refreshPlayers }),
  }
}

export function usePlayerDisciplines(playerId: string | null) {
  const queryClient = useQueryClient()
  const queryKey = ['admin', 'player-disciplines', playerId] as const
  const disciplines = useQuery({ queryKey, queryFn: () => listPlayerDisciplines(playerId!), enabled: Boolean(playerId) })
  const refresh = () => queryClient.invalidateQueries({ queryKey })

  return {
    ...disciplines,
    create: useMutation({ mutationFn: (input: PlayerDisciplineInput) => createPlayerDiscipline(input), onSuccess: refresh }),
    archive: useMutation({ mutationFn: archivePlayerDiscipline, onSuccess: refresh }),
  }
}

export function usePlayer(playerId: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'players', playerId],
    queryFn: () => getPlayer(playerId!),
    enabled: Boolean(playerId),
  })
}