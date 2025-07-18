import axios from 'axios';

// Create an instance of axios
const api = axios.create({
  // ✨ FIX: Point directly to the backend server's address and port.
  // This ensures all API calls from the frontend go to the correct server.
  baseURL: 'https://exam-6m1b.onrender.com', 
  headers: {
    'Content-Type': 'application/json',
  },
});

/*
  Intercepts every request and adds the JWT token to the
  Authorization header if it exists in localStorage.
*/
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
