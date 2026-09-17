import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProtectedRoute } from '../routes/ProtectedRoute'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { AdminRoute } from '../routes/AdminRoute'
import { DisciplinesPage } from '../features/admin/pages/DisciplinesPage'
import { InstallationTypesPage } from '../features/admin/pages/InstallationTypesPage'
import { InstallationsPage } from '../features/admin/pages/InstallationsPage'
import { SeasonsPage } from '../features/admin/pages/SeasonsPage'
import { SeriesPage } from '../features/admin/pages/SeriesPage'
import { PlayersPage } from '../features/players/pages/PlayersPage'
import { PlayerDisciplinesPage } from '../features/players/pages/PlayerDisciplinesPage'
import { TeamsPage } from '../features/teams/pages/TeamsPage'
import { SportOverviewPage } from '../features/sportOverview/pages/SportOverviewPage'
import { TrainingPeriodsPage } from '../features/training-periods/pages/TrainingPeriodsPage'
import { TrainingSlotsPage } from '../features/training-slots/pages/TrainingSlotsPage'
import { AvailabilitiesPage } from '../features/availabilities/pages/AvailabilitiesPage'
import { AvailabilityExceptionsPage } from '../features/availability-exceptions/pages/AvailabilityExceptionsPage'

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'profil', element: <ProfilePage /> },
          { path: 'disponibilites', element: <AvailabilitiesPage /> },
          { path: 'exceptions', element: <AvailabilityExceptionsPage /> },
          {
            element: <AdminRoute />,
            children: [
              { path: 'admin/players', element: <PlayersPage /> },
              { path: 'admin/players/:playerId/disciplines', element: <PlayerDisciplinesPage /> },
              { path: 'admin/teams', element: <TeamsPage /> },
              { path: 'admin/sport-overview', element: <SportOverviewPage /> },
              { path: 'admin/training-periods', element: <TrainingPeriodsPage /> },
              { path: 'admin/training-slots', element: <TrainingSlotsPage /> },
              { path: 'admin/seasons', element: <SeasonsPage /> },
              { path: 'admin/disciplines', element: <DisciplinesPage /> },
              { path: 'admin/series', element: <SeriesPage /> },
              { path: 'admin/installation-types', element: <InstallationTypesPage /> },
              { path: 'admin/installations', element: <InstallationsPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '/connexion', element: <LoginPage /> },
  { path: '*', element: <NotFoundPage /> },
])