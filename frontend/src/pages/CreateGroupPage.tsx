import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiService } from '../services/apiService';
import { Users } from 'lucide-react';
import PixelIcon from '../components/PixelIcon';
import PixelGift from '../components/PixelGift';

interface CreateGroupFormData {
  name: string;
  description: string;
  maxParticipants: number;
  giftsPerParticipant: number;
}

const CreateGroupPage: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateGroupFormData>({
    defaultValues: {
      maxParticipants: 10,
      giftsPerParticipant: 1,
    },
  });

  const giftsPerParticipant = watch('giftsPerParticipant', 1);

  const onSubmit = async (data: CreateGroupFormData) => {
    setLoading(true);
    setError('');

    // Ensure giftsPerParticipant is a number
    const giftsPerParticipant = typeof data.giftsPerParticipant === 'string' 
      ? parseInt(data.giftsPerParticipant, 10) 
      : Number(data.giftsPerParticipant);
    
    console.log('Form data:', data);
    console.log('giftsPerParticipant (converted):', giftsPerParticipant);

    try {
      const response = await apiService.createGroup({
        name: data.name,
        description: data.description || undefined,
        maxParticipants: data.maxParticipants,
        giftsPerParticipant: giftsPerParticipant,
      });
      
      console.log('API response:', response);
      console.log('Response group giftsPerParticipant:', response.group.giftsPerParticipant);
      
      navigate(`/group/${response.group.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <PixelGift size={48} />
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Create Secret Santa Group
            <PixelIcon name="star" size={24} color="#ffd700" />
          </h1>
        </div>
        <p className="mt-2 text-gray-600 flex items-center gap-2">
          <PixelIcon name="snowflake" size={12} color="#16a34a" />
          Set up a new Secret Santa group and invite your friends and family!
          <PixelIcon name="snowflake" size={12} color="#dc2626" />
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="card border-red-800" style={{ boxShadow: '4px 4px 0px 0px rgb(127 29 29)' }}>
            <div className="flex items-center gap-2">
              <PixelIcon name="heart" size={20} color="#dc2626" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PixelIcon name="tree" size={24} color="#16a34a" />
            Group Details
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Group Name *
              </label>
              <input
                {...register('name', {
                  required: 'Group name is required',
                  minLength: {
                    value: 2,
                    message: 'Group name must be at least 2 characters',
                  },
                })}
                type="text"
                className="input-field mt-1"
                placeholder="e.g., Family Secret Santa 2024"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description', {
                  maxLength: {
                    value: 500,
                    message: 'Description must be less than 500 characters',
                  },
                })}
                rows={3}
                className="input-field mt-1"
                placeholder="Optional description for your group..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary-600" />
            Group Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
                Maximum Participants
              </label>
              <input
                {...register('maxParticipants', {
                  required: 'Maximum participants is required',
                  min: { value: 3, message: 'Minimum 3 participants required' },
                  max: { value: 50, message: 'Maximum 50 participants allowed' },
                })}
                type="number"
                min="3"
                max="50"
                className="input-field mt-1"
              />
              {errors.maxParticipants && (
                <p className="mt-1 text-sm text-red-600">{errors.maxParticipants.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="giftsPerParticipant" className="block text-sm font-medium text-gray-700">
                Gifts Per Participant
              </label>
              <select
                {...register('giftsPerParticipant', {
                  required: 'Gifts per participant is required',
                })}
                className="input-field mt-1"
              >
                <option value={1}>1 Gift (Default)</option>
                <option value={2}>2 Gifts</option>
                <option value={3}>3 Gifts</option>
              </select>
              {errors.giftsPerParticipant && (
                <p className="mt-1 text-sm text-red-600">{errors.giftsPerParticipant.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Each participant will be Secret Santa for this many people
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 border-2 border-primary-600 bg-primary-50" style={{ boxShadow: '4px 4px 0px 0px rgb(127 29 29)' }}>
            <div className="flex items-start gap-2">
              <PixelIcon name="santa" size={24} color="#dc2626" />
              <div>
                <h3 className="text-sm font-bold text-primary-900 mb-2">How it works</h3>
                <div className="mt-2 text-sm text-primary-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <PixelIcon name="star" size={12} color="#ffd700" />
                    <span>You'll be added as the first participant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PixelIcon name="star" size={12} color="#ffd700" />
                    <span>Share the group link with others to invite them</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PixelIcon name="star" size={12} color="#ffd700" />
                    <span>Once everyone joins, generate Secret Santa assignments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PixelIcon name="star" size={12} color="#ffd700" />
                    <span>Each person will be Secret Santa for exactly {giftsPerParticipant} {giftsPerParticipant === 1 ? 'person' : 'people'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </div>
            ) : (
              'Create Group'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroupPage;
