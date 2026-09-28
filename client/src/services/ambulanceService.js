import api from './api';

/**
 * Ambulance service to interact with /api/ambulances
 */
export const getAmbulances = async (params = {}) => {
  try {
    const response = await api.get('/api/ambulances', { params });
    return { success: true, data: response.data.data, count: response.data.count };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch ambulances',
    };
  }
};

export const getAmbulanceById = async (id) => {
  try {
    const response = await api.get(`/api/ambulances/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch ambulance',
    };
  }
};

export const createAmbulance = async (ambulanceData) => {
  try {
    const response = await api.post('/api/ambulances', ambulanceData);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to register ambulance',
    };
  }
};

export const updateAmbulance = async (id, updateData) => {
  try {
    const response = await api.put(`/api/ambulances/${id}`, updateData);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update ambulance',
    };
  }
};

export const updateAmbulanceStatus = async (id, status) => {
  try {
    const response = await api.put(`/api/ambulances/${id}/status`, { status });
    return { success: true, data: response.data.data, message: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update ambulance status',
    };
  }
};
