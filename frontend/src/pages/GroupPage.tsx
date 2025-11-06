import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { 
  UserPlus, 
  Sparkles, 
  AlertCircle, 
  CheckCircle,
  ArrowLeft 
} from 'lucide-react';
import PixelIcon from '../components/PixelIcon';
import PixelGift from '../components/PixelGift';

interface Group {
  id: string;
  name: string;
  description: string;
  max_participants: number;
  gifts_per_participant?: number;
  share_token: string;
  status: string;
  participant_count: number;
  joined_count: number;
  isOwner: boolean;
  isParticipant: boolean;
}

interface Participant {
  id: string;
  email: string;
  name: string;
  status: string;
  joined_at: string;
}

interface Assignment {
  receiverName: string;
  giftNumber: number;
}

// Generate consistent variant number from participant ID
const getVariantFromId = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Share link state
  const [shareUrl, setShareUrl] = useState('');
  const [showShareLink, setShowShareLink] = useState(false);
  
  // Assignment state
  const [assignmentsGenerated, setAssignmentsGenerated] = useState(false);
  const [generatingAssignments, setGeneratingAssignments] = useState(false);
  
  // Settings state
  const [giftsPerParticipant, setGiftsPerParticipant] = useState<number>(1);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    } else {
      setError('Group ID is required');
      setLoading(false);
    }
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getGroup(groupId!);
      setGroup(response.group);
      setParticipants(response.participants);
      
      // Set gifts_per_participant from group (default to 1 if not set)
      const giftsPerParticipantValue = 
        response.group.gifts_per_participant ?? 
        response.group.giftsPerParticipant ?? 
        1;
      // Ensure it's a number (API should return number, but handle string just in case)
      const numValue = typeof giftsPerParticipantValue === 'string' 
        ? parseInt(giftsPerParticipantValue, 10) 
        : Number(giftsPerParticipantValue);
      setGiftsPerParticipant(isNaN(numValue) ? 1 : numValue);
      
      // Check if assignments exist and fetch personal assignments
      try {
        const assignmentsResponse = await apiService.getMyAssignments(groupId!);
        setAssignments(assignmentsResponse.assignments);
        setAssignmentsGenerated(assignmentsResponse.assignments.length > 0);
      } catch (err) {
        // No assignments yet
        setAssignmentsGenerated(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const handleGetShareLink = async () => {
    try {
      const response = await apiService.getShareLink(groupId!);
      setShareUrl(response.shareUrl);
      setShowShareLink(true);
      return response.shareUrl;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get share link');
      return null;
    }
  };

  const copyShareLink = (url?: string) => {
    const linkToCopy = url || shareUrl;
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      setSuccess('Share link copied to clipboard!');
    }
  };

  const handleInviteClick = async () => {
    let url = shareUrl;
    if (!url) {
      url = await handleGetShareLink();
    }
    if (url) {
      copyShareLink(url);
    }
  };

  const handleGenerateAssignments = async () => {
    if (!window.confirm('Are you sure you want to generate Secret Santa assignments? This action cannot be undone.')) {
      return;
    }

    setGeneratingAssignments(true);
    setError('');

    try {
      await apiService.generateAssignments(groupId!);
      setSuccess('Secret Santa assignments generated successfully!');
      setAssignmentsGenerated(true);
      fetchGroupData(); // Refresh to show assignments
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate assignments');
    } finally {
      setGeneratingAssignments(false);
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

  if (!group) {
    return (
      <div className="text-center py-12 card">
        <PixelIcon name="heart" size={48} color="#dc2626" className="mx-auto mb-4" />
        <h3 className="mt-2 text-lg font-bold text-gray-900">Group not found</h3>
        <p className="mt-2 text-sm text-gray-600">
          The group you're looking for doesn't exist or you don't have access to it.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 border-2 border-gray-300 hover:border-primary-600 text-gray-600 hover:text-primary-600 transition-all"
            style={{ boxShadow: '2px 2px 0px 0px rgb(156 163 175)' }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <PixelGift size={40} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {group.name}
                {assignmentsGenerated && (
                  <PixelIcon name="star" size={20} color="#ffd700" />
                )}
              </h1>
              {group.description && (
                <p className="mt-1 text-gray-600 flex items-center gap-2">
                  <PixelIcon name="snowflake" size={12} color="#16a34a" />
                  {group.description}
                  <PixelIcon name="snowflake" size={12} color="#dc2626" />
                </p>
              )}
            </div>
          </div>
        </div>
        {group.isOwner && (
          <button
            onClick={handleInviteClick}
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-primary-800 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
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
            <UserPlus className="h-4 w-4" />
            <span className="text-xs">Invite ({group.joined_count}/{group.max_participants})</span>
          </button>
        )}
      </div>

      {/* Error and Success Messages */}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Manage My Wishlist */}
          <div className="card">
            <p className="text-sm text-gray-600 mb-4">
              Add items to help your Secret Santas know what you'd like to receive!
            </p>
            <button
              onClick={() => navigate(`/group/${groupId}/wishlist`)}
              className="btn-christmas flex items-center justify-center gap-2"
            >
              Manage My Wishlist
            </button>
          </div>

          {/* Assignments Not Generated Yet - For Non-Owners */}
          {!group.isOwner && !assignmentsGenerated && (
            <div className="card border-gold-600 bg-gold-50" style={{ boxShadow: '4px 4px 0px 0px rgb(217 119 6)' }}>
              <div className="flex items-start gap-3">
                <PixelIcon name="snowflake" size={24} color="#f59e0b" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gold-900 mb-2">
                    Waiting for Assignments
                  </h3>
                  <p className="text-sm text-gold-800">
                    The group owner hasn't generated the Secret Santa assignments yet. Once everyone has joined and the owner generates the assignments, you'll see who you're giving gifts to!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Assignments */}
          {group.isOwner && !assignmentsGenerated && (
            <div className="card-green">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PixelIcon name="star" size={24} color="#16a34a" />
                Generate Assignments
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="giftsPerParticipant" className="block text-sm font-medium text-gray-700 mb-2">
                    Gifts Per Participant
                  </label>
                  <select
                    id="giftsPerParticipant"
                    value={giftsPerParticipant}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      setGiftsPerParticipant(newValue);
                    }}
                    disabled={updatingSettings || assignmentsGenerated}
                    className="input-field"
                  >
                    <option value={1}>1 Gift</option>
                    <option value={2}>2 Gifts</option>
                    <option value={3}>3 Gifts</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Each participant will be Secret Santa for this many people
                  </p>
                  {giftsPerParticipant !== (group.gifts_per_participant ?? 1) && (
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={async () => {
                          setUpdatingSettings(true);
                          setError('');
                          setSuccess('');
                          try {
                            await apiService.updateGroup(groupId!, {
                              giftsPerParticipant: giftsPerParticipant,
                            });
                            // Refresh group data
                            await fetchGroupData();
                          } catch (err: any) {
                            setError(err.response?.data?.error || 'Failed to update settings');
                          } finally {
                            setUpdatingSettings(false);
                          }
                        }}
                        disabled={updatingSettings}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        {updatingSettings ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          setGiftsPerParticipant(group.gifts_per_participant ?? 1);
                        }}
                        disabled={updatingSettings}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600">
                  Once everyone has joined, generate the Secret Santa assignments. Each person will be assigned exactly {giftsPerParticipant} {giftsPerParticipant === 1 ? 'person' : 'people'} to give gifts to.
                </p>
                
                <button
                  onClick={handleGenerateAssignments}
                  disabled={generatingAssignments || group.joined_count < 3 || giftsPerParticipant !== (group.gifts_per_participant ?? 1)}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingAssignments ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    'Generate Assignments'
                  )}
                </button>
                
                {group.joined_count < 3 && (
                  <p className="text-sm text-gray-500">
                    Need at least 3 participants to generate assignments
                  </p>
                )}
              </div>
            </div>
          )}

          {/* My Assignments */}
          {(assignments.length > 0 || assignmentsGenerated) && (
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Your Secret Santa Assignments
              </h2>
              
              <div className="space-y-3">
                {assignments.length > 0 ? (
                  assignments.map((assignment, index) => {
                    // Find participant by name to get their ID for wishlist link
                    const participant = participants.find(p => 
                      p.name === assignment.receiverName || 
                      (p.name === null && p.email === assignment.receiverName)
                    );
                    
                    return (
                      <div key={index} className="p-4 border-2 border-primary-600 bg-primary-50" style={{ boxShadow: '4px 4px 0px 0px rgb(127 29 29)' }}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                            <PixelGift size={32} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xl font-bold text-primary-900 truncate">
                                {assignment.receiverName}
                              </p>
                            </div>
                          </div>
                          {participant && participant.status === 'joined' && (
                            <button
                              onClick={() => navigate(`/group/${groupId}/wishlist/${participant.id}`)}
                              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 border-2 border-green-800 transition-all flex-shrink-0"
                              style={{ boxShadow: '4px 4px 0px 0px rgb(22 101 52)' }}
                              title="View wishlist"
                            >
                              <span className="whitespace-nowrap">Wishlist</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 border-2 border-gold-600 bg-gold-50" style={{ boxShadow: '4px 4px 0px 0px rgb(217 119 6)' }}>
                    <div className="text-center">
                      <PixelIcon name="snowflake" size={32} color="#f59e0b" className="mx-auto mb-2" />
                      <p className="text-sm text-gold-900 font-medium mb-3">
                        Assignments have been generated! Please refresh the page to see your Secret Santa assignments.
                      </p>
                      <button
                        onClick={fetchGroupData}
                        className="btn-secondary text-sm"
                      >
                        Refresh Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-4 border-2 border-gold-600 bg-gold-50" style={{ boxShadow: '4px 4px 0px 0px rgb(217 119 6)' }}>
                <div className="flex items-start gap-2">
                  <PixelIcon name="heart" size={20} color="#f59e0b" />
                  <p className="text-sm text-gold-900 font-medium">
                    <strong>Remember:</strong> Keep your assignments secret! Don't tell anyone who you're giving gifts to.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Participants */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Participants ({participants.length})
            </h2>
            
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-3 border-2 border-gray-800 bg-white">
                  <div className="flex items-center space-x-3 flex-1 min-w-0 overflow-hidden">
                    <div className="flex-shrink-0">
                      <PixelIcon name="person" size={32} color="#dc2626" variant={getVariantFromId(participant.id)} />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden" title={participant.email}>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {participant.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  {participant.status === 'joined' && (
                    <button
                      onClick={() => navigate(`/group/${groupId}/wishlist/${participant.id}`)}
                      className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary-600 hover:text-primary-800 border-2 border-primary-300 hover:border-primary-600 transition-all flex-shrink-0 ml-2"
                      style={{ boxShadow: '2px 2px 0px 0px rgb(185 28 28)' }}
                      title="View wishlist"
                    >
                      <span className="hidden sm:inline">Wishlist</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;
