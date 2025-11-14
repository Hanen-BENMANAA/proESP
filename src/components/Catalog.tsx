import { useState, useEffect } from 'react';
import { supabase, Report } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, Heart, Eye, Calendar, FileText, TrendingUp } from 'lucide-react';

export default function Catalog() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    academicYear: '',
    specialty: '',
    sortBy: 'date_desc',
  });

  const specialties = [
    'Informatique',
    'Télécommunications',
    'Électromécanique',
    'Génie Civil',
    'Génie Industriel'
  ];

  useEffect(() => {
    loadReports();
    loadFavorites();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, filters]);

  const loadReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'validated')
      .order('validated_at', { ascending: false });

    if (error) {
      console.error('Error loading reports:', error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const loadFavorites = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('favorites')
      .select('report_id')
      .eq('user_id', user.id);

    if (data) {
      setFavorites(new Set(data.map(f => f.report_id)));
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (filters.academicYear) {
      filtered = filtered.filter(r => r.academic_year === filters.academicYear);
    }

    if (filters.specialty) {
      filtered = filtered.filter(r => r.specialty === filters.specialty);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(term) ||
        r.abstract.toLowerCase().includes(term) ||
        r.keywords.some(k => k.toLowerCase().includes(term))
      );
    }

    switch (filters.sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.views_count - a.views_count);
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        filtered.sort((a, b) => new Date(b.validated_at || b.created_at).getTime() - new Date(a.validated_at || a.created_at).getTime());
    }

    setFilteredReports(filtered);
  };

  const toggleFavorite = async (reportId: string) => {
    if (!user) return;

    if (favorites.has(reportId)) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('report_id', reportId);

      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    } else {
      await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          report_id: reportId,
        });

      setFavorites(prev => new Set(prev).add(reportId));
    }
  };

  const getAcademicYears = () => {
    const years = new Set(reports.map(r => r.academic_year));
    return Array.from(years).sort().reverse();
  };

  const getMostPopular = () => {
    return [...reports].sort((a, b) => b.views_count - a.views_count).slice(0, 10);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Catalogue des rapports PFE</h2>
        <p className="text-gray-600">
          Explorez {reports.length} rapport{reports.length > 1 ? 's' : ''} validé{reports.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtres
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année académique
                </label>
                <select
                  value={filters.academicYear}
                  onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Toutes les années</option>
                  {getAcademicYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spécialité
                </label>
                <select
                  value={filters.specialty}
                  onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Toutes les spécialités</option>
                  {specialties.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="date_desc">Plus récents</option>
                  <option value="popular">Plus consultés</option>
                  <option value="title">Titre (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Plus consultés
              </h4>
              <div className="space-y-2">
                {getMostPopular().slice(0, 5).map((report, index) => (
                  <div key={report.id} className="text-xs text-gray-700">
                    <div className="flex items-start space-x-2">
                      <span className="font-bold text-blue-600">{index + 1}</span>
                      <p className="line-clamp-2">{report.title}</p>
                    </div>
                    <p className="text-gray-500 ml-4">{report.views_count} vues</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher dans les titres, résumés..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Chargement des rapports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun rapport trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {report.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Par {report.authors.map(a => a.name).join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleFavorite(report.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          favorites.has(report.id)
                            ? 'text-red-500 bg-red-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${favorites.has(report.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                      {report.abstract}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {report.keywords.slice(0, 3).map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                      {report.keywords.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{report.keywords.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {report.academic_year}
                      </span>
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {report.views_count} vues
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {report.specialty}
                      </span>
                    </div>

                    <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Consulter le rapport
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
