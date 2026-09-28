import api from './api';

/**
 * Hospital service to interact with /api/hospitals
 */
export const getHospitals = async (params = {}) => {
  try {
    const response = await api.get('/api/hospitals', { params });
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch hospitals',
    };
  }
};

export const getHospitalById = async (id) => {
  try {
    const response = await api.get(`/api/hospitals/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch hospital',
    };
  }
};

export const updateHospital = async (id, updateData) => {
  try {
    const response = await api.put(`/api/hospitals/${id}`, updateData);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to update hospital',
    };
  }
};
