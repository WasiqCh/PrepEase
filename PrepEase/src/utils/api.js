import axios from "axios";

// Axios instance for the PrepEase API
const api = axios.create({
  baseURL: "http://localhost:5001/api",
});

// Attach JWT token to every request if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// Material API
export const materialAPI = {
  upload: (formData) => api.post('/materials/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getAll: () => api.get('/materials'),
  getById: (id) => api.get(`/materials/${id}`),
  delete: (id) => api.delete(`/materials/${id}`),
};

// Course API
export const courseAPI = {
  create: (data) => api.post('/courses', data),
  getAll: () => api.get('/courses'),
  getByCode: (courseCode) => api.get(`/courses/${courseCode}`),
};
