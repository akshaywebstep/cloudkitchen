import axios from 'axios';

// Get base URL from environment variables with fallback
const getBaseUrl = () => {
  let envUrl = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.API_BASE_URL || 'https://dev2.screeningstar.co.in/api/v1';
  // Remove trailing slashes
  envUrl = envUrl.replace(/\/+$/, '');
  if (!envUrl.endsWith('/api/v1')) {
    envUrl = `${envUrl}/api/v1`;
  }
  return envUrl;
};

const API_BASE_URL = getBaseUrl();

// Create Axios Instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Login Admin API
 * @param {string} username - User email / username
 * @param {string} password - User password
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const loginApi = async (username, password) => {
  try {
    const response = await apiClient.post('/admin/auth/login', {
      username,
      password,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error.message || 'Failed to connect to authentication server.',
    };
  }
};

/**
 * Verify Admin Auth Token API
 * @param {string} token - JWT Bearer token
 * @returns {Promise<Object>} Response object { status, message, admin }
 */
export const verifyTokenApi = async (token) => {
  try {
    if (!token) {
      return { status: false, message: 'No auth token provided' };
    }
    const response = await apiClient.get('/admin/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error.message || 'Token verification failed.',
    };
  }
};

/**
 * Forgot Password API
 * @param {string} username - Account email / username
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const forgotPasswordApi = async (username) => {
  try {
    const response = await apiClient.post('/admin/auth/forgot-password', {
      username,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error.message || 'Failed to send password reset request.',
    };
  }
};

/**
 * Reset Password API
 * @param {string} token - Reset token
 * @param {string} password - New password
 * @param {string} confirmPassword - Confirmation password
 * @returns {Promise<Object>} Response object { status, message }
 */
export const resetPasswordApi = async (token, password, confirmPassword) => {
  try {
    const response = await apiClient.post('/admin/auth/reset-password', {
      token,
      password,
      confirmPassword,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error.message || 'Failed to reset password.',
    };
  }
};

/**
 * Fetch All Kitchens List API
 * @param {Object} [params] - Optional query params like { page, limit, search, status }
 * @returns {Promise<Object>} Response object { status, message, data, meta }
 */
export const getKitchensApi = async (params = {}) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/kitchen', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error.message || 'Failed to fetch kitchens list.',
    };
  }
};

/**
 * Fetch Single Kitchen by ID API
 * @param {string|number} id - Kitchen ID
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const getKitchenByIdApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(`/admin/kitchen/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error.message || 'Failed to fetch kitchen details.',
    };
  }
};

/**
 * Create Kitchen API (Multipart / FormData)
 * @param {FormData} formData - Kitchen creation form data
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const createKitchenApi = async (formData) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.post('/admin/kitchen', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error.message || 'Failed to create kitchen.',
    };
  }
};

/**
 * Update Kitchen by ID API (PUT / Multipart / FormData)
 * @param {string|number} id - Kitchen ID
 * @param {FormData} formData - Kitchen update form data
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const updateKitchenApi = async (id, formData) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.put(`/admin/kitchen/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      status: false,
      message: error.message || 'Failed to update kitchen.',
    };
  }
};

/**
 * Fetch Ingredients List API
 * @param {Object} [params] - Query params like { page, limit, search, status }
 * @returns {Promise<Object>} Response object { status, message, data, meta }
 */
export const getIngredientsApi = async (params = {}) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/ingredient', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch ingredients.' };
  }
};

