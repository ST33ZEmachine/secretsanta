import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import WishlistItemComponent from '../components/WishlistItem';
import WishlistForm from '../components/WishlistForm';
import Recommendations from '../components/Recommendations';
import PixelIcon from '../components/PixelIcon';
import PixelGift from '../components/PixelGift';

interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  link?: string;
  image_url?: string;
  secondhand_ok: boolean;
  is_purchased: boolean;
  purchased_by_me: boolean;
}

interface Participant {
  id: string;
  name: string;
  email: string;
}

const WishlistPage: React.FC = () => {
  const { groupId, participantId } = useParams<{ groupId: string; participantId?: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [canPurchase, setCanPurchase] = useState(false);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | undefined>(undefined);

  const fetchWishlist = React.useCallback(async () => {
    if (!groupId) {
      setError('Group ID is required');
      setLoading(false);
      return;
    }

    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If no user and viewing own wishlist, we need to wait
    if (!user && !participantId) {
      setError('You must be logged in to view your wishlist');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Get group data to find current user's participant ID
      const groupResponse = await apiService.getGroup(groupId);
      
      // Find current user's participant ID (only if user exists)
      const currentUserParticipant = user 
        ? groupResponse.participants.find((p: any) => p.user_id === user.id)
        : null;
      const currentUserParticipantId = currentUserParticipant?.id;
      setCurrentParticipantId(currentUserParticipantId);

      // Check if viewing own wishlist (either no participantId or participantId matches current user's)
      const isViewingOwnWishlist = !participantId || participantId === currentUserParticipantId;

      if (isViewingOwnWishlist) {
        if (!user) {
          setError('You must be logged in to view your wishlist');
          setLoading(false);
          return;
        }
        // Viewing own wishlist
        const response = await apiService.getMyWishlist(groupId);
        setItems(response.items);
        setParticipant(null);
        setCanPurchase(false);
        setIsOwner(true);
      } else {
        // Viewing someone else's wishlist
        if (!participantId) {
          setError('Participant ID is required');
          setLoading(false);
          return;
        }
        console.log('Fetching wishlist for participant:', participantId);
        console.log('Group participants:', groupResponse.participants.map((p: any) => ({ id: p.id, name: p.name })));
        const response = await apiService.getParticipantWishlist(participantId);
        console.log('Participant wishlist response:', response);
        console.log('Items received:', response.items);
        console.log('Items count:', response.items?.length || 0);
        setItems(response.items || []);
        
        // Get participant info
        const participantInfo = groupResponse.participants.find((p: any) => p.id === participantId);
        setParticipant(participantInfo || null);
        
        // Use canPurchase from API response
        setCanPurchase(response.canPurchase || false);
        setIsOwner(false);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to load wishlist';
      setError(errorMessage);
      console.error('Error loading wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId, participantId, user, authLoading]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleAddItem = async (itemData: Omit<WishlistItem, 'id' | 'is_purchased' | 'purchased_by_me'>) => {
    if (!groupId) return;

    try {
      setIsSaving(true);
      setError(null); // Clear any previous errors
      await apiService.addWishlistItem(groupId, itemData);
      setIsFormOpen(false);
      // Refresh wishlist after a short delay to avoid rate limiting
      setTimeout(() => {
        fetchWishlist();
      }, 500);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(err.response?.data?.error || 'Failed to add item');
      }
      console.error('Error adding item:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditItem = async (itemData: Omit<WishlistItem, 'id' | 'is_purchased' | 'purchased_by_me'>) => {
    if (!editingItem) return;

    try {
      setIsSaving(true);
      await apiService.updateWishlistItem(editingItem.id, itemData);
      setIsFormOpen(false);
      setEditingItem(null);
      fetchWishlist();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiService.deleteWishlistItem(itemId);
      fetchWishlist();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete item');
    }
  };

  const handleEdit = (item: WishlistItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSave = editingItem ? handleEditItem : handleAddItem;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="flex flex-col items-center gap-4">
            <PixelIcon name="snowflake" size={32} color="#dc2626" />
            <p className="text-gray-600 font-medium">Loading wishlist...</p>
          </div>
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
            onClick={() => {
              if (groupId) {
                navigate(`/group/${groupId}`);
              } else {
                navigate('/');
              }
            }}
            className="p-2 border-2 border-gray-300 hover:border-primary-600 text-gray-600 hover:text-primary-600 transition-all"
            style={{ boxShadow: '2px 2px 0px 0px rgb(156 163 175)' }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <PixelGift size={40} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {participant ? `${participant.name}'s Wishlist` : 'My Wishlist'}
                <PixelIcon name="star" size={20} color="#ffd700" />
              </h1>
              {participant && (
                <p className="mt-1 text-gray-600 flex items-center gap-2">
                  <PixelIcon name="snowflake" size={12} color="#16a34a" />
                  {participant.email}
                  <PixelIcon name="snowflake" size={12} color="#dc2626" />
                </p>
              )}
            </div>
          </div>
        </div>
        
        {isOwner && items.length > 0 && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-green-800 text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
            style={{ 
              boxShadow: '4px 4px 0px 0px rgb(22 101 52)',
              transform: 'translate(0, 0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '2px 2px 0px 0px rgb(22 101 52)';
              e.currentTarget.style.transform = 'translate(2px, 2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '4px 4px 0px 0px rgb(22 101 52)';
              e.currentTarget.style.transform = 'translate(0, 0)';
            }}
          >
            <Plus className="h-5 w-5" />
            Add Item
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="card border-red-800" style={{ boxShadow: '4px 4px 0px 0px rgb(127 29 29)' }}>
          <div className="flex items-center gap-2">
            <PixelIcon name="heart" size={20} color="#dc2626" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Wishlist Items */}
      {items.length === 0 ? (
        <div className="card text-center py-16">
          <div className="flex justify-center mb-4">
            <PixelGift size={80} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <PixelIcon name="tree" size={20} color="#16a34a" />
            {participant ? 'No wishlist items yet' : 'Your wishlist is empty'}
            <PixelIcon name="tree" size={20} color="#16a34a" />
          </h3>
          <p className="text-gray-600 mb-6">
            {participant 
              ? `${participant.name} hasn't added any items to their wishlist yet.`
              : 'Add items to help your Secret Santa know what you\'d like to receive!'
            }
          </p>
          {isOwner && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-christmas inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Item
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <WishlistItemComponent
              key={item.id}
              item={item}
              isOwner={isOwner}
              canPurchase={canPurchase}
              onEdit={handleEdit}
              onDelete={handleDeleteItem}
              onRefresh={fetchWishlist}
            />
          ))}
        </div>
      )}

      {/* Recommendations Section - Always show when viewing someone else's wishlist */}
      {participantId && !isOwner && (
        <div className="mt-6">
          <Recommendations 
            participantId={participantId} 
            currentParticipantId={currentParticipantId}
          />
        </div>
      )}

      {/* Wishlist Form */}
      <WishlistForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSave={handleSave}
        editingItem={editingItem}
        isLoading={isSaving}
      />
    </div>
  );
};

export default WishlistPage;
