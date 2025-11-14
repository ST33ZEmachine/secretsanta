import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  link?: string;
  image_url?: string;
  secondhand_ok: boolean;
}

interface WishlistFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<WishlistItem, 'id'>) => void;
  editingItem?: WishlistItem | null;
  isLoading?: boolean;
}

const WishlistForm: React.FC<WishlistFormProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    image_url: '',
    secondhand_ok: false,
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        description: editingItem.description || '',
        link: editingItem.link || '',
        image_url: editingItem.image_url || '',
        secondhand_ok: editingItem.secondhand_ok,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        link: '',
        image_url: '',
        secondhand_ok: false,
      });
    }
  }, [editingItem, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onSave({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      link: formData.link.trim() || undefined,
      image_url: formData.image_url.trim() || undefined,
      secondhand_ok: formData.secondhand_ok,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {editingItem ? 'Edit Wishlist Item' : 'Add Wishlist Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="What would you like?"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-field resize-none"
              placeholder="Additional details, size, color, etc."
            />
          </div>

          <div>
            <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">
              Link
            </label>
            <input
              type="url"
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              className="input-field"
              placeholder="https://example.com/product"
            />
          </div>

          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              className="input-field"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="secondhand_ok"
                checked={formData.secondhand_ok}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                I'm okay with secondhand/used items
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Check this if you'd be happy with a used or secondhand version of this item.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={isLoading || !formData.title.trim()}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WishlistForm;
