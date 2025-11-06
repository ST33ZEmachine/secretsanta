import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Plus, Users, Calendar } from 'lucide-react';
import PixelIcon from '../components/PixelIcon';
import PixelGift from '../components/PixelGift';

interface Group {
  id: string;
  name: string;
  description: string;
  max_participants: number;
  status: string;
  participant_count: number;
  joined_count: number;
  created_at: string;
  is_owner?: number; // 1 if owner, 0 if participant
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyGroups();
      setGroups(response.groups);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <PixelIcon name="snowflake" size={32} color="#dc2626" />
          <div className="text-sm text-gray-600 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Ho Ho Ho, <span className="text-primary-600">{user?.name}</span>!
            </h1>
          </div>
          <p className="mt-2 text-gray-600 flex items-center gap-2">
            <PixelIcon name="star" size={16} color="#ffd700" />
            Manage your Secret Santa groups and spread the holiday cheer!
            <PixelIcon name="star" size={16} color="#ffd700" />
          </p>
        </div>
        {groups.length > 0 && (
          <Link
            to="/create-group"
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-primary-800 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
            style={{ 
              boxShadow: '3px 3px 0px 0px rgb(127 29 29)',
              transform: 'translate(0, 0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgb(127 29 29)';
              e.currentTarget.style.transform = 'translate(1px, 1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '3px 3px 0px 0px rgb(127 29 29)';
              e.currentTarget.style.transform = 'translate(0, 0)';
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Create Group</span>
          </Link>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="card border-red-800" style={{ boxShadow: '4px 4px 0px 0px rgb(127 29 29)' }}>
          <div className="flex items-center gap-2">
            <PixelIcon name="heart" size={20} color="#dc2626" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="flex justify-center mb-4">
            <PixelGift size={80} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900 flex items-center justify-center gap-2">
            <PixelIcon name="tree" size={20} color="#16a34a" />
            No groups yet
            <PixelIcon name="tree" size={20} color="#16a34a" />
          </h3>
          <p className="mt-2 text-sm text-gray-600 mb-6">
            Get started by creating your first Secret Santa group!
          </p>
          <Link
            to="/create-group"
            className="btn-christmas inline-flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Group</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div 
              key={group.id} 
              className="card hover:scale-[1.02] transition-transform"
              style={{ boxShadow: group.status === 'active' ? '8px 8px 0px 0px rgb(22 101 52 / 0.3)' : '8px 8px 0px 0px rgb(127 29 29 / 0.2)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 flex-1">
                  <PixelGift size={32} />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                    {group.description && (
                      <p className="mt-1 text-sm text-gray-600">{group.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {group.is_owner === 1 && (
                    <div className="inline-flex items-center px-2 py-0.5 border-2 border-primary-600 bg-primary-50 text-primary-800 text-xs font-bold">
                      Owner
                    </div>
                  )}
                  <div className={`inline-flex items-center px-2.5 py-1 border-2 text-xs font-bold ${
                    group.status === 'active' 
                      ? 'bg-green-600 text-white border-green-800' 
                      : 'bg-gray-300 text-gray-900 border-gray-800'
                  }`}>
                    {group.status}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-700 border-t-2 border-gray-300 pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{group.joined_count}/{group.max_participants}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(group.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  to={`/group/${group.id}`}
                  className="w-full btn-secondary text-center"
                >
                  View Group
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
