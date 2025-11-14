import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Catalog from './components/Catalog';
import SubmitReport from './components/SubmitReport';
import ValidateReports from './components/ValidateReports';
import AdminDashboard from './components/AdminDashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'catalog' | 'submit' | 'validate' | 'admin'>('catalog');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Chargement de la plateforme...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'catalog' && <Catalog />}
      {currentPage === 'submit' && user.role === 'student' && <SubmitReport />}
      {currentPage === 'validate' && (user.role === 'teacher' || user.role === 'admin') && <ValidateReports />}
      {currentPage === 'admin' && user.role === 'admin' && <AdminDashboard />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
