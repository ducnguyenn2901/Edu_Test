import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const csrfCookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith('edutest_csrf='))
    ?.split('=')[1];

  if (csrfCookie) {
    config.headers['X-CSRF-Token'] = decodeURIComponent(csrfCookie);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu là lỗi 401 (Unauthorized) và KHÔNG phải là các request liên quan đến auth (đăng nhập/đăng ký)
    const url = error?.config?.url || '';
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export const questionApi = {
  getAll: (params) => api.get('/questions', { params }),
  getById: (id) => api.get(`/questions/${id}`),
  create: (data) => api.post('/questions', data),
  update: (id, data) => api.put(`/questions/${id}`, data),
  delete: (id) => api.delete(`/questions/${id}`),
  deleteBulk: (ids) => api.post('/questions/bulk-delete', { ids }),
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
  createWithFiles: (dataOrFormData, files = []) => {
    let formData;
    if (dataOrFormData instanceof FormData) {
      formData = dataOrFormData;
    } else {
      formData = new FormData();
      formData.append('examData', JSON.stringify(dataOrFormData));
      files.forEach((file) => {
        formData.append('files', file);
      });
    }
    return api.post('/exams/with-files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  parse: (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.subject) formData.append('subject', options.subject);
    if (options.grade) formData.append('grade', options.grade);
    return api.post('/exams/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  import: (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.subject) formData.append('subject', options.subject);
    if (options.grade) formData.append('grade', options.grade);
    return api.post('/exams/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  importParsed: (data) => api.post('/exams/import', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  clone: (id) => api.post(`/exams/${id}/clone`),
  createTemplate: (id) => api.post(`/exams/${id}/template`),
  submit: (id, payload) => api.post(`/exams/${id}/submit`, payload),
  getMyAttempts: () => api.get('/exams/attempts/mine'),
  getAttemptDetail: (examId, attemptId) => api.get(`/exams/${examId}/attempts/${attemptId}`),
  getStats: (id) => api.get(`/exams/${id}/stats`),
  flag: (id, reason) => api.post(`/exams/${id}/flag`, { reason }),
  review: (id, resolved) => api.post(`/exams/${id}/review`, { resolved }),
};

export const examFolderApi = {
  getMine: () => api.get('/exam-folders/mine'),
  create: (payload) => api.post('/exam-folders', payload),
  update: (id, payload) => api.put(`/exam-folders/${id}`, payload),
  delete: (id) => api.delete(`/exam-folders/${id}`),
};

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  getSubjects: () => api.get('/auth/subjects'),
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
  exportAttempts: (params) => api.get('/admin/attempts/export', { params, responseType: 'blob' }),
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
  getStats: (classroomId) => api.get(`/chat/stats/${classroomId}`),
  recallMessage: (messageId) => api.post(`/chat/messages/${messageId}/recall`),
};

export default api;
