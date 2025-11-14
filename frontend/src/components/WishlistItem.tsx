import React, { useState } from 'react';
import { Edit2, Trash2, ExternalLink, Image as ImageIcon, Check, X } from 'lucide-react';
import { apiService } from '../services/apiService';

interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  link?: string;
  image_url?: string;
  secondhand_ok: boolean;
  is_purchased: boolean;
  purchased_by_me: boolean;
  purchased_by_name?: string;
}

interface WishlistItemProps {
  item: WishlistItem;
  isOwner: boolean;
  canPurchase: boolean;
  onEdit: (item: WishlistItem) => void;
  onDelete: (itemId: string) => void;
  onRefresh: () => void;
}

const WishlistItemComponent: React.FC<WishlistItemProps> = ({
  item,
  isOwner,
  canPurchase,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkAsPurchased = async () => {
    if (!canPurchase) return;
    
    setIsMarking(true);
    try {
      if (item.purchased_by_me) {
        await apiService.unmarkItemAsPurchased(item.id);
      } else {
        await apiService.markItemAsPurchased(item.id);
      }
      onRefresh();
    } catch (error) {
      console.error('Error marking item:', error);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className={`card ${item.is_purchased && !isOwner ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            {item.secondhand_ok && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Secondhand OK
              </span>
            )}
            {item.is_purchased && !isOwner && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Purchased
              </span>
            )}
          </div>
          
          {item.description && (
            <p className="text-gray-600 mb-3">{item.description}</p>
          )}

          <div className="flex items-center gap-4 mb-3">
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                View Link
              </a>
            )}
            
            {item.image_url && (
              <a
                href={item.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm"
              >
                <ImageIcon className="h-4 w-4" />
                View Image
              </a>
            )}
          </div>

          {item.image_url && (
            <div className="mb-3">
              <img
                src={item.image_url}
                alt={item.title}
                className="max-w-xs max-h-32 object-cover rounded-md border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {canPurchase && (
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleMarkAsPurchased}
                disabled={isMarking}
                className={`p-2 rounded-md transition-colors border-2 ${
                  item.purchased_by_me
                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                    : item.is_purchased
                    ? 'bg-green-50 border-green-300 text-green-600'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-600'
                } disabled:opacity-50`}
                title={item.purchased_by_me ? 'Unmark as purchased' : item.is_purchased ? 'Already purchased' : 'Mark as purchased'}
              >
                {isMarking ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : item.purchased_by_me ? (
                  <X className="h-4 w-4" />
                ) : item.is_purchased ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="h-4 w-4 border-2 border-current rounded-sm" />
                )}
              </button>
              <span className="text-xs text-gray-500 text-center">
                {item.purchased_by_me ? 'Purchased' : item.is_purchased ? 'Purchased' : 'Mark as purchased'}
              </span>
            </div>
          )}
          
          {!canPurchase && item.is_purchased && (
            <div className="flex flex-col items-center gap-1">
              <div className="p-2 rounded-md bg-green-50 border-2 border-green-300 text-green-600">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-xs text-gray-500 text-center">
                Purchased
              </span>
            </div>
          )}

          {isOwner && (
            <>
              <button
                onClick={() => onEdit(item)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="Edit item"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistItemComponent;
