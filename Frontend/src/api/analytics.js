import api from './axios';

export const getAnalytics = async (month = null, year = null, days = null) => {
  let url = '/analytics?';
  if (month && year) {
    url += `month=${month}&year=${year}`;
  } else if (days) {
    url += `days=${days}`;
  }
  const response = await api.get(url);
  return response.data;
};

export const downloadDailyReportCSV = async (month = null, year = null, days = null) => {
  let url = '/analytics/download/daily/csv?';
  if (month && year) {
    url += `month=${month}&year=${year}`;
  } else if (days) {
    url += `days=${days}`;
  }

  const response = await api.get(url, {
    responseType: 'blob'
  });

  const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = urlBlob;
  link.setAttribute('download', `daily-report-${month || days || 'current'}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(urlBlob);
};

export const downloadMonthlyReportExcel = async (month = null, year = null) => {
  let url = '/analytics/download/monthly/excel?';
  if (month && year) {
    url += `month=${month}&year=${year}`;
  }

  const response = await api.get(url, {
    responseType: 'blob'
  });

  const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = urlBlob;
  link.setAttribute('download', `monthly-report-${month || 'current'}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(urlBlob);
};

