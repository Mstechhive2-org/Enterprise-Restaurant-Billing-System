import api from './axios';

export const getActiveOrder = async (tableNo) => {
  const response = await api.get(`/bills/active/${tableNo}`);
  return response.data;
};

export const saveOrder = async (orderData) => {
  const response = await api.post('/bills/save', orderData);
  return response.data;
};

export const generateBill = async (id, billData) => {
  const response = await api.post(`/bills/generate/${id}`, billData);
  return response.data;
};

export const settleBill = async (id, paymentData) => {
  const response = await api.post(`/bills/settle/${id}`, paymentData);
  return response.data;
};

export const apiReopenOrder = async (id) => {
  const response = await api.post(`/bills/reopen/${id}`);
  return response.data;
};

export const apiCancelOrder = async (id) => {
  const response = await api.post(`/bills/cancel/${id}`);
  return response.data;
};

export const apiTransferTable = async (id, newTableNo) => {
  const response = await api.post(`/bills/transfer/${id}`, { newTableNo });
  return response.data;
};

export const getOpenOrders = async () => {
  const response = await api.get('/bills/open');
  return response.data;
};

export const getBills = async (page = 1, limit = 50, search = '') => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (search) params.append('search', search);
  const response = await api.get(`/bills?${params.toString()}`);
  return response.data;
};

export const getBillById = async (id) => {
  const response = await api.get(`/bills/${id}`);
  return response.data;
};

export const deleteBill = async (id) => {
  const response = await api.delete(`/bills/${id}`);
  return response.data;
};

export const getDailyStats = async () => {
  const response = await api.get('/bills/stats');
  return response.data;
};

export const apiGenerateKOT = async (id, cartItems) => {
  const response = await api.post(`/bills/kot/${id}`, { items: cartItems });
  return response.data;
};

export const apiGetTodayKOTs = async (date = '', search = '') => {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (search) params.append('search', search);
  
  const response = await api.get(`/bills/kots/today?${params.toString()}`);
  return response.data;
};
