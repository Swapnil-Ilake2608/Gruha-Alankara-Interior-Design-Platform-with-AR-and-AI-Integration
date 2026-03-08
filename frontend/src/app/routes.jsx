import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import AnalyzeRoom from './pages/AnalyzeRoom.jsx'
import DesignStudio from './pages/DesignStudio.jsx'
import MyCatalog from './pages/MyCatalog.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import DesignStyle from './pages/DesignStyle.jsx'

const hasAuthToken = () => Boolean(localStorage.getItem('token'))

const RequireAuth = ({ children }) => {
  if (!hasAuthToken()) return <Navigate to="/login" replace />
  return children
}

const LoginGate = () => {
  if (hasAuthToken()) return <Navigate to="/" replace />
  return <Login />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginGate />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <Layout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'analyze', element: <AnalyzeRoom /> },
      { path: 'studio', element: <DesignStudio /> },
      { path: 'design-style', element: <DesignStyle /> },
      { path: 'catalog', element: <MyCatalog /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
])
