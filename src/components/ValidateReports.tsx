import { useState, useEffect } from 'react';
import { supabase, Report } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, Search } from 'lucide-react';

export default function ValidateReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending'>('pending');

  const [validationData, setValidationData] = useState({
    checklist: {
      graphicCharter: false,
      sections: false,
      quality: false,
      contentRelevance: false,
      appropriate: false,
    },
    comments: '',
  });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, filterStatus]);

  const loadReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error loading reports:', error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(term) ||
        r.authors.some(a => a.name.toLowerCase().includes(term))
      );
    }

    setFilteredReports(filtered);
  };

  const handleValidate = async () => {
    if (!selectedReport || !user) return;

    const allChecked = Object.values(validationData.checklist).every(v => v);
    if (!allChecked) {
      alert('Veuillez cocher tous les critères de validation');
      return;
    }

    await supabase
      .from('reports')
      .update({
        status: 'validated',
        validated_by: user.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', selectedReport.id);

    await supabase
      .from('validation_history')
      .insert({
        report_id: selectedReport.id,
        validator_id: user.id,
        action: 'validated',
        comments: validationData.comments,
        checklist: validationData.checklist,
      });

    setSelectedReport(null);
    resetValidationData();
    loadReports();
  };

  const handleReject = async () => {
    if (!selectedReport || !user || !validationData.comments) {
      alert('Veuillez fournir un commentaire expliquant le rejet');
      return;
    }

    await supabase
      .from('reports')
      .update({
        status: 'rejected',
        rejection_reason: validationData.comments,
        validated_by: user.id,
      })
      .eq('id', selectedReport.id);

    await supabase
      .from('validation_history')
      .insert({
        report_id: selectedReport.id,
        validator_id: user.id,
        action: 'rejected',
        comments: validationData.comments,
      });

    setSelectedReport(null);
    resetValidationData();
    loadReports();
  };

  const resetValidationData = () => {
    setValidationData({
      checklist: {
        graphicCharter: false,
        sections: false,
        quality: false,
        contentRelevance: false,
        appropriate: false,
      },
      comments: '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'validated':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Validé</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            <span>Rejeté</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>En attente</span>
          </span>
        );
    }
  };

  if (selectedReport) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <button
            onClick={() => {
              setSelectedReport(null);
              resetValidationData();
            }}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Retour à la liste
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{selectedReport.title}</h2>

          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Auteur(s)</p>
                <p className="font-medium">{selectedReport.authors.map(a => a.name).join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Spécialité</p>
                <p className="font-medium">{selectedReport.specialty}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Résumé</p>
              <p className="text-gray-800">{selectedReport.abstract}</p>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Checklist de validation</h3>
              <div className="space-y-3">
                {[
                  { key: 'graphicCharter', label: 'Respect de la charte graphique ESPRIM' },
                  { key: 'sections', label: 'Présence de toutes les sections obligatoires' },
                  { key: 'quality', label: 'Qualité rédactionnelle acceptable' },
                  { key: 'contentRelevance', label: 'Conformité du contenu avec le sujet' },
                  { key: 'appropriate', label: 'Absence de contenu inapproprié' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={validationData.checklist[key as keyof typeof validationData.checklist]}
                      onChange={(e) =>
                        setValidationData({
                          ...validationData,
                          checklist: {
                            ...validationData.checklist,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaires
              </label>
              <textarea
                value={validationData.comments}
                onChange={(e) =>
                  setValidationData({ ...validationData, comments: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={handleReject}
                className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Rejeter
              </button>
              <button
                onClick={handleValidate}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Valider et publier
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Validation des rapports</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par titre ou auteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pending">En attente</option>
            <option value="all">Tous</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-600">Aucun rapport trouvé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-600">
                    Par {report.authors.map(a => a.name).join(', ')}
                  </p>
                </div>
                {getStatusBadge(report.status)}
              </div>

              <p className="text-sm text-gray-600">
                {report.specialty} • {report.academic_year}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
