import { useQuery } from '@tanstack/react-query'
import { listSportOverviewRegistrations, listSportOverviewTeams, type OverviewFilters } from '../api/sportOverviewApi'

export function useSportOverviewRegistrations(filters: OverviewFilters) {
  return useQuery({
    queryKey: ['admin', 'sport-overview', 'registrations', filters.seasonId, filters.disciplineId, filters.seriesId],
    queryFn: () => listSportOverviewRegistrations(filters),
    enabled: Boolean(filters.seasonId && filters.disciplineId && filters.seriesId),
  })
}

export function useSportOverviewTeams(filters: OverviewFilters) {
  return useQuery({
    queryKey: ['admin', 'sport-overview', 'teams', filters.seasonId, filters.disciplineId, filters.seriesId],
    queryFn: () => listSportOverviewTeams(filters),
    enabled: Boolean(filters.seasonId && filters.disciplineId && filters.seriesId),
  })
}
