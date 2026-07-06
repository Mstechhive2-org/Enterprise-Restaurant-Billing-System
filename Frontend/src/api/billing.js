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
  const data = response.data;
  try {
    if (data && Array.isArray(data) && data.length > 0 && typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('msbillings_spaces');
      let floors = [];
      if (saved) {
        try { floors = JSON.parse(saved); } catch(e){}
      }
      if (!Array.isArray(floors) || floors.length === 0) {
        floors = [{ id: 'f-1', name: 'Ground Floor', tables: [], cabins: [], sofas: [] }];
      }
      let updated = false;
      data.forEach(order => {
        if (!order.tableNo || order.tableNo.startsWith('TAK-') || order.tableNo.startsWith('DEL-')) return;
        let floorName = 'Ground Floor';
        let tableName = order.tableNo;
        if (order.tableNo.includes(' - ')) {
          const parts = order.tableNo.split(' - ');
          floorName = parts[0].trim();
          tableName = parts.slice(1).join(' - ').trim();
        }
        let targetFloor = floors.find(f => f.name.toLowerCase() === floorName.toLowerCase());
        if (!targetFloor) {
          targetFloor = { id: Date.now().toString() + Math.random().toString().slice(2,5), name: floorName, tables: [], cabins: [], sofas: [] };
          floors.push(targetFloor);
          updated = true;
        }
        const allSpaces = [...(targetFloor.tables||[]), ...(targetFloor.cabins||[]), ...(targetFloor.sofas||[])];
        if (!allSpaces.some(s => s.name.toLowerCase() === tableName.toLowerCase())) {
          targetFloor.tables = targetFloor.tables || [];
          targetFloor.tables.push({ id: Date.now().toString() + Math.random().toString().slice(2,5), name: tableName });
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('msbillings_spaces', JSON.stringify(floors));
        window.dispatchEvent(new Event('spacesUpdated'));
        api.post('/config/info', { spaces: floors }).catch(()=>{});
      }
    }
  } catch (err) {}
  return data;
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
