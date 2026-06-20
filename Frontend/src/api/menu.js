import api from './axios';

// Simple cache
let menuCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getMenuItems = async (forceRefresh = false) => {
  const now = Date.now();

  if (!forceRefresh && menuCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return menuCache;
  }

  const response = await api.get('/menu');
  menuCache = response.data;
  cacheTimestamp = now;
  return response.data;
};

export const addMenuItem = async (itemData) => {
  const response = await api.post('/menu', itemData);
  menuCache = null; // Clear cache
  return response.data;
};

export const updateMenuItem = async (id, itemData) => {
  const response = await api.put(`/menu/${id}`, itemData);
  menuCache = null; // Clear cache
  return response.data;
};

export const deleteMenuItem = async (id) => {
  const response = await api.delete(`/menu/${id}`);
  menuCache = null; // Clear cache
  return response.data;
};

export const deleteAllMenuItems = async () => {
  const response = await api.delete('/menu/all');
  menuCache = null;
  return response.data;
};
