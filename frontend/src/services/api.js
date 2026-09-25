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
   * Xóa lịch sử chat
   */
  clearHistory: (sessionId) =>
    request('DELETE', `/chat/history/${sessionId}`),
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
   * Upload và phân tích files
   * @param {FileList|File[]} files
   */
  analyze: async (files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: formData,
    });
    return res.json();
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
