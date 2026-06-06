import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import FloorMap from './pages/FloorMap';
import WaiterInterface from './pages/WaiterInterface';
import KitchenInterface from './pages/KitchenInterface';
import ManagementInterface from './pages/ManagementInterface';
import Statistics from './pages/Statistics';
import UserManagement from './pages/UserManagement';
import InventoryPage from './pages/InventoryPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import ClientPortal from './pages/ClientPortal';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './auth';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/client" element={<ClientPortal />} />

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<Layout><FloorMap /></Layout>} />
          </Route>

          <Route element={<ProtectedRoute roles={['waiter']} />}>
            <Route path="/waiter" element={<Layout><WaiterInterface /></Layout>} />
          </Route>

          <Route element={<ProtectedRoute roles={['cook']} />}>
            <Route path="/kitchen" element={<Layout><KitchenInterface /></Layout>} />
          </Route>

          <Route element={<ProtectedRoute roles={['manager']} />}>
            <Route path="/management" element={<Layout><ManagementInterface /></Layout>} />
            <Route path="/management/users" element={<Layout><UserManagement /></Layout>} />
            <Route path="/management/statistics" element={<Layout><Statistics /></Layout>} />
            <Route path="/management/inventory" element={<Layout><InventoryPage /></Layout>} />
            <Route path="/management/settings" element={<Layout><SettingsPage /></Layout>} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
