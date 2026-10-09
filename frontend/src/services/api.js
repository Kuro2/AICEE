// ==============================
// AICEE Frontend API Service
// ==============================

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Helpers ──────────────────────────────────────────────

const getToken = () => localStorage.getItem('aicee_token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

async function request(method, path, body = null) {
  const options = {
    method,
    headers: authHeaders(),
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.message || `HTTP ${res.status}`);
      error.data = data;
      throw error;
    }
    return data;
  } catch (err) {
    // Trả về lỗi có cấu trúc để frontend xử lý
    throw err;
  }
}

// ── Auth API ─────────────────────────────────────────────

export const authAPI = {
  /**
   * Đăng nhập, lưu token vào localStorage
   */
  login: async (email, password) => {
    const res = await request('POST', '/auth/login', { email, password });
    if (res.success) {
      localStorage.setItem('aicee_token', res.data.token);
      localStorage.setItem('aicee_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  /**
   * Đăng ký tài khoản mới
   */
  register: async (email, password, name) => {
    const res = await request('POST', '/auth/register', { email, password, name });
    if (res.success) {
      localStorage.setItem('aicee_token', res.data.token);
      localStorage.setItem('aicee_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  /**
   * Đăng nhập bằng Google
   */
  googleLogin: async (token) => {
    const res = await request('POST', '/auth/google', { token });
    if (res.success) {
      localStorage.setItem('aicee_token', res.data.token);
      localStorage.setItem('aicee_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  /**
   * Đăng nhập bằng Facebook
   */
  facebookLogin: async (accessToken) => {
    const res = await request('POST', '/auth/facebook', { accessToken });
    if (res.success) {
      localStorage.setItem('aicee_token', res.data.token);
      localStorage.setItem('aicee_user', JSON.stringify(res.data.user));
    }
    return res;
  },

  /**
   * Lấy thông tin user hiện tại
   */
  getMe: () => request('GET', '/auth/me'),

  /**
   * Cập nhật thông tin profile
   * @param {Object} data - { name, avatar }
   */
  updateProfile: async (data) => {
    const res = await request('PUT', '/auth/profile', data);
    if (res.success && res.data?.user) {
      const currentUser = authAPI.getCurrentUser() || {};
      const updated = { ...currentUser, ...res.data.user };
      localStorage.setItem('aicee_user', JSON.stringify(updated));
    }
    return res;
  },

  /**
   * Đổi mật khẩu
   * @param {Object} data - { currentPassword, newPassword }
   */
  changePassword: (data) => request('PUT', '/auth/change-password', data),

  /**
   * Đăng xuất, xóa token
   */
  logout: () => {
    localStorage.removeItem('aicee_token');
    localStorage.removeItem('aicee_user');
  },

  /**
   * Kiểm tra user đã đăng nhập chưa
   */
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('aicee_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  isLoggedIn: () => !!getToken(),
};

// ── Chat AI API ───────────────────────────────────────────

export const chatAPI = {
  /**
   * Gửi tin nhắn tới AI
   * @param {string} message - Nội dung tin nhắn
   * @param {string} sessionId - Session ID để duy trì lịch sử
   * @param {Array} files - Mảng {name, type, content} của file đính kèm
   */
  send: (message, sessionId = null, files = null) =>
    request('POST', '/chat', {
      message,
      sessionId,
      ...(files && files.length > 0 ? { files } : {}),
    }),

  /**
   * Lấy lịch sử chat
   */
  getHistory: (sessionId) => request('GET', `/chat/history/${sessionId}`),

  /**
   * Lấy danh sách dòng thời gian Nhật ký tư vấn AI kèm thống kê
   */
  getFeed: (sessionId = null) => {
    const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
    return request('GET', `/chat/feed${q}`);
  },

  /**
   * Xóa một mục trong nhật ký tư vấn
   */
  deleteItem: (id) => request('DELETE', `/chat/message/${id}`),

  /**
   * Xóa toàn bộ lịch sử chat
   */
  clearHistory: (sessionId) =>
    request('DELETE', `/chat/history/${sessionId}`),

  /**
   * Lấy danh sách các phiên chat của tài khoản Premium
   */
  getSessions: () => request('GET', '/chat/sessions'),

  /**
   * Lấy chi tiết phiên chat
   */
  getSessionDetail: (sessionId) => request('GET', `/chat/sessions/${sessionId}`),

  /**
   * Xóa phiên chat đã lưu
   */
  deleteSession: (sessionId) => request('DELETE', `/chat/sessions/${sessionId}`),

  /**
   * Đổi tên phiên chat
   */
  renameSession: (sessionId, title) =>
    request('PATCH', `/chat/sessions/${sessionId}`, { title }),
};

// ── Scan API ──────────────────────────────────────────────

export const scanAPI = {
  /** Kiểm tra URL */
  url: (url) => request('POST', '/scan/url', { url }),

  /** Kiểm tra email */
  email: (email, subject = '', body = '') =>
    request('POST', '/scan/email', { email, subject, body }),

  /** Kiểm tra số điện thoại */
  phone: (phone) => request('POST', '/scan/phone', { phone }),

  /** Quét nhanh (auto-detect) */
  quick: (input) => request('POST', '/scan/quick', { input }),
};

// ── News API ──────────────────────────────────────────────

export const newsAPI = {
  /** Lấy danh sách tin tức */
  getAll: (page = 1, limit = 10, category = null, search = null) => {
    const params = new URLSearchParams({ page, limit });
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return request('GET', `/news?${params.toString()}`);
  },

  /** Lấy chi tiết tin tức */
  getById: (id) => request('GET', `/news/${id}`),

  /** Lấy danh sách categories */
  getCategories: () => request('GET', '/news/categories'),

  /** Đăng ký nhận bản tin */
  subscribe: (email) => request('POST', '/news/subscribe', { email }),
};

// ── Upload API ────────────────────────────────────────────

export const uploadAPI = {
  /**
   * Upload và phân tích files kèm lưu lịch sử chat
   * @param {FileList|File[]} files
   * @param {string|null} sessionId
   * @param {string} message
   * @param {Array} previews
   */
  analyze: async (files, sessionId = null, message = '', previews = []) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));
    if (sessionId) formData.append('sessionId', sessionId);
    if (message) formData.append('message', message);
    if (previews && previews.length > 0) {
      formData.append('previews', JSON.stringify(previews));
    }

    const token = getToken();
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return res.json();
  },

  /**
   * Upload 1 file ảnh (dùng cho ảnh bìa tin tức, banner...)
   */
  uploadImage: async (file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Lỗi tải ảnh (${res.status})`);
    }
    return data;
  },
};

// ── Health Check ──────────────────────────────────────────

export const healthAPI = {
  check: () => request('GET', '/health'),
};

// ── Resource API ──────────────────────────────────────────

export const resourceAPI = {
  /**
   * Lấy danh sách an toàn/không an toàn
   * @param {boolean} isSafe - true cho danh sách an toàn, false cho danh sách không an toàn, bỏ trống để lấy tất cả
   */
  getResources: (isSafe) => {
    let url = '/resources';
    if (isSafe !== undefined) {
      url += `?isSafe=${isSafe}`;
    }
    return request('GET', url);
  },
  
  createResource: (data) => request('POST', '/resources', data),
  updateResource: (id, data) => request('PUT', `/resources/${id}`, data),
  deleteResource: (id) => request('DELETE', `/resources/${id}`),
};

// ── Admin API ─────────────────────────────────────────────
export const adminAPI = {
  getStats: () => request('GET', '/admin/stats'),
  getUsers: (page = 1, limit = 20) => request('GET', `/admin/users?page=${page}&limit=${limit}`),
  changeUserRole: (id, role) => request('PUT', `/admin/users/${id}/role`, { role }),
  deleteUser: (id) => request('DELETE', `/admin/users/${id}`),
  
  // Admin News CRUD (calls the new protected news endpoints)
  createNews: (data) => request('POST', '/news', data),
  updateNews: (id, data) => request('PUT', `/news/${id}`, data),
  deleteNews: (id) => request('DELETE', `/news/${id}`)
};

// ── Subscription API ──────────────────────────────────────
export const subscriptionAPI = {
  getSubscription: () => request('GET', '/subscription'),
  upgradePlan: (plan) => request('POST', '/subscription/upgrade', { plan })
};

// ── Payment API (SePay QR Banking) ───────────────────────────
export const paymentAPI = {
  createOrder: (plan, billingCycle = 'monthly') =>
    request('POST', '/payment/create-order', { plan, billingCycle }),

  checkStatus: (orderCode) =>
    request('GET', `/payment/check-status/${orderCode}`),

  simulatePayment: (orderCode) =>
    request('POST', `/payment/simulate/${orderCode}`),

  getBankInfo: () =>
    request('GET', '/payment/bank-info'),

  create: (planType) => request('POST', '/payment/create', { planType }),
  getOrderDetail: (orderId) => request('GET', `/payment/order/${orderId}`),
  getHistory: () => request('GET', '/payment/history'),
  simulate: (orderId, status = 'success') =>
    request('POST', '/payment/simulate', { orderId, status }),
};

// ── Report API ───────────────────────────────────────────────
export const reportAPI = {
  /**
   * Gửi báo cáo lừa đảo mới (hỗ trợ FormData kèm files)
   */
  submit: async (formData) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Lỗi ${res.status}`);
    }
    return data;
  },

  /**
   * Gửi yêu cầu xem xét / báo cáo nhanh qua JSON (không đính kèm file)
   */
  createQuick: (data) => request('POST', '/reports', data),

  /**
   * Lấy danh sách báo cáo (Admin)
   */
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.status) searchParams.append('status', params.status);
    if (params.type) searchParams.append('type', params.type);
    if (params.search) searchParams.append('search', params.search);
    const queryString = searchParams.toString();
    return request('GET', `/reports${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Lấy chi tiết báo cáo
   */
  getById: (id) => request('GET', `/reports/${id}`),

  /**
   * Admin duyệt báo cáo & tự động đưa vào blacklist
   */
  approve: (id, adminNote = '') => request('POST', `/reports/${id}/approve`, { adminNote }),

  /**
   * Admin từ chối báo cáo
   */
  reject: (id, adminNote = '') => request('POST', `/reports/${id}/reject`, { adminNote }),

  /**
   * Xóa báo cáo
   */
  delete: (id) => request('DELETE', `/reports/${id}`),
};
