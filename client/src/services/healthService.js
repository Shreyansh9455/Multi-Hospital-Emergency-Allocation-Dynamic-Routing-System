import api from './api';

/**
 * Health check service
 * Calls backend GET /api/health
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/api/health');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Unable to connect to server',
    };
  }
};
