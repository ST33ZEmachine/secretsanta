import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { User } from 'lucide-react';
import PixelIcon from '../components/PixelIcon';
import PixelGift from '../components/PixelGift';

const JoinGroupPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [name, setName] = useState<string>('');
  const autoJoinAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
    }
  }, [token]);

  // Auto-populate name from user if logged in
  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
    }
  }, [user, name]);

  // Auto-join if user is logged in and has a name (only once)
  useEffect(() => {
    if (user && user.name && token && !loading && !success && !error && !autoJoinAttempted.current) {
      autoJoinAttempted.current = true;
      // Small delay to ensure state is set
      const timer = setTimeout(() => {
        handleAutoJoin();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, token, loading, success, error]);

  const handleAutoJoin = async () => {
    if (!user || !token || !user.name) return;

    setLoading(true);
    setError('');

    try {
      await apiService.joinGroup(token, user.id, user.name.trim());
      setSuccess('Successfully joined the group!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      // If already a participant, redirect to dashboard
      if (err.response?.status === 400 && err.response?.data?.error?.includes('already a participant')) {
        setSuccess('You are already a member of this group!');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(err.response?.data?.error || 'Failed to join group');
        setLoading(false);
        autoJoinAttempted.current = false; // Allow retry on error
      }
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token || !name.trim()) return;

    setLoading(true);
    setError('');

    try {
      await apiService.joinGroup(token, user.id, name.trim());
      setSuccess('Successfully joined the group!');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      // If already a participant, redirect to dashboard
      if (err.response?.status === 400 && err.response?.data?.error?.includes('already a participant')) {
        setSuccess('You are already a member of this group!');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(err.response?.data?.error || 'Failed to join group');
        setLoading(false);
      }
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 text-center card">
          <div>
            <PixelGift size={64} className="mx-auto mb-4" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
              <PixelIcon name="heart" size={24} color="#dc2626" />
              Invalid Invitation
              <PixelIcon name="heart" size={24} color="#dc2626" />
            </h2>
            <p className="mt-2 text-gray-600">
              This invitation link is invalid or has expired.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <PixelGift size={64} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
            <PixelIcon name="star" size={24} color="#ffd700" />
            Join Secret Santa Group
            <PixelIcon name="star" size={24} color="#ffd700" />
          </h2>
          <p className="mt-3 text-center text-sm text-gray-600 flex items-center justify-center gap-2">
            <PixelIcon name="snowflake" size={12} color="#16a34a" />
            Complete your registration to join
            <PixelIcon name="snowflake" size={12} color="#dc2626" />
          </p>
        </div>

        {error && (
          <div className="card border-red-800" style={{ boxShadow: '4px 4px 0px 0px rgb(127 29 29)' }}>
            <div className="flex items-center gap-2">
              <PixelIcon name="heart" size={20} color="#dc2626" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="card-green" style={{ boxShadow: '4px 4px 0px 0px rgb(22 101 52)' }}>
            <div className="flex items-center gap-2">
              <PixelIcon name="star" size={20} color="#16a34a" />
              <p className="text-sm text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {user ? (
          // User is logged in, show join form
          <form onSubmit={handleJoinGroup} className="mt-8 space-y-6 card">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="btn-christmas disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <PixelIcon name="snowflake" size={16} color="#ffffff" />
                    <span>Joining...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <PixelIcon name="gift" size={16} color="#ffffff" />
                    <span>Join Group</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        ) : (
          // User is not logged in, show login/register options
          <div className="mt-8 space-y-6 card">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4 flex items-center justify-center gap-2">
                <PixelIcon name="snowflake" size={12} color="#16a34a" />
                You need to be logged in to join this group.
                <PixelIcon name="snowflake" size={12} color="#dc2626" />
              </p>
            </div>

            <div className="space-y-3">
              <a
                href={`/login?returnUrl=/join/${token}`}
                className="btn-primary block text-center"
              >
                Sign In
              </a>
              <a
                href={`/register?returnUrl=/join/${token}`}
                className="btn-secondary block text-center"
              >
                Create Account
              </a>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By joining this group, you agree to keep your Secret Santa assignment confidential.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinGroupPage;
