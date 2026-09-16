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
          {
            element: <AdminRoute />,
            children: [
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