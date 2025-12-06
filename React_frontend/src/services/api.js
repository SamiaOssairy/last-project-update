import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  signup: async (data) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },
  
  login: async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
};

// Member APIs
export const memberAPI = {
  getAllMembers: async () => {
    const response = await api.get('/members');
    return response.data;
  },
  
  createMember: async (data) => {
    const response = await api.post('/members', data);
    return response.data;
  },
};

// Member Type APIs
export const memberTypeAPI = {
  getAllMemberTypes: async () => {
    const response = await api.get('/memberTypes');
    return response.data;
  },
};

export default api;
