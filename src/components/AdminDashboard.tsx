import { useState, useEffect } from 'react';
import { supabase, User, Report } from '../lib/supabase';
import { BarChart3, Users, FileText, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    validatedReports: 0,
    pendingReports: 0,
    rejectedReports: 0,
    totalViews: 0,
  });

  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reports'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const [usersData, reportsData] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('reports').select('*'),
    ]);

    if (usersData.data) setUsers(usersData.data);
    if (reportsData.data) setReports(reportsData.data);

    if (usersData.data && reportsData.data) {
      const totalViews = reportsData.data.reduce((sum, r) => sum + r.views_count, 0);
      setStats({
        totalUsers: usersData.data.length,
        totalReports: reportsData.data.length,
        validatedReports: reportsData.data.filter(r => r.status === 'validated').length,
        pendingReports: reportsData.data.filter(r => r.status === 'pending').length,
        rejectedReports: reportsData.data.filter(r => r.status === 'rejected').length,
        totalViews,
      });
    }

    setLoading(false);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    await supabase.from('users').update({ is_active: !currentStatus }).eq('id', userId);
    loadData();
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) return;
    await supabase.from('reports').delete().eq('id', reportId);
    loadData();
  };

  if (loading) {
    return <div className="text-center py-12"><p className="text-gray-600">Chargement...</p></div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord administrateur</h2>

      <div className="flex space-x-4 mb-6 border-b">
        {[
          { key: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
          { key: 'users', label: 'Utilisateurs', icon: Users },
          { key: 'reports', label: 'Rapports', icon: FileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalUsers}</h3>
            <p className="text-sm text-gray-600 mt-1">Utilisateurs</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalReports}</h3>
            <p className="text-sm text-gray-600 mt-1">Rapports total</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Activity className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.pendingReports}</h3>
            <p className="text-sm text-gray-600 mt-1">En attente de validation</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stats.totalViews}</h3>
            <p className="text-sm text-gray-600 mt-1">Total consultations</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {user.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vues</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {report.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.status === 'validated' ? 'bg-green-100 text-green-700' :
                        report.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.views_count}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
