import api from './api';

/**
 * Case service to interact with /api/cases
 */
export const getCases = async (params = {}) => {
  try {
    const response = await api.get('/api/cases', { params });
    return { success: true, data: response.data.data, count: response.data.count };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch emergency cases',
    };
  }
};

export const getCaseById = async (id) => {
  try {
    const response = await api.get(`/api/cases/${id}`);
    return { success: true, data: response.data.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch case details',
    };
  }
};

export const createCase = async (caseData) => {
  try {
    const response = await api.post('/api/cases', caseData);
    return { success: true, data: response.data.data, triageDetails: response.data.triageDetails };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to create emergency case',
    };
  }
};

/**
 * Triage an existing case (Day 7)
 */
export const triageCase = async (id) => {
  try {
    const response = await api.post(`/api/cases/${id}/triage`);
    return {
      success: true,
      data: response.data.data,
      triageDetails: response.data.triageDetails,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to triage case',
    };
  }
};

/**
 * Dispatch case to best hospital and idle ambulance (Day 8, 9, 10)
 */
export const dispatchCase = async (id, method = 'priority') => {
  try {
    const response = await api.post(`/api/cases/${id}/dispatch?method=${method}`);
    return {
      success: true,
      data: response.data.data,
      dispatchLog: response.data.dispatchLog,
      allocationDetails: response.data.allocationDetails,
      message: response.data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to dispatch case',
    };
  }
};
