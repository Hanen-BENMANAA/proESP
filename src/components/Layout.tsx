import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, LogOut, User, Upload, CheckSquare, BarChart3 } from 'lucide-react';

type LayoutProps = {
  children: ReactNode;
  currentPage: 'catalog' | 'submit' | 'validate' | 'admin';
  onNavigate: (page: 'catalog' | 'submit' | 'validate' | 'admin') => void;
};

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Bibliothèque ESPRIM</h1>
                  <p className="text-xs text-gray-500">Rapports PFE</p>
                </div>
              </div>

              <div className="hidden md:flex space-x-4">
                <button
                  onClick={() => onNavigate('catalog')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 'catalog'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Catalogue
                </button>

                {user?.role === 'student' && (
                  <button
                    onClick={() => onNavigate('submit')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      currentPage === 'submit'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Soumettre</span>
                  </button>
                )}

                {(user?.role === 'teacher' || user?.role === 'admin') && (
                  <button
                    onClick={() => onNavigate('validate')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      currentPage === 'validate'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Validation</span>
                  </button>
                )}

                {user?.role === 'admin' && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                      currentPage === 'admin'
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Administration</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'student' ? 'Étudiant' : user?.role === 'teacher' ? 'Enseignant' : 'Admin'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
