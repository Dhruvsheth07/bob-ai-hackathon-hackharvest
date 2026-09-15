const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const getHeaders = (isFormData = false) => {
  const userStr = localStorage.getItem('optimizer_user');
  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.access_token) {
        headers['Authorization'] = `Bearer ${user.access_token}`;
      }
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }
  
  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    // Clear auth and trigger a reload or event so the app redirects to login
    localStorage.removeItem('optimizer_user');
    window.dispatchEvent(new Event('auth-error'));
    throw new Error('Unauthorized');
  }
  
  if (!response.ok) {
    let errorMessage = 'API Request Failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // Not JSON
    }
    throw new Error(errorMessage);
  }
  
  return await response.json();
};

export const apiClient = {
  get: async (endpoint) => {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await handleResponse(response);
    return { data };
  },
  
  post: async (endpoint, data, options = {}) => {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    
    // Check if it's form data (like for login)
    const isFormData = data instanceof URLSearchParams || data instanceof FormData;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data),
      ...options
    });
    
    const responseData = await handleResponse(response);
    return { data: responseData };
  },

  put: async (endpoint, data) => {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const responseData = await handleResponse(response);
    return { data: responseData };
  },

  delete: async (endpoint) => {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const responseData = await handleResponse(response);
    return { data: responseData };
  }
};