/**
 * Fetch Ingredient by ID API
 * @param {string|number} id
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const getIngredientByIdApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(`/admin/ingredient/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch ingredient details.' };
  }
};

/**
 * Create Ingredient API
 * @param {Object|FormData} data - { name, category, image, imageFile, status } or FormData
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const createIngredientApi = async (data) => {
  try {
    const token = localStorage.getItem('admin_token');
    let payload = data;
    let headers = { Authorization: `Bearer ${token}` };

    if (data instanceof FormData) {
      payload = data;
      headers['Content-Type'] = 'multipart/form-data';
    } else if (data && typeof data === 'object') {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.category) formData.append('category', data.category);
      if (data.status) formData.append('status', data.status);

      let isMultipart = false;
      if (data.imageFile instanceof File || data.imageFile instanceof Blob) {
        formData.append('image', data.imageFile);
        isMultipart = true;
      } else if (typeof data.image === 'string' && data.image.startsWith('data:image/')) {
        const binaryFile = dataURLtoFile(data.image, 'ingredient_image');
        if (binaryFile) {
          formData.append('image', binaryFile);
          isMultipart = true;
        }
      } else if (typeof data.image === 'string' && data.image) {
        formData.append('image', data.image);
        isMultipart = true;
      }

      if (isMultipart) {
        payload = formData;
        headers['Content-Type'] = 'multipart/form-data';
      }
    }

    const response = await apiClient.post('/admin/ingredient', payload, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to create ingredient.' };
  }
};

/**
 * Update Ingredient by ID API
 * @param {string|number} id
 * @param {Object|FormData} data - { name, category, image, imageFile, status } or FormData
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const updateIngredientApi = async (id, data) => {
  try {
    const token = localStorage.getItem('admin_token');
    let payload = data;
    let headers = { Authorization: `Bearer ${token}` };

    if (data instanceof FormData) {
      payload = data;
      headers['Content-Type'] = 'multipart/form-data';
    } else if (data && typeof data === 'object') {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.category) formData.append('category', data.category);
      if (data.status) formData.append('status', data.status);

      let isMultipart = false;
      if (data.imageFile instanceof File || data.imageFile instanceof Blob) {
        formData.append('image', data.imageFile);
        isMultipart = true;
      } else if (typeof data.image === 'string' && data.image.startsWith('data:image/')) {
        const binaryFile = dataURLtoFile(data.image, 'ingredient_image');
        if (binaryFile) {
          formData.append('image', binaryFile);
          isMultipart = true;
        }
      } else if (typeof data.image === 'string' && data.image) {
        formData.append('image', data.image);
        isMultipart = true;
      }

      if (isMultipart) {
        payload = formData;
        headers['Content-Type'] = 'multipart/form-data';
      }
    }

    const response = await apiClient.put(`/admin/ingredient/${id}`, payload, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to update ingredient.' };
  }
};

/**
 * Delete Ingredient by ID API
 * @param {string|number} id
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const deleteIngredientApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.delete(`/admin/ingredient/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to delete ingredient.' };
  }
};

/**
 * Fetch All Branches List API
 * @param {Object} [params] - Optional query params like { page, limit, search, userId }
 * @returns {Promise<Object>} Response object { status, message, data, meta }
 */
export const getBranchesApi = async (params = {}) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/branch', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch branches.' };
  }
};

/**
 * Fetch Branch by ID API
 * @param {string|number} id
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const getBranchByIdApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(`/admin/branch/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch branch details.' };
  }
};

/**
 * Create Branch API
 * @param {Object} data
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const createBranchApi = async (data) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.post('/admin/branch', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to create branch.' };
  }
};

/**
 * Update Branch by ID API
 * @param {string|number} id
 * @param {Object} data
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const updateBranchApi = async (id, data) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.put(`/admin/branch/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to update branch.' };
  }
};

/**
 * Delete Branch by ID API
 * @param {string|number} id
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const deleteBranchApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.delete(`/admin/branch/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to delete branch.' };
  }
};

/**
 * Save Kitchen Inventory API (Assign ingredients & units per branch)
 * @param {string|number} kitchenId
 * @param {string|number} branchId
 * @param {Array} ingredients - [{ id, unit }]
 * @returns {Promise<Object>} Response object
 */
export const saveKitchenInventoryApi = async (kitchenId, branchId, ingredients) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.post(
      `/admin/ingredient/${kitchenId}/${branchId}/inventory`,
      { ingredients },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to save inventory.' };
  }
};

/**
 * Save Kitchen Stock API (Update ingredient stocks & expiry per branch)
 * @param {string|number} kitchenId
 * @param {string|number} branchId
 * @param {Array} stocks - [{ id, stock, expireAt }]
 * @returns {Promise<Object>} Response object
 */
export const saveKitchenStockApi = async (kitchenId, branchId, stocks) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.post(
      `/admin/ingredient/${kitchenId}/${branchId}/stock`,
      { stocks },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to save stock.' };
  }
};

