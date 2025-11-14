import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Save, Send, AlertCircle, CheckCircle } from 'lucide-react';

export default function SubmitReport() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    authors: [{ name: '', email: '' }],
    academicSupervisor: '',
    industrialSupervisor: '',
    academicYear: '',
    specialty: '',
    department: '',
    keywords: ['', '', '', '', ''],
    abstract: '',
    defenseDate: '',
    company: '',
    videoUrl: '',
  });

  const specialties = ['Informatique', 'Télécommunications', 'Électromécanique', 'Génie Civil', 'Génie Industriel'];
  const departments = ['Département Informatique', 'Département Électrique', 'Département Mécanique', 'Département Civil'];

  useEffect(() => {
    loadDraft();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      saveDraft(true);
    }, 120000);

    return () => clearInterval(interval);
  }, [formData]);

  const loadDraft = async () => {
    if (!user) return;
    const { data } = await supabase.from('drafts').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      setDraftId(data.id);
      setFormData(data.draft_data as typeof formData);
    }
  };

  const saveDraft = async (auto = false) => {
    if (!user) return;
    setSaving(true);

    try {
      if (draftId) {
        await supabase.from('drafts').update({ draft_data: formData, last_saved: new Date().toISOString() }).eq('id', draftId);
      } else {
        const { data } = await supabase.from('drafts').insert({ user_id: user.id, draft_data: formData }).select().single();
        if (data) setDraftId(data.id);
      }

      if (!auto) {
        setMessage({ type: 'success', text: 'Brouillon sauvegardé' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const filteredKeywords = formData.keywords.filter(k => k.trim() !== '');
    if (filteredKeywords.length < 5) {
      setMessage({ type: 'error', text: 'Minimum 5 mots-clés requis' });
      return;
    }

    if (formData.abstract.length < 200 || formData.abstract.length > 500) {
      setMessage({ type: 'error', text: 'Le résumé doit contenir entre 200 et 500 caractères' });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('reports').insert({
        title: formData.title,
        authors: formData.authors.filter(a => a.name && a.email),
        academic_supervisor: formData.academicSupervisor,
        industrial_supervisor: formData.industrialSupervisor || null,
        academic_year: formData.academicYear,
        specialty: formData.specialty,
        department: formData.department,
        keywords: filteredKeywords,
        abstract: formData.abstract,
        defense_date: formData.defenseDate || null,
        company: formData.company || null,
        video_url: formData.videoUrl || null,
        submitted_by: user.id,
        status: 'pending',
      });

      if (error) throw error;

      if (draftId) {
        await supabase.from('drafts').delete().eq('id', draftId);
      }

      setMessage({ type: 'success', text: 'Rapport soumis avec succès ! Il sera validé par un enseignant.' });

      setFormData({
        title: '',
        authors: [{ name: '', email: '' }],
        academicSupervisor: '',
        industrialSupervisor: '',
        academicYear: '',
        specialty: '',
        department: '',
        keywords: ['', '', '', '', ''],
        abstract: '',
        defenseDate: '',
        company: '',
        videoUrl: '',
      });
      setDraftId(null);
    } catch (error) {
      console.error('Error submitting report:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la soumission' });
    } finally {
      setSubmitting(false);
    }
  };

  const addAuthor = () => {
    if (formData.authors.length < 3) {
      setFormData({
        ...formData,
        authors: [...formData.authors, { name: '', email: '' }],
      });
    }
  };

  const removeAuthor = (index: number) => {
    if (formData.authors.length > 1) {
      setFormData({
        ...formData,
        authors: formData.authors.filter((_, i) => i !== index),
      });
    }
  };

  const addKeyword = () => {
    if (formData.keywords.length < 10) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, ''],
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Soumettre un rapport PFE</h2>
          <p className="text-gray-600 mt-1">Complétez tous les champs requis pour soumettre votre rapport</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre du PFE <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auteur(s) <span className="text-red-500">*</span> (1-3)
            </label>
            {formData.authors.map((author, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={author.name}
                  onChange={(e) => {
                    const newAuthors = [...formData.authors];
                    newAuthors[index].name = e.target.value;
                    setFormData({ ...formData, authors: newAuthors });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="email"
                  placeholder="email@esprim.tn"
                  value={author.email}
                  onChange={(e) => {
                    const newAuthors = [...formData.authors];
                    newAuthors[index].email = e.target.value;
                    setFormData({ ...formData, authors: newAuthors });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {formData.authors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAuthor(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Retirer
                  </button>
                )}
              </div>
            ))}
            {formData.authors.length < 3 && (
              <button
                type="button"
                onClick={addAuthor}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Ajouter un auteur
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Encadrant académique <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.academicSupervisor}
                onChange={(e) => setFormData({ ...formData, academicSupervisor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Encadrant industriel
              </label>
              <input
                type="text"
                value={formData.industrialSupervisor}
                onChange={(e) => setFormData({ ...formData, industrialSupervisor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année académique <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="2023-2024"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spécialité <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Département <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mots-clés <span className="text-red-500">*</span> (minimum 5)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {formData.keywords.map((keyword, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Mot-clé ${index + 1}`}
                  value={keyword}
                  onChange={(e) => {
                    const newKeywords = [...formData.keywords];
                    newKeywords[index] = e.target.value;
                    setFormData({ ...formData, keywords: newKeywords });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Résumé <span className="text-red-500">*</span> (200-500 caractères)
            </label>
            <textarea
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={200}
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.abstract.length} / 500 caractères
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => saveDraft(false)}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Sauvegarde...' : 'Sauvegarder brouillon'}</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Soumission...' : 'Soumettre le rapport'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
