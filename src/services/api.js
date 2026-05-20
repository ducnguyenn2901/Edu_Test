import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu là lỗi 401 (Unauthorized) và KHÔNG phải là các request liên quan đến auth (đăng nhập/đăng ký)
    const isAuthRequest = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
    
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const questionApi = {
  getAll: (params) => api.get('/questions', { params }),
  getById: (id) => api.get(`/questions/${id}`),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
  flag: (id, reason) => api.post(`/questions/${id}/flag`, { reason }),
  review: (id, resolved) => api.post(`/questions/${id}/review`, { resolved }),
  export: () => api.get('/questions/export', { responseType: 'blob' }),
  import: (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.subject) formData.append('subject', options.subject);
    if (options.grade) formData.append('grade', options.grade);
    return api.post('/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const examApi = {
  getAll: (params) => api.get('/exams', { params }),
  getStudentDashboardStats: () => api.get('/exams/student-dashboard'),
  getMine: () => api.get('/exams/mine'),
  getById: (id, params) => api.get(`/exams/${id}`, { params }),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  clone: (id) => api.post(`/exams/${id}/clone`),
  createTemplate: (id) => api.post(`/exams/${id}/template`),
  submit: (id, payload) => api.post(`/exams/${id}/submit`, payload),
  getMyAttempts: () => api.get('/exams/attempts/mine'),
  getAttemptDetail: (examId, attemptId) =>
    api.get(`/exams/${examId}/attempts/${attemptId}`),
  getStats: (id) => api.get(`/exams/${id}/stats`),
  flag: (id, reason) => api.post(`/exams/${id}/flag`, { reason }),
  review: (id, resolved) => api.post(`/exams/${id}/review`, { resolved }),
};

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

export const adminApi = {
  getUsers: (params) => api.get('/users', { params }),
  createUser: (payload) => api.post('/users', payload),
  updateUser: (id, payload) => api.patch(`/users/${id}`, payload),
  toggleLockUser: (id) => api.patch(`/users/${id}/lock`),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getStats: (params) => api.get('/admin/stats', { params }),
  getReports: (params) => api.get('/admin/stats', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.put('/admin/settings', settings),
  exportAttempts: (params) =>
    api.get('/admin/attempts/export', { params, responseType: 'blob' }),
};

export const teacherApi = {
  getDashboardStats: () => api.get('/teachers/dashboard'),
  getStudentsByTeacher: (teacherId, params) =>
    api.get(`/teachers/${teacherId}/students`, { params }),
  updateStudents: (teacherId, studentIds) =>
    api.put(`/teachers/${teacherId}/students`, { studentIds }),
  getStudents: (params) => api.get('/users/students', { params }),
};

export const classroomApi = {
  getAll: (params) => api.get('/classrooms', { params }),
  getById: (id) => api.get(`/classrooms/${id}`),
  getByCode: (code) => api.get(`/classrooms/code/${code}`),
  create: (data) => api.post('/classrooms', data),
  update: (id, data) => api.put(`/classrooms/${id}`, data),
  delete: (id) => api.delete(`/classrooms/${id}`),
  join: (code) => api.post('/classrooms/join', { code }),
  approve: (classroomId, studentId, action) => 
    api.post('/classrooms/approve', { classroomId, studentId, action }),
  removeStudent: (classroomId, studentId) => 
    api.post('/classrooms/remove-student', { classroomId, studentId }),
  importStudents: (classroomId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/classrooms/${classroomId}/import-students`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importFromFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/classrooms/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const chatApi = {
  sendMessage: (data) => api.post('/chat/send', data),
  getCommunityMessages: (classroomId) => api.get(`/chat/community/${classroomId}`),
  getTeacherStudentMessages: (classroomId, recipientId) => 
    api.get(`/chat/teacher-student/${classroomId}/${recipientId}`),
  getStudentStudentMessages: (classroomId, recipientId) => 
    api.get(`/chat/student-student/${classroomId}/${recipientId}`),
  getParticipants: (classroomId) => api.get(`/chat/participants/${classroomId}`),
  pinMessage: (messageId) => api.put(`/chat/pin/${messageId}`),
  getPinnedMessages: (classroomId) => api.get(`/chat/pinned/${classroomId}`),
  toggleReaction: (messageId, emoji) => 
    api.post(`/chat/reaction/${messageId}`, { emoji }),
  markAsSeen: (messageId) => api.put(`/chat/seen/${messageId}`),
};

export default api;