/**
 * Fetch Kitchen Inventory Units API
 * @param {string|number} kitchenId
 * @param {string|number} branchId
 * @returns {Promise<Object>} Response object
 */
export const getKitchenInventoryApi = async (kitchenId, branchId) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(
      `/admin/ingredient/${kitchenId}/${branchId}/inventory`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch inventory.' };
  }
};

/**
 * Fetch Kitchen Stock API
 * @param {string|number} kitchenId
 * @param {string|number} branchId
 * @returns {Promise<Object>} Response object
 */
export const getKitchenStockApi = async (kitchenId, branchId) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(
      `/admin/ingredient/${kitchenId}/${branchId}/stock`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch stock.' };
  }
};

/**
 * Fetch Kitchen Ingredients by Kitchen & Branch API
 * @param {string|number} kitchenId
 * @param {string|number} branchId
 * @returns {Promise<Object>} Response object
 */
export const getKitchenIngredientsApi = async (kitchenId, branchId) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(
      `/admin/ingredient/${kitchenId}/${branchId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch kitchen ingredients.' };
  }
};

/**
 * Fetch Cuisines List API
 * @param {Object} [params] - Optional query params like { page, limit, search, status }
 * @returns {Promise<Object>} Response object { status, message, data, meta }
 */
export const getCuisinesApi = async (params = { limit: 200 }) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/cuisine', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch cuisines.' };
  }
};

/**
 * Fetch Cuisine by ID API
 * @param {string|number} id
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const getCuisineByIdApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(`/admin/cuisine/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch cuisine details.' };
  }
};

/**
 * Helper to convert Base64 data URL to a binary File object
 */
export const dataURLtoFile = (dataurl, filename = 'image.jpg') => {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const ext = mime.split('/')[1] || 'jpg';
    return new File([u8arr], `${filename}.${ext}`, { type: mime });
  } catch (err) {
    return null;
  }
};

/**
 * Create Cuisine API (Sends binary FormData)
 * @param {Object|FormData} data - { name, image, imageFile, status } or FormData
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const createCuisineApi = async (data) => {
  try {
    const token = localStorage.getItem('admin_token');
    let payload = data;
    let headers = { Authorization: `Bearer ${token}` };

    if (data instanceof FormData) {
      payload = data;
      headers['Content-Type'] = 'multipart/form-data';
    } else if (data && typeof data === 'object') {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.status) formData.append('status', data.status);

      if (data.imageFile instanceof File || data.imageFile instanceof Blob) {
        formData.append('image', data.imageFile);
        payload = formData;
        headers['Content-Type'] = 'multipart/form-data';
      } else if (typeof data.image === 'string' && data.image.startsWith('data:image/')) {
        const binaryFile = dataURLtoFile(data.image, 'cuisine_image');
        if (binaryFile) {
          formData.append('image', binaryFile);
          payload = formData;
          headers['Content-Type'] = 'multipart/form-data';
        }
      } else if (typeof data.image === 'string' && data.image) {
        formData.append('image', data.image);
        payload = formData;
        headers['Content-Type'] = 'multipart/form-data';
      }
    }

    const response = await apiClient.post('/admin/cuisine', payload, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to create cuisine.' };
  }
};

/**
 * Update Cuisine by ID API (Sends binary FormData)
 * @param {string|number} id
 * @param {Object|FormData} data - { name, image, imageFile, status } or FormData
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const updateCuisineApi = async (id, data) => {
  try {
    const token = localStorage.getItem('admin_token');
    let payload = data;
    let headers = { Authorization: `Bearer ${token}` };

    if (data instanceof FormData) {
      payload = data;
      headers['Content-Type'] = 'multipart/form-data';
    } else if (data && typeof data === 'object') {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.status) formData.append('status', data.status);

      if (data.imageFile instanceof File || data.imageFile instanceof Blob) {
        formData.append('image', data.imageFile);
        payload = formData;
        headers['Content-Type'] = 'multipart/form-data';
      } else if (typeof data.image === 'string' && data.image.startsWith('data:image/')) {
        const binaryFile = dataURLtoFile(data.image, 'cuisine_image');
        if (binaryFile) {
          formData.append('image', binaryFile);
          payload = formData;
          headers['Content-Type'] = 'multipart/form-data';
        }
      } else if (typeof data.image === 'string' && data.image) {
        formData.append('image', data.image);
        payload = formData;
        headers['Content-Type'] = 'multipart/form-data';
      }
    }

    const response = await apiClient.put(`/admin/cuisine/${id}`, payload, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to update cuisine.' };
  }
};

/**
 * Delete Cuisine by ID API
 * @param {string|number} id
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const deleteCuisineApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.delete(`/admin/cuisine/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to delete cuisine.' };
  }
};

/**
 * Fetch All Menu Items API
 * @param {Object} [params] - Optional query parameters like { page, limit, search, kitchenId, branchId }
 * @returns {Promise<Object>} Response object { status, message, data, meta }
 */
