import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import NavigationScreen from './pages/NavigationScreen';
import AdminLayout from './components/AdminLayout';
import DriversView from './pages/admin/DriversView';
import RoutesView from './pages/admin/RoutesView';
import AssignmentsView from './pages/admin/AssignmentsView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        {/* Admin Routes wrapped in Layout */}
        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/drivers" element={<AdminLayout><DriversView /></AdminLayout>} />
        <Route path="/admin/routes" element={<AdminLayout><RoutesView /></AdminLayout>} />
        <Route path="/admin/assignments" element={<AdminLayout><AssignmentsView /></AdminLayout>} />
        
        {/* Driver Routes */}
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/navigate/:assignmentId" element={<NavigationScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
