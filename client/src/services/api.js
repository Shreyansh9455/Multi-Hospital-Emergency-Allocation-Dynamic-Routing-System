import axios from 'axios';

// Backend Base URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token automatically if stored
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('med_dispatch_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error Response:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

/* ==========================================================================
   AUTH API HELPERS (Day 25 & 26)
   ========================================================================== */
export const loginUser = async (email, password) => {
  try {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data.token) {
      localStorage.setItem('med_dispatch_token', res.data.token);
      localStorage.setItem('med_dispatch_user', JSON.stringify(res.data.user));
    }
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const registerUser = async (userData) => {
  try {
    const res = await apiClient.post('/auth/register', userData);
    if (res.data.token) {
      localStorage.setItem('med_dispatch_token', res.data.token);
      localStorage.setItem('med_dispatch_user', JSON.stringify(res.data.user));
    }
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const getCurrentUser = async () => {
  try {
    const res = await apiClient.get('/auth/me');
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

/* ==========================================================================
   ANALYTICS API HELPERS (Day 23 & 24)
   ========================================================================== */
export const getAnalyticsSummary = async () => {
  try {
    const res = await apiClient.get('/analytics/summary');
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const seedHistoricalLogs = async () => {
  try {
    const res = await apiClient.post('/analytics/seed-logs');
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

/* ==========================================================================
   HEALTH API HELPERS
   ========================================================================== */
export const checkHealth = async () => {
  try {
    const res = await apiClient.get('/health');
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

/* ==========================================================================
   HOSPITAL API HELPERS
   ========================================================================== */
export const getHospitals = async (params = {}) => {
  try {
    const res = await apiClient.get('/hospitals', { params });
    // Log to console as requested in Day 11 verification
    console.log('✅ [API GET /api/hospitals] Fetched hospitals successfully:', res.data);
    return { success: true, data: res.data.data, count: res.data.count };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const getHospitalById = async (id) => {
  try {
    const res = await apiClient.get(`/hospitals/${id}`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const updateHospital = async (id, updateData) => {
  try {
    const res = await apiClient.put(`/hospitals/${id}`, updateData);
    return { success: true, data: res.data.data, message: res.data.message };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

/* ==========================================================================
   CASE API HELPERS
   ========================================================================== */
export const getCases = async (params = {}) => {
  try {
    const res = await apiClient.get('/cases', { params });
    return { success: true, data: res.data.data, count: res.data.count };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const getCaseById = async (id) => {
  try {
    const res = await apiClient.get(`/cases/${id}`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const createCase = async (caseData) => {
  try {
    const res = await apiClient.post('/cases', caseData);
    return {
      success: true,
      data: res.data.data,
      triageDetails: res.data.triageDetails,
      message: res.data.message,
    };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const triageCase = async (id) => {
  try {
    const res = await apiClient.post(`/cases/${id}/triage`);
    return {
      success: true,
      data: res.data.data,
      triageDetails: res.data.triageDetails,
      message: res.data.message,
    };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const dispatchCase = async (id, method = 'priority') => {
  try {
    const res = await apiClient.post(`/cases/${id}/dispatch?method=${method}`);
    return {
      success: true,
      data: res.data.data,
      dispatchLog: res.data.dispatchLog,
      allocationDetails: res.data.allocationDetails,
      message: res.data.message,
    };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

/* ==========================================================================
   AMBULANCE API HELPERS
   ========================================================================== */
export const getAmbulances = async (params = {}) => {
  try {
    const res = await apiClient.get('/ambulances', { params });
    return { success: true, data: res.data.data, count: res.data.count };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const getAmbulanceById = async (id) => {
  try {
    const res = await apiClient.get(`/ambulances/${id}`);
    return { success: true, data: res.data.data };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const createAmbulance = async (ambulanceData) => {
  try {
    const res = await apiClient.post('/ambulances', ambulanceData);
    return { success: true, data: res.data.data, message: res.data.message };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const updateAmbulance = async (id, updateData) => {
  try {
    const res = await apiClient.put(`/ambulances/${id}`, updateData);
    return { success: true, data: res.data.data, message: res.data.message };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export const updateAmbulanceStatus = async (id, status) => {
  try {
    const res = await apiClient.put(`/ambulances/${id}/status`, { status });
    return { success: true, data: res.data.data, message: res.data.message };
  } catch (err) {
    return { success: false, error: err.response?.data?.message || err.message };
  }
};

export default apiClient;
