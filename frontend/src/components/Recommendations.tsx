import React, { useState, useEffect } from 'react';
import { Plus, X as XIcon, Trash2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { apiService } from '../services/apiService';
import PixelIcon from './PixelIcon';

interface Recommendation {
  id: string;
  title: string;
  description?: string;
  link?: string;
  image_url?: string;
  created_at: string;
  recommender_participant_id: string;
  recommender_name?: string;
}

interface RecommendationsProps {
  participantId: string;
  currentParticipantId?: string; // To check if user can delete their own recommendations
}

const Recommendations: React.FC<RecommendationsProps> = ({ participantId, currentParticipantId }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    image_url: '',
  });

  useEffect(() => {
    // Only fetch if participantId is provided and valid
    if (participantId) {
      fetchRecommendations();
    }
  }, [participantId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      console.log('Fetching recommendations for participant:', participantId);
      const response = await apiService.getRecommendations(participantId);
      console.log('Recommendations response:', response);
      console.log('Recommendations count:', response.recommendations?.length || 0);
      setRecommendations(response.recommendations || []);
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      console.error('Error status:', error?.response?.status);
      console.error('Error message:', error?.response?.data?.error);
      // If error is 403 and message says can't view own recommendations, just show empty
      if (error?.response?.status === 403) {
        setRecommendations([]);
      } else {
        // Don't set empty array on other errors, keep existing state
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setIsSaving(true);
      await apiService.addRecommendation(participantId, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        link: formData.link.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
      });
      setIsFormOpen(false);
      setFormData({ title: '', description: '', link: '', image_url: '' });
      fetchRecommendations();
    } catch (error) {
      console.error('Error adding recommendation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecommendation = async (recommendationId: string) => {
    if (!confirm('Are you sure you want to delete this recommendation?')) return;

    try {
      await apiService.deleteRecommendation(recommendationId);
      fetchRecommendations();
    } catch (error) {
      console.error('Error deleting recommendation:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Add Recommendation Button Component
  const AddRecommendationButton = () => (
    <button
      onClick={() => setIsFormOpen(true)}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border-2 border-blue-800 transition-all w-full justify-center mt-4"
      style={{ boxShadow: '3px 3px 0px 0px rgb(30 64 175)' }}
    >
      <Plus className="h-4 w-4" />
      Add
    </button>
  );

  if (loading) {
    return (
      <>
        <AddRecommendationButton />
        <div className="card border-blue-800 mt-6" style={{ boxShadow: '4px 4px 0px 0px rgb(30 64 175 / 0.2)' }}>
          <div className="flex items-center gap-2 mb-4">
            <PixelIcon name="star" size={20} color="#3b82f6" />
            <h2 className="text-lg font-bold text-gray-900">Recommendations</h2>
          </div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </>
    );
  }

  const canDelete = (rec: Recommendation) => {
    return currentParticipantId && rec.recommender_participant_id === currentParticipantId;
  };

  return (
    <>
      <AddRecommendationButton />
      
      {recommendations.length > 0 && (
        <div className="card border-blue-800 mt-6" style={{ boxShadow: '4px 4px 0px 0px rgb(30 64 175 / 0.2)' }}>
          <div className="flex items-center gap-2 mb-4">
            <PixelIcon name="star" size={20} color="#3b82f6" />
            <h2 className="text-lg font-bold text-gray-900">Recommendations</h2>
          </div>

          <p className="text-xs text-gray-600 mb-4">
            Gift suggestions from Secret Santas. These are not visible to the wishlist owner.
          </p>

          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 border-2 border-blue-300 bg-blue-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-bold text-blue-800 bg-blue-200 border border-blue-400">
                        RECOMMENDATION
                      </span>
                      {rec.recommender_name && (
                        <span className="text-xs text-gray-500">
                          from {rec.recommender_name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{rec.title}</h3>
                    {rec.description && (
                      <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      {rec.link && (
                        <a
                          href={rec.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Link
                        </a>
                      )}
                      {rec.image_url && (
                        <a
                          href={rec.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
                        >
                          <ImageIcon className="h-3 w-3" />
                          Image
                        </a>
                      )}
                    </div>
                    {rec.image_url && (
                      <div className="mt-2">
                        <img
                          src={rec.image_url}
                          alt={rec.title}
                          className="max-w-xs max-h-24 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {canDelete(rec) && (
                    <button
                      onClick={() => handleDeleteRecommendation(rec.id)}
                      className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                      title="Delete recommendation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Add</h2>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setFormData({ title: '', description: '', link: '', image_url: '' });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddRecommendation} className="p-6 space-y-4">
              <div>
                <label htmlFor="rec-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="rec-title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="What would be a good gift?"
                />
              </div>

              <div>
                <label htmlFor="rec-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="rec-description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Additional details..."
                ></textarea>
              </div>

              <div>
                <label htmlFor="rec-link" className="block text-sm font-medium text-gray-700 mb-1">
                  Link (Optional)
                </label>
                <input
                  type="url"
                  id="rec-link"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://example.com/product"
                />
              </div>

              <div>
                <label htmlFor="rec-image" className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  id="rec-image"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormData({ title: '', description: '', link: '', image_url: '' });
                  }}
                  className="btn-secondary"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSaving || !formData.title.trim()}
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Add'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Recommendations;