export const getMenuItemsApi = async (params = { limit: 200 }) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/menu/menu-item', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch menu items.' };
  }
};

/**
 * Fetch Menu Items By Kitchen ID API (GET /admin/menu/menu-item/:kitchenId)
 * @param {string|number} kitchenId - Kitchen ID
 * @param {Object} [params] - Optional query parameters
 * @returns {Promise<Object>} Response object { status, message, data, meta }
 */
export const getMenuItemsByKitchenApi = async (kitchenId, params = { limit: 200 }) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(`/admin/menu/menu-item/${kitchenId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch kitchen menu items.' };
  }
};

/**
 * Fetch Menu Items By Kitchen ID and Branch ID API (GET /admin/menu/menu-item/:kitchenId/:branchId)
 * @param {string|number} kitchenId - Kitchen ID
 * @param {string|number} branchId - Branch ID
 * @param {Object} [params] - Optional query parameters
 * @returns {Promise<Object>} Response object { status, message, data, meta }
 */
export const getMenuItemsByKitchenAndBranchApi = async (kitchenId, branchId, params = { limit: 200 }) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(`/admin/menu/menu-item/${kitchenId}/${branchId}`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch branch menu items.' };
  }
};

/**
 * Create Menu Item API (Supports JSON or binary FormData)
 * @param {Object|FormData} data - Menu item creation payload
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const createMenuItemApi = async (data) => {
  try {
    const token = localStorage.getItem('admin_token');
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
    };
    const response = await apiClient.post('/admin/menu/menu-item', data, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to create menu item.' };
  }
};

/**
 * Update Menu Item API (Supports JSON or binary FormData)
 * @param {string|number} id - Menu Item ID
 * @param {Object|FormData} data - Menu item update payload
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const updateMenuItemApi = async (id, data) => {
  try {
    const token = localStorage.getItem('admin_token');
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
    };
    const response = await apiClient.put(`/admin/menu/menu-item/${id}`, data, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to update menu item.' };
  }
};

/**
 * Delete Menu Item API
 * @param {string|number} id - Menu Item ID
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const deleteMenuItemApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.delete(`/admin/menu/menu-item/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to delete menu item.' };
  }
};

/**
 * Fetch Menu List API (GET /admin/menu)
 * @param {Object} [params] - Optional query parameters like { page, limit, search, status }
 * @returns {Promise<Object>} Response object { status, message, data, meta }
 */
export const getMenuListApi = async (params = { limit: 200 }) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/menu', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch menu list.' };
  }
};

/**
 * Fetch All Menu Categories API
 * @param {Object} [params] - Optional query parameters like { page, limit, search, status }
 * @returns {Promise<Object>} Response object { status, message, data, meta }
 */
export const getMenuCategoriesApi = async (params = { limit: 200 }) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/menu', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch menu categories.' };
  }
};

/**
 * Fetch Menu Category By ID API (GET /admin/menu/:id)
 * @param {string|number} id - Category ID
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const getMenuCategoryByIdApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(`/admin/menu/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch menu category details.' };
  }
};

/**
 * Create Menu Category API (Supports JSON or binary FormData)
 * @param {Object|FormData} data - Category creation payload
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const createMenuCategoryApi = async (data) => {
  try {
    const token = localStorage.getItem('admin_token');
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
    };
    const response = await apiClient.post('/admin/menu', data, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to create menu category.' };
  }
};

/**
 * Update Menu Category API (Supports JSON or binary FormData)
 * @param {string|number} id - Category ID
 * @param {Object|FormData} data - Category update payload
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const updateMenuCategoryApi = async (id, data) => {
  try {
    const token = localStorage.getItem('admin_token');
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
    };
    const response = await apiClient.put(`/admin/menu/${id}`, data, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to update menu category.' };
  }
};

/**
 * Delete Menu Category API
 * @param {string|number} id - Category ID
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const deleteMenuCategoryApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.delete(`/admin/menu/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to delete menu category.' };
  }
};

/**
 * Fetch All Orders API (GET /admin/order)
 * @param {Object} [params] - Query parameters like { page, limit, search, status }
 * @returns {Promise<Object>} Response object { status, message, data, meta }
 */
