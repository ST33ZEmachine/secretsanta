import axios from 'axios';

class ApiService {
  private api: any;
  private token: string | null = null;

  constructor() {
    // Use environment variable for API URL in production, or /api for development
    const apiBaseURL = import.meta.env.VITE_API_URL || '/api';
    
    this.api = axios.create({
      baseURL: apiBaseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config: any) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.setToken('');
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.api.post('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(name: string) {
    const response = await this.api.put('/auth/profile', {
      name,
    });
    return response.data;
  }

  // Group endpoints
  async createGroup(groupData: {
    name: string;
    description?: string;
    maxParticipants?: number;
    giftsPerParticipant?: number;
  }) {
    const response = await this.api.post('/groups', groupData);
    return response.data;
  }

  async getMyGroups() {
    const response = await this.api.get('/groups/my-groups');
    return response.data;
  }

  async getGroup(groupId: string) {
    const response = await this.api.get(`/groups/${groupId}`);
    return response.data;
  }

  async updateGroup(groupId: string, groupData: {
    name?: string;
    description?: string;
    maxParticipants?: number;
    giftsPerParticipant?: number;
  }) {
    const response = await this.api.put(`/groups/${groupId}`, groupData);
    return response.data;
  }

  async deleteGroup(groupId: string) {
    const response = await this.api.delete(`/groups/${groupId}`);
    return response.data;
  }

  async getShareLink(groupId: string) {
    const response = await this.api.get(`/groups/${groupId}/share-link`);
    return response.data;
  }

  // Participant endpoints
  async joinGroup(shareToken: string, userId: string, name: string) {
    const response = await this.api.post(`/participants/join/${shareToken}`, {
      userId,
      name,
    });
    return response.data;
  }

  async generateAssignments(groupId: string) {
    const response = await this.api.post(`/participants/generate-assignments/${groupId}`);
    return response.data;
  }

  async clearAssignments(groupId: string) {
    const response = await this.api.delete(`/participants/clear-assignments/${groupId}`);
    return response.data;
  }

  async getMyAssignments(groupId: string) {
    const response = await this.api.get(`/participants/my-assignments/${groupId}`);
    return response.data;
  }

  async getAllAssignments(groupId: string) {
    const response = await this.api.get(`/participants/all-assignments/${groupId}`);
    return response.data;
  }

  async verifyAssignments(groupId: string) {
    const response = await this.api.get(`/participants/verify-assignments/${groupId}`);
    return response.data;
  }

  // Wishlist endpoints
  async getMyWishlist(groupId: string) {
    const response = await this.api.get(`/wishlist/my-wishlist/${groupId}`);
    return response.data;
  }

  async getParticipantWishlist(participantId: string) {
    const response = await this.api.get(`/wishlist/participant/${participantId}`);
    return response.data;
  }

  async addWishlistItem(groupId: string, itemData: {
    title: string;
    description?: string;
    link?: string;
    image_url?: string;
    secondhand_ok?: boolean;
  }) {
    const response = await this.api.post('/wishlist/items', {
      groupId,
      ...itemData,
    });
    return response.data;
  }

  async updateWishlistItem(itemId: string, itemData: {
    title: string;
    description?: string;
    link?: string;
    image_url?: string;
    secondhand_ok?: boolean;
  }) {
    const response = await this.api.put(`/wishlist/items/${itemId}`, itemData);
    return response.data;
  }

  async deleteWishlistItem(itemId: string) {
    const response = await this.api.delete(`/wishlist/items/${itemId}`);
    return response.data;
  }

  async markItemAsPurchased(itemId: string, notes?: string) {
    const response = await this.api.post(`/wishlist/items/${itemId}/purchase`, {
      notes,
    });
    return response.data;
  }

  async unmarkItemAsPurchased(itemId: string) {
    const response = await this.api.delete(`/wishlist/items/${itemId}/purchase`);
    return response.data;
  }

  // Recommendation endpoints
  async getRecommendations(participantId: string) {
    const response = await this.api.get(`/recommendations/participant/${participantId}`);
    return response.data;
  }

  async addRecommendation(participantId: string, recommendationData: {
    title: string;
    description?: string;
    link?: string;
    image_url?: string;
  }) {
    const response = await this.api.post(`/recommendations/participant/${participantId}`, recommendationData);
    return response.data;
  }

  async deleteRecommendation(recommendationId: string) {
    const response = await this.api.delete(`/recommendations/${recommendationId}`);
    return response.data;
  }
}

export const apiService = new ApiService();
