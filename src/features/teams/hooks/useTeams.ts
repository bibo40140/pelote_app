import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { archiveTeam, createTeam, listEligiblePlayers, listTeamMembers, listTeams, type CreateTeamInput } from '../api/teamApi'

const teamsQueryKey = ['admin', 'teams'] as const
const eligiblePlayersQueryKey = ['admin', 'eligible-players'] as const

export function useTeams() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: teamsQueryKey, queryFn: listTeams })
  const refresh = () => queryClient.invalidateQueries({ queryKey: teamsQueryKey })

  return {
    ...query,
    create: useMutation({
      mutationFn: createTeam,
      onSuccess: () => {
        refresh()
        void queryClient.invalidateQueries({ queryKey: eligiblePlayersQueryKey })
      },
    }),
    archive: useMutation({ mutationFn: archiveTeam, onSuccess: refresh }),
  }
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ['admin', 'teams', teamId, 'members'],
    queryFn: () => listTeamMembers(teamId!),
    enabled: Boolean(teamId),
  })
}

export function useEligiblePlayers(seasonId: string, disciplineId: string, seriesId: string) {
  return useQuery({
    queryKey: [...eligiblePlayersQueryKey, seasonId, disciplineId, seriesId],
    queryFn: () => listEligiblePlayers(seasonId, disciplineId, seriesId),
    enabled: Boolean(seasonId && disciplineId && seriesId),
  })
}

export type { CreateTeamInput }