export const getOrdersApi = async (params = { limit: 200 }) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/order', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch orders list.' };
  }
};

/**
 * Fetch Single Order Details API (GET /admin/order/:id)
 * @param {string|number} id - Order ID
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const getOrderByIdApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(`/admin/order/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch order details.' };
  }
};

/**
 * Update Order Status API (PATCH /admin/order/:id/status)
 * @param {string|number} id - Order ID
 * @param {string|Object} data - Update payload or status string
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const updateOrderStatusApi = async (id, data) => {
  try {
    const token = localStorage.getItem('admin_token');
    const payload = typeof data === 'string' ? { status: data } : data;
    const response = await apiClient.patch(`/admin/order/${id}/status`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to update order status.' };
  }
};

/**
 * Bulk Update Order Status API (PATCH /admin/order/bulk-status)
 * @param {Array<string|number>} orderIds - Array of Order IDs
 * @param {string} status - New order status
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const updateOrderBulkStatusApi = async (orderIds, status) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.patch('/admin/order/bulk-status', { orderIds, status }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to update bulk order status.' };
  }
};

/**
 * Delete Order API (DELETE /admin/order/:id)
 * @param {string|number} id - Order ID
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const deleteOrderApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.delete(`/admin/order/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to delete order.' };
  }
};

/**
 * Fetch All Subscriptions API (GET /admin/subscription)
 * @param {Object} [params] - Query parameters like { page, limit, search }
 * @returns {Promise<Object>} Response object { status, message, data, meta }
 */
export const getSubscriptionsApi = async (params = {}) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/subscription', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch subscriptions.' };
  }
};

/**
 * Fetch Single Subscription by ID API (GET /admin/subscription/:id)
 * @param {string|number} id - Subscription ID
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const getSubscriptionByIdApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(`/admin/subscription/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch subscription details.' };
  }
};

/**
 * Create Subscription Plan API (POST /admin/subscription)
 * @param {Object} data - Subscription creation payload
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const createSubscriptionApi = async (data) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.post('/admin/subscription', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to create subscription plan.' };
  }
};

/**
 * Update Subscription Plan API (PUT /admin/subscription/:id)
 * @param {string|number} id - Subscription ID
 * @param {Object} data - Subscription update payload
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const updateSubscriptionApi = async (id, data) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.put(`/admin/subscription/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to update subscription plan.' };
  }
};

/**
 * Delete Subscription Plan API (DELETE /admin/subscription/:id)
 * @param {string|number} id - Subscription ID
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const deleteSubscriptionApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.delete(`/admin/subscription/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to delete subscription plan.' };
  }
};

/**
 * Fetch Admin Dashboard Stats API (GET /admin/dashboard/stats)
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const getDashboardStatsApi = async () => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch dashboard stats.' };
  }
};

/**
 * Fetch Admin Waste Logs API (GET /admin/waste)
 * @param {Object} [params] - Query parameters { kitchenId, branchId, reason, page, limit, search }
 * @returns {Promise<Object>} Response object { status, message, summary, data, meta }
 */
export const getWasteLogsApi = async (params = {}) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/waste', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch waste logs.' };
  }
};

/**
 * Fetch Waste Log by ID API (GET /admin/waste/:id)
 * @param {string|number} id - Waste log ID
 * @returns {Promise<Object>} Response object { status, message, data }
 */
export const getWasteLogByIdApi = async (id) => {
  try {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get(`/admin/waste/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) return error.response.data;
    return { status: false, message: error.message || 'Failed to fetch waste log details.' };
  }
};

export default apiClient;